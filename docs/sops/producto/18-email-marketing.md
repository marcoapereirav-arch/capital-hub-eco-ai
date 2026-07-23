---
title: Email marketing · templates + tracking + envíos
order: 18
area: producto
---

# Email marketing — sistema completo con Resend + React Email

## URL
`https://os.capitalhubapp.com/email-marketing`

## Provider
Resend. Plan Free permite ~3.000 emails/mes (suficiente para arranque). Configurado con dominio verificado.

## 3 tabs

### 1. Dashboard
Métricas vivas:
- Total enviados / 30 días
- Open rate (% de aperturas)
- Click rate (% de clicks)
- Bounce rate (% de rebotados)
- Comparativa por template

### 2. Plantillas
Lista de 18 templates registrados. Click en cualquiera → modal preview con el HTML real renderizado con datos demo.

Templates categorizados:
- **lifecycle**: welcome_alumno_ht (HT), welcome_trial, welcome_anual
- **agenda**: agenda_confirmed, agenda_reminder_24h
- **followup**: no_show, post_call_followup
- **billing**: trial_ends_48h, payment_failed, bump_confirmed
- **retargeting**: beta_retargeting_trial / monthly / annual
- **internal**: internal_booking_alert (a Marco), internal_purchase_alert, internal_error_alert, internal_gcal_alert
- **team**: team_invite

Para EDITAR el copy de un template: hay que modificar el archivo `.tsx` correspondiente en `src/lib/email/templates/` y redeploy. No hay editor en UI todavía.

### 3. Envíos (log)
Lista cronológica de TODOS los emails enviados:
- Destinatario
- Template usado
- Estado (sent / delivered / opened / clicked / failed)
- Iconos visuales:
  - ✉ enviado
  - ✓ entregado
  - 👁 amarillo (abierto)
  - 🖱 violeta (clicado)
  - ❌ rojo (rebote / queja)
- Click en envío → drawer con detalles, payload completo, timestamps

## Webhooks Resend (tracking real) — ✅ VERIFICADO ACTIVO

Configurado en `resend.com/webhooks` con endpoint:
```
https://os.capitalhubapp.com/api/email/webhooks/resend
```

**Estado actual** (verificable via `GET https://api.resend.com/webhooks`):
- Webhook id: `00f4f315-fd32-4f19-8b74-7ccaf4a3a28f`
- Status: `enabled`
- RESEND_WEBHOOK_SECRET configurado en Vercel del OS

Eventos suscritos:
- email.sent
- email.delivered
- email.delivery_delayed
- email.complained
- email.bounced
- email.opened
- email.clicked

Cuando llega un evento, sistema:
1. Verifica firma svix-* contra `RESEND_WEBHOOK_SECRET`
2. Busca log por `resend_id`
3. Actualiza timestamp correspondiente (delivered_at, opened_at, clicked_at)
4. En bounce/complaint marca status = failed

Si el secret está mal o no llegan webhooks, las métricas open/click quedan a 0%. Verificar en Resend dashboard > Webhooks > Deliveries que devuelve 200 OK.

## Templates internos a Marco / Adrián

### Booking alert
Cada vez que un lead reserva llamada → email a Marco con datos del lead, hora, notas.

### Purchase alert
Cada vez que se registra una venta → email a Marco con monto, lead, closer, productos.

### Error alert (digest cada 30 min via cron)
Si hubo fallos de email o CAPI en los últimos 30 min → digest con todos.

### GCal alert
Si refresh token Google Calendar deja de funcionar → email + push a Marco y Adrián.

## Crons relacionados (pg_cron)

| Job | Frecuencia | Qué hace |
|-----|------------|----------|
| mifge_agenda_reminder_24h | cada 30 min | Email 24h antes de la llamada |
| mifge_no_show_detection | cada 30 min | Detecta llamadas sin attended + email retargeting |
| mifge_error_alerts | cada 30 min | Digest fallos a Marco |
| gcal_health_check | cada hora | Verifica Google Calendar + alertas |
| welcome_alumno_followup | diario 10am UTC | Reenvía email a alumnos que no activan cuenta en 3 días |

## Tablas BD
- `email_logs` — todos los envíos con timestamps + resend_id + payload
- `meta_events_log` — eventos enviados a Meta CAPI (separado)

## Endpoints
- `GET /api/admin/email/templates` — lista de templates
- `GET /api/admin/email/preview/[key]` — HTML preview de template
- `GET /api/admin/email/logs` — log de envíos con filtros
- `POST /api/email/webhooks/resend` — receptor de eventos Resend

## Envío programado (`scheduledAt`)

`sendEmail()` acepta un campo opcional `scheduledAt` que se pasa tal cual al SDK de Resend (soportado desde la 6.12.2, verificado en `node_modules/resend/dist/index.d.mts`). Admite ISO 8601 o lenguaje natural (`"in 7 minutes"`).

Sirve para entregar un email con retraso **sin cron y sin tabla de cola propia**. Primer uso: el email de acceso del funnel del test, que se programa en el opt-in y llega a los 7 minutos mientras el lead ve la VSL (ver SOP marketing/07 y PRP-007).

**Gotchas:**
- **La comprobación de "plantilla pausada" ocurre AL PROGRAMAR, no al entregar.** Si alguien pausa la plantilla desde `/email-marketing` dentro de la ventana de espera, el email igualmente sale. Para cancelarlo de verdad haría falta guardar el id de Resend y llamar a `emails.cancel()`.
- En `email_logs` el envío programado se registra con `status='sent'` en el momento de programarlo, más `metadata.scheduled_at` con la hora pedida. Es lo honesto: Resend lo aceptó y lo va a entregar, pero todavía no ha salido.
- La ventana de programación de Resend es corta (horas). Para retrasos largos hace falta un cron.

## Reglas operativas
- **Cada email tiene un único `resend_id`.** Es la clave para enlazar logs con webhooks.
- **`skipped_paused` NO pasa el CHECK de `email_logs.status`.** El constraint solo admite `sent, failed, bounced, complained, opened, clicked, unsubscribed`. `send-email.ts` intenta insertar `skipped_paused` cuando una plantilla está pausada y ese insert falla en silencio (va con `.then(()=>null,()=>null)`). Consecuencia: **hoy un email bloqueado por pausa no deja rastro en el log.** Detectado el 2026-07-23 al construir el funnel v2. Se arregla ampliando el CHECK con una migración.
- **opened_at se guarda solo en la PRIMERA apertura.** Aperturas siguientes no sobrescriben.
- **clicked_at se guarda en el PRIMER click.** Click count agregado se hace en queries.
- **Si Resend dice bounce, el contacto NO debe recibir más emails automáticos.** Sistema marca status=failed pero no implementa supresión automática (pendiente).
- **Unsubscribes**: cada email tiene link de unsubscribe en footer (template `_layout`). Lleva a página pública. Sistema marca contacto con `email_opted_out=true` (campo pendiente).

## Variables de entorno (Vercel)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (adrian@mail.capitalhubapp.com)
- `RESEND_FROM_NAME` (Adrián Villanueva)
- `RESEND_WEBHOOK_SECRET`

## Verificación rápida
1. Manda email test desde `/email-marketing` > Plantilla > "Enviar test a mi"
2. Abre el email en Gmail
3. Espera 1 min, refresca `/email-marketing` > Envíos
4. Debe aparecer con icono 👁 (abierto)
5. Si no aparece: revisar `RESEND_WEBHOOK_SECRET` en Vercel + Resend dashboard
