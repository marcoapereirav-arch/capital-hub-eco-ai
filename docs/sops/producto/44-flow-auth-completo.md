---
title: Flow de autenticación completo (token-based, sin Supabase emails)
order: 44
area: producto
---

# Auth de Capital Hub OS

Sistema token-based donde **Supabase Auth NO envía ningún email**. Todos los correos (reset, confirmación, invitación, futuro magic-link) salen por Resend con tokens propios, con throttle anti-abuso y auto-suppression por bounce/complaint.

## Para qué sirve

- Control total del copy + branding de cada email
- No dependencia del SMTP/template engine de Supabase
- Higiene de entregabilidad: emails que rebotan se bloquean automáticamente
- Trazabilidad: cada envío se loguea + cada evento webhook (delivered/opened/clicked/bounced/complained) se persiste

## Arquitectura

```
Usuario hace acción → /api/auth/<flujo>/request → token en BD → Resend envía
                                                                        ↓
                                                                  webhook actualiza
                                                                  email_messages + email_suppressions
Usuario clica link → /auth/<flujo>?token=... → /api/auth/<flujo>/confirm
                                                  ↓
                                            Admin API de Supabase ejecuta acción real
                                            (updateUserById, email_confirm, etc.)
```

## Tablas (migración `20260617135405_email_token_based.sql`)

| Tabla | Para qué |
|---|---|
| `auth_tokens` | tokens single-use con TTL. Tipos: `password_reset`, `email_confirmation`, `invitation`, `magic_link` |
| `email_messages` | log de cada envío (resend_id, status, errores) |
| `email_events` | historial bruto de eventos del webhook de Resend |
| `email_suppressions` | emails bloqueados — `sendEmail()` consulta esta tabla ANTES de cada envío |

RLS habilitado en las cuatro. **Ninguna policy** → solo el service role (que bypassa RLS) opera. No hay acceso desde el cliente.

## Endpoints

### Reset de contraseña
- `POST /api/auth/reset-password/request` — recibe `{ email }`, throttle 3 req/10min por email, genera token + envía email. Devuelve `{ ok: true }` siempre (anti-leak).
- `POST /api/auth/reset-password/confirm` — recibe `{ token, password }`, valida + ejecuta `auth.admin.updateUserById`.
- Página `src/app/auth/reset-password/page.tsx` — form contraseña 2 veces, brandkit aplicado.

### Confirmación de email
- `POST /api/auth/email-confirmation/request` — emite token + envía.
- `POST /api/auth/email-confirmation/confirm` — valida + `email_confirm: true`.
- Página `src/app/auth/confirm-email/page.tsx` — auto-confirma al cargar, redirige a `/login`.

### Signup (token-based)
- Server action `src/app/auth/signup-actions.ts` → `signUpWithEmailConfirmation(email, password)`:
  - `admin.auth.admin.createUser({ email_confirm: false })` ← Supabase NO envía email
  - Genera token de confirmación
  - Envía email via Resend
- Usado desde `src/actions/auth.ts` → `signup()` (que actualmente NO se llama porque `/signup` está eliminado, pero queda disponible para invitaciones u onboarding self-service futuro).

### Webhook de Resend
- `POST /api/webhooks/resend` — firma verificada con `svix` + `RESEND_WEBHOOK_SECRET`.
- Loguea evento en `email_events`.
- Mapea `email.delivered/bounced/complained` → actualiza `email_messages.status`.
- Bounce/complaint → upsert en `email_suppressions` (el siguiente envío a ese email queda bloqueado).

## Motor de envío único: `src/lib/email/server.ts`

`sendEmail({ to, subject, html, text, tag, templateName })`:

1. Normaliza emails (lowercase, trim)
2. Consulta `email_suppressions` — si todos los destinos están bloqueados, no envía
3. Envía vía Resend
4. Loguea en `email_messages` (sent/failed)
5. Devuelve `{ ok, id?, error?, skipped? }`

**Regla:** todos los envíos pasan por este `sendEmail()`. Nadie llama a `resend.emails.send` directo. El motor de senders existente (`src/lib/email/send-email.ts`) sigue funcionando — para los siguientes templates conviene migrar a `server.ts` para ganar suppressions.

## 🚨 Reglas críticas

1. **PROHIBIDO** llamar a `supabase.auth.resetPasswordForEmail`, `supabase.auth.signInWithOtp`, `supabase.auth.signUp` con confirmación nativa, o cualquier email nativo de Supabase. El grep guía:
   ```
   grep -rn "resetPasswordForEmail\|signInWithOtp\|\.signUp(" src/
   ```
2. **`signup` server action** ya está migrada — usa `signUpWithEmailConfirmation()`.
3. **`resetPassword` server action** ya está migrada — hace fetch a `/api/auth/reset-password/request`.
4. **Email de cambio de contraseña** (`updatePassword`) usa Resend vía `sendPasswordChanged()` — NO Supabase.
5. **Verificar dominio en Resend** antes de producción (DNS).
6. **Crear webhook en Resend** apuntando a `https://ecoai.capitalhubapp.com/api/webhooks/resend` y guardar el signing secret en `RESEND_WEBHOOK_SECRET`.

## Variables de entorno requeridas

```
RESEND_API_KEY=re_xxx
RESEND_WEBHOOK_SECRET=whsec_xxx
EMAIL_FROM="Adrián Villanueva <adrian@mail.capitalhubapp.com>"
EMAIL_REPLY_TO=hola@capitalhubapp.com
NEXT_PUBLIC_APP_NAME="Capital Hub OS"
NEXT_PUBLIC_SITE_URL=https://ecoai.capitalhubapp.com
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # alias soportado: SUPABASE_SERVICE_KEY
```

## Cómo extender (invitación, magic link)

Copiar el patrón request/confirm. Cambian solo 2 cosas:
- `type` en `auth_tokens` (`invitation` o `magic_link`)
- Acción en confirm (asignar rol, crear sesión, etc.)

Siempre token propio + envío por `sendEmail()`. Nunca emails nativos de Supabase.

## Pasos manuales pendientes (deployment)

- [ ] Aplicar migración `20260617135405_email_token_based.sql` (Supabase Studio → SQL Editor o CLI)
- [ ] Añadir variables de entorno en Vercel
- [ ] Verificar dominio en Resend (`mail.capitalhubapp.com` — ya está verificado)
- [ ] Crear webhook en Resend Dashboard → URL `/api/webhooks/resend` → copiar secret a env

## Decisiones tomadas

- **2026-06-17:** Adoptado patrón token-based. Resend único motor de envío.
- **2026-06-17:** Throttle 3 req/10min para reset de contraseña.
- **2026-06-17:** `email_suppressions` consultada antes de cada envío — evita quemar reputación.
- **2026-06-17:** Pages auth (`/auth/reset-password`, `/auth/confirm-email`) construidas con paleta brandkit (#0F0F12, #2A2D34, #F5F6F7, #FFFFFF) + Inter Tight.
