# SOP — Flow venta → invitación → activación (3 bugs raíz fixed 2026-06-18)

Esta SOP documenta los 3 bugs raíz que detectó Marco probando el flow end-to-end real de venta-a-alumno-activado, sus diagnósticos por base de datos y los fixes que quedaron en `main` (commits `663e4a4`, `25cd24b` OS · `24f4b16`, `568bde1` App).

Vale como referencia para que estos 3 bugs nunca vuelvan a aparecer ni se introduzcan variantes nuevas.

---

## Bug #1 — Email no llegaba al alumno (race condition serverless)

**Síntoma**: el closer registraba la venta, el modal mostraba "Venta registrada ✓ email enviado al alumno", pero el correo nunca aparecía en la bandeja del alumno.

**Diagnóstico por BD** (`email_logs`):

```sql
select template, status, error, sent_at
from email_logs
where to_email = 'marcoantonio@n-vision.cc'
order by sent_at desc;
```

Resultado: `status=failed`, `error="Unable to fetch data. The request could not be resolved."` — Resend nunca recibió el request.

**Causa raíz**: el endpoint `/api/admin/sales/register` disparaba `sendWelcomeAlumnoHT(...)` y `notifyMarcoPurchase(...)` **sin `await`** (fire-and-forget). Vercel terminaba la función serverless antes de que el `fetch` a Resend completara → la promesa quedaba abortada.

**Fix** (`src/app/api/admin/sales/register/route.ts`):

```ts
const [welcomeResult, notifResult] = await Promise.allSettled([
  sendWelcomeAlumnoHT({ ... }),
  notifyMarcoPurchase({ ... }),
])

const welcomeOk = welcomeResult.status === "fulfilled" && welcomeResult.value.ok

return NextResponse.json({
  ok: true,
  email_sent: welcomeOk,
  email_error: welcomeOk ? null : <mensaje>,
  invite_url: acceptUrl,  // sigue saliendo siempre, para fallback manual
  ...
})
```

**Regla operativa**: en endpoints serverless, **NUNCA disparar emails (ni cualquier `fetch` externo crítico) sin `await`**. Promise.allSettled si son varios; el endpoint puede tardar 1-2s más pero el email llega siempre.

---

## Bug #2 — Invite huérfano tras delete+readd del contacto

**Síntoma**: Marco borraba el contacto del CRM, lo volvía a crear, recibía el email (status=sent en `email_logs`) pero al hacer click veía **"Invitación no válida — Invitacion no encontrada"** en la App.

**Diagnóstico por BD** (`student_invites`):

```sql
select id, token, accepted_at, created_at
from student_invites
where email = 'marcoantonio@n-vision.cc'
order by created_at desc;
```

Resultado: **solo 1 row**, aunque deberían haber sido 2 (una por cada venta registrada).

**Causa raíz**: existe un unique index en `student_invites`:

```sql
create unique index uniq_student_invites_email_pending
  on public.student_invites(lower(email))
  where accepted_at is null;
```

Cuando el closer registra la segunda venta:
1. El endpoint genera `token_B` localmente
2. `INSERT INTO student_invites (token: token_B, ...)` → **falla** por el unique index (ya hay un invite pendiente del email)
3. El endpoint **no chequeaba** el error del insert → seguía ejecutando
4. `sendWelcomeAlumnoHT({ inviteUrl: token_B })` → el email sale con un token que **no existe en BD**
5. Cuando el alumno hace click, el GET del OS devuelve "no encontrada" porque el token huérfano no está en `student_invites`

**Fix** (`src/app/api/admin/sales/register/route.ts`):

```ts
// Invalida todos los pendientes del email ANTES de insertar el nuevo
await admin
  .from("student_invites")
  .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
  .ilike("email", email)
  .is("accepted_at", null)

// Ahora el INSERT puede proceder
const { error: inviteInsertError } = await admin.from("student_invites").insert({ ... })
if (inviteInsertError) {
  return NextResponse.json({
    error: "No se pudo generar la invitación. Revisa si el alumno ya tiene cuenta activa.",
    detail: inviteInsertError.message,
  }, { status: 500 })
}
```

**Regla operativa**: cuando un schema tiene constraints de unicidad parciales (`WHERE accepted_at IS NULL`, `WHERE status='active'`, etc.), todo INSERT que pueda chocar debe **invalidar el row previo primero** o **chequear el error explícitamente**.

---

## Bug #3 — DELETE de contacto no era cascade

**Síntoma**: Marco borraba un contacto y al volver a registrar la venta con el mismo email, el endpoint generaba un email con un token huérfano (Bug #2 se disparaba). El delete del contacto solo borraba el row de `contacts` y dejaba basura suelta.

**Causa raíz**: el endpoint `DELETE /api/admin/contacts/[id]` solo hacía:

```ts
await admin.from("contacts").delete().eq("id", id)
```

Pero **no limpiaba**:
- `student_invites` con ese email (la FK es `on delete set null`, no `cascade`)
- `contact_journey_events` con ese `contact_id`

Eso dejaba el sistema en un estado donde el closer no podía registrar la venta de nuevo.

**Fix** (`src/app/api/admin/contacts/[id]/route.ts`):

```ts
const { data: contact } = await admin
  .from("contacts").select("email").eq("id", id).maybeSingle()

if (contact?.email) {
  await admin.from("student_invites").delete()
    .ilike("email", contact.email.toLowerCase().trim())
}

await admin.from("contact_journey_events").delete().eq("contact_id", id)

await admin.from("contacts").delete().eq("id", id)
```

**Decisión consciente — NO borrar `auth.users`**:
Borrar la cuenta del alumno activado es una **decisión separada** que debe hacerse desde `/admin/users` con confirmación explícita. Razón: si un alumno ya activó y por error el closer borra el contacto en CRM, no perdemos su acceso a la App.

**Regla operativa**: el DELETE de cualquier entidad raíz (`contacts`, `users`, `formations`, etc.) debe **listar explícitamente todas las tablas hijas que limpia y por qué**. Nunca confiar en `on delete cascade` solo — preferimos cleanup explícito en el endpoint para tener control + log.

---

## Bug #4 — UI mostraba "ya fue usada" tras activar OK

**Síntoma**: tras crear la contraseña y clickar "Activar mi cuenta", la pantalla mostraba **"Invitación no válida — Esta invitacion ya fue usada"** aunque en BD `student_invites.accepted_at` estaba bien marcado y la cuenta funcionaba.

**Causa raíz**: en `AcceptInvitePage.tsx` (App), el orden de los `if` era:

```tsx
if (info === null) return <Loader />
if (!info.valid) return <Error />        // ← este se evaluaba ANTES
if (success) return <CuentaActivada />   // ← este NUNCA se llegaba a render
```

Después del POST exitoso, un re-render disparaba el `useEffect` del GET de nuevo, este devolvía 409 ("ya fue usada" porque `accepted_at` se acababa de marcar), `setInfo({valid:false})` → pantalla de error aunque la activación había sido OK.

**Fix**:

```tsx
// success ANTES que !info.valid (orden crítico)
if (success || submitting) return <CuentaActivada />
if (info === null) return <Loader />
if (!info.valid) return <Error />
```

**Regla operativa**: en cualquier flow de mutación + re-validación (activar / aceptar invitación / confirmar email), la pantalla de "éxito" debe evaluarse **antes** que la pantalla de validación de estado, porque la validación se queda desfasada por definición (el token recién se invalidó como parte del éxito).

---

## Trazabilidad de los commits

| Commit | Repo | Bug |
|--------|------|-----|
| `663e4a4` | OS | #1 race condition emails + tel obligatorio + UI fields contraste + magic link debug |
| `25cd24b` | OS | #2 invite huérfano + #3 contact DELETE cascade |
| `24f4b16` | App | trim whitespace del token en AcceptInvite |
| `568bde1` | App | #4 orden if (success antes que info.valid) |

---

## Cómo verificar manualmente el flow end-to-end

1. Registra una venta nueva en `ecoai.capitalhubapp.com/sistema/ventas` con un email de prueba real (que tú controles)
2. Revisa BD: debe haber 1 row en `student_invites` con ese email, `accepted_at=null`, `expires_at` 7 días en el futuro
3. Revisa BD: debe haber 1 row en `email_logs` con `template=welcome_alumno_ht`, `status=sent`, `resend_id` no null
4. Abre el email, click en "Activar mi acceso ahora"
5. La App debe cargar AcceptInvitePage con tu nombre + producto + 2 inputs password
6. Pon password ≥8 chars, "Activar mi cuenta"
7. Verás pantalla "¡Cuenta activada!" 800ms → redirect a `/onboarding`
8. Revisa BD: `student_invites.accepted_at` no-null, `user_id` no-null, `users` row creado, `auth.users` con email confirmado

Si alguno de esos pasos falla → consulta esta SOP para diagnóstico rápido.
