---
title: Sistema Capital Hub - flujo end-to-end del negocio
order: 12
---

# Sistema Capital Hub — flujo end-to-end

> Mapa completo del viaje del lead hasta alumno activo en la plataforma.
> Esta es **la fuente de verdad de cómo opera el negocio**. Si algo del código
> no encaja con este flujo, el código está mal, no este SOP.

## Visión a vista de pájaro

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  CAPTACIÓN   │ → │   CIERRE     │ → │  ALUMNO      │
│  (Marketing) │   │   (Ventas)   │   │  (Producto)  │
└──────────────┘   └──────────────┘   └──────────────┘
   OS                  OS                  App
```

---

## Fase 1 — Captación (Marketing)

### 1a. Contenido + ads
- Adrián publica reels y posts en su Instagram (avatar Andrés)
- Marco activa **follow-me ads** en Meta apuntando a los reels más fuertes
- Resultado: nuevos seguidores cualificados llegan al IG de Adrián

### 1b. Captación automática vía ManyChat
- ManyChat detecta cada nuevo seguidor de Instagram
- ManyChat dispara webhook a `/api/webhooks/manychat` con `subscriber_id` + datos básicos
- El OS crea contacto con stage `nuevo_seguidor` en `/crm/pipeline` (columna izquierda)
- Setter recibe notificación push + email
- Setter ve la card en pipeline, click "Abrir chat en ManyChat" → conversación en inbox de ManyChat
- ManyChat envía DM con link `/agenda?mc_id=<subscriber_id>` (parámetro de tracking)
- Cuando el lead clica el link → /agenda detecta el `mc_id`, vincula con el contacto existente, no duplica
- Estados naturales del CRM: nuevo_seguidor → contactado → agendado → atendio → seguimiento / cliente / no_show / perdido
- **NO existe `/outreach-ig`** (eliminado del OS — era manual sin valor)
- **Detalles del flow:** ver `docs/sops/producto/20-manychat-crm.md`

---

## Fase 2 — Agenda

### 2a. Lead reserva slot
- Entra a `/agenda` (página pública del OS)
- Ve los huecos disponibles (calculados desde `calendar_availability_rules` de Adrián, restando `calendar_bookings` activos + `calendar_blocked_slots`)
- Rellena: nombre, email, teléfono, notas
- Reserva ✓

### 2b. Sistema dispara automáticamente
1. Crea row en `calendar_bookings` con `public_token` único
2. Crea/actualiza row en `contacts` con stage `booked` + `last_call_at`
3. Crea evento en **Google Calendar de Adrián** vía OAuth refresh_token (Zoom URL embebida en location + description)
4. Manda email al lead con:
   - Confirmación con fecha/hora en hora Madrid
   - `.ics` adjunto para añadir a su calendar
   - Link Zoom (`https://us06web.zoom.us/j/6812281370`)
   - Links a cancelar / reagendar (con `public_token`)
5. Manda email a Adrián notificando la nueva reserva
6. Crea `contact_journey_events` tipo `call_booked` con todos los datos

### 2c. 24h antes
- Cron Supabase `mifge_agenda_reminder_24h` (cada 30 min) detecta calls a ~24h del slot
- Manda email recordatorio al lead

---

## Fase 3 — Llamada (Zoom)

- Adrián entra al Zoom a la hora pactada
- Tiene en su Google Calendar el evento con todos los datos del lead (notas, email, teléfono)
- La llamada dura ~30-45 min
- Posibles resultados:
  - **CIERRA** → paso a Fase 4
  - **NO CIERRA** → closer marca booking como `attended` sin venta en `/calendario`, el lead queda en stage `attended` para followup futuro

---

## Fase 4 — Registro de venta (formulario)

### 4a. Closer abre el formulario
- Widget flotante abajo derecha desde **cualquier sección del OS** → click "Registrar venta"
- O desde el drawer del contacto en `/contactos` → botón "Registrar venta"
- Selecciona contacto existente (autocompleta datos) o crea nuevo
- Rellena:
  - Tipo de cierre: Sales Call (tras llamada) o Direct Close (sin llamada previa)
  - Producto comprado: **IA Integrator** | **Media Buyer Digital** | **Comercial Closing** (default 1, máximo 1 al inicio)
  - **Revenue** (facturación) — manual editable
  - **Cash collected** — manual editable
  - Método de pago: Stripe / Hotmart / SeQura / Transferencia / Whop manual / Otro
  - Cerró: dropdown con team_members con role `super_admin` o `closer`
  - Notas internas (opcional)

### 4b. Sistema dispara automáticamente (3 acciones en 1 submit)
1. **Actualiza ficha contacto**: stage `won`, products[], total_revenue +=, total_cash_collected +=, last_call_at, owner_assignee = closer
2. **Crea `contact_journey_events`** tipo `sale` con todos los datos
3. **Crea `student_invites`** con token único, expires_at = +7 días
4. **Manda email al alumno** con:
   - Saludo personalizado
   - Magic link a `https://app.capitalhubapp.com/accept-invite/[token]`
   - Instrucciones de qué hacer al entrar
5. **Notif a Marco** (revenue alert) + **CAPI Pixel Purchase** para Meta Ads
6. Si Sales Call: marca booking como `attended` + sube stage del lead que ya estaba

---

## Fase 5 — Alumno entra a la App

### 5a. Activación cuenta
- Alumno hace click al magic link del email
- Va a `https://app.capitalhubapp.com/accept-invite/[token]`
- Define su contraseña (mín 8 chars)
- El endpoint del OS:
  - Valida token (no expirado, no usado)
  - Llama `supabase.auth.admin.updateUserById` con la password
  - Marca `student_invites.accepted_at = now()`
  - Crea/actualiza `users` (App) con datos del contacto

### 5b. Onboarding alumno
- Primer login → pantalla de onboarding
- Sube foto perfil
- Rellena: nombre, profesión actual, una bio corta
- Confirma su email
- Llega a su Dashboard de alumno

---

## Fase 6 — Alumno consume su formación

### 6a. Catálogo
- Solo ve **la formación que compró** (las otras no se muestran)
- Estructura: Routes → Formations → Modules → Lessons
- Cada Module tiene N Lessons con vídeos

### 6b. Bloqueo progresivo
- Lección N+1 se desbloquea solo cuando marca N como completada
- Tracking en `user_progress` por user × lesson
- Si un alumno marca todas las lessons → módulo completado → siguiente desbloquea
- Al completar la formación → puede pedir su certificación (`user_certifications`)

### 6c. Comunidad
- **CommunityPage**: feed estilo Skool
- Cada alumno puede postear: título + descripción + adjunto
- Categorías: wins / soporte / general
- **Las 3 comunidades están separadas al principio**: IA / Marketing / Comercial. Solo ves la de tu producto.
- Chats privados 1-a-1 entre alumnos del mismo producto

### 6d. Q&A por formación
- Cada formación tiene su sección Q&A (`formation_questions` + `formation_question_replies`)
- El alumno postea preguntas, otros alumnos o profes responden
- Tracking de respuestas marcadas como aceptadas

### 6e. Bolsa de trabajo (futuro)
- Sistema `companies` + `job_offers` + `job_applications`
- Empresas suben ofertas, alumnos certificados aplican
- No es MVP para 8/8 pero existe en el código

---

## Mapa de stacks

| Capa | OS | App |
|------|-----|-----|
| Repo | `Capital Hub/` | `App Capital Hub/` |
| GitHub | `capital-hub-eco-ai` | `capital-hub-app` |
| Framework | Next.js 16 + React 19 | React 19 + Vite |
| Vercel project | `capital-hub-eco-ai` | `capital-hub-app` |
| Dominio | `os.capitalhubapp.com` | `app.capitalhubapp.com` (DNS pendiente) |
| Supabase | **`aglyoyqtzozdnusltjxe`** (unificada) | **misma** |
| Auth | Supabase Auth + BYOE (Resend invitations, no usa emails Supabase) | Supabase Auth + magic link del OS |
| Emails | Resend + React Email + `_layout` brand | Hereda templates del OS |

## Reglas operativas críticas

1. **Una sola Supabase para ambos productos.** Los contactos del OS son los users de la App.
2. **OAuth Google del calendar es del OS**, no de la App. La redirect URL siempre va a `os.capitalhubapp.com`.
3. **Magic links de alumno se generan en el OS** (donde está el service role key y la lógica de venta) y se envían vía Resend al alumno. El alumno los abre en la App.
4. **Refresh tokens de Google son indefinidos solo si la app Google Cloud está "In production"**. Si está en "Testing", caducan a los 7 días. Verificar siempre In Production.
5. **Producto único por alumno** por defecto. La BD permite varios pero la UI default selecciona 1 (anti objeto-brillante).
6. **Calendario propio**, no Calendly. Sustituido en jun 2026.
7. **Pagos manuales**. El closer registra revenue + cash collected a mano en el formulario. NO hay automatización con Stripe/Hotmart/SeQura todavía. El widget de venta es el corazón del flujo.
8. **Cero landing pública de venta**. Cierre 100% por llamada. No hay self-serve checkout.

## Estados del lead (pipeline)

```
new → contacted → booked → attended → won
                              ↓
                           no_show / lost
```

| Stage | Cuándo |
|-------|--------|
| `new` | Lead recién creado, sin tocar |
| `contacted` | Closer junior le ha escrito DM |
| `booked` | Reservó llamada |
| `attended` | Asistió a la llamada (sin venta aún) |
| `no_show` | No apareció a la llamada |
| `won` | Cerró venta |
| `lost` | No cerró + decisión de no seguir |

## 🚨 Asignación de pipeline al lead (REGLA SÓLIDA — no cambiar)

Cada contacto tiene **UN solo `pipeline_id`**. El pipeline refleja **el camino por el que entró al sistema**, no su estado actual. El stage cambia, el pipeline_id NO.

### Los dos pipelines actuales

| Pipeline | Slug | is_default | ¿Quién va aquí? |
|---|---|---|---|
| **General** | `general` | **true** | Lead que llega SIN contexto (link de agenda directo, DM, referral, alguien le pasa el calendario sin más) |
| **Test Personalidad** | `test-personalidad` | false | Lead que pasó por la landing del test, dejó email en el optin, vino con ese contexto |

### Reglas de asignación (cableadas en código)

| Endpoint | Comportamiento |
|---|---|
| `POST /api/optin/test-personalidad` | Lead **nuevo** → `pipeline_id = Test Personalidad`. Lead **existente sin pipeline** → asigna Test Personalidad. Lead **existente CON pipeline** → PRESERVA el suyo. |
| `POST /api/calendar/book` | Lead **nuevo** → `pipeline_id = General` (default). Lead **existente** → PRESERVA el suyo. Si entró por Test Personalidad y ahora agenda → sigue en Test Personalidad (no salta). |

### Por qué esta regla

- El lead que pasó por Test Personalidad **se tiene que medir en su funnel**, no en el General. Su conversión, su show rate, su cierre van al Test Personalidad pipeline.
- El lead que llega frío (sin pasar por funnel específico) cae al General. Esa es su realidad: vino sin contexto.
- El dashboard general SUMA todos los pipelines (los 2 actuales y los 80 futuros). Las KPIs principales NO se sesgan por filtro de funnel.
- La sección "Vista por funnel" filtra por uno para ver el detalle de ese funnel.

### Cómo agregar un funnel nuevo

1. Crear pipeline en `public.pipelines` con su slug y stages propios si los necesita
2. En el endpoint que captura el lead (optin, formulario, webhook), asignar `pipeline_id` = ese pipeline
3. Si el contacto ya tenía pipeline, PRESERVARLO (no sobreescribir)
4. El dashboard general automáticamente lo cuenta. La sección "Vista por funnel" lo lista en el dropdown.

### Decisión arquitectónica anterior (revertida)

Marco dejó claro 2026-06-18: NO hay "Principal agregado virtual" — el agregado es la suma del dashboard. Los pipelines son contextos de funnel. El default (General) es para los que entran sin contexto.

## Ecosistemas por pestaña en /crm

Cada pestaña tiene sus propios filtros y configuraciones. NO se mezclan.

| Pestaña | Ruta | Filtros propios |
|---|---|---|
| **Contactos** | `/crm/contactos` | Búsqueda · Tags · Pipeline · Stage · Origen · Owner · Producto · Fecha · Llamada |
| **Pipeline** | `/crm/pipeline` | Búsqueda · Selector de pipeline · Tags · Configurar |
| **Tags** | `/crm/tags` | Gestión de tags |

El selector de pipeline NO aparece en Contactos (es un filtro más). El kanban del Pipeline sí lo necesita arriba porque define qué columnas mostrar.

## Monitoreo del sistema

- Cron `mifge_no_show_detection` cada 30 min: detecta llamadas sin marcar attended en ventana 1-25h post → marca `no_show` + email retargeting
- Cron `mifge_error_alerts` cada 30 min: revisa `email_logs` y `meta_events_log` failed desde última corrida → email digest a Marco
- Cron `mifge_agenda_reminder_24h` cada 30 min: recordatorio email
- Cron `mifge_trial_ends_48h` cada hora: legacy MIFGE, mantener inactivo
- **Cron `gcal_health_check`** (nuevo) cada hora: verifica refresh_token de Adrián sigue válido. Si falla → email + push a Marco + Adrián

## Donde NO mirar (legacy MIFGE pausado)

- Funnel MIFGE de embedded checkout, order bump 19€, upsell anual 970€
- Tabla `mifge_leads` (no se usa)
- Tabla `calls_availability` (calendar viejo, datos siguen ahí por compat con OAuth callback)
- Páginas `/mifge/*`

Todo eso está construido y funcional. Si en el futuro se vuelve a un funnel low-ticket, está listo.
