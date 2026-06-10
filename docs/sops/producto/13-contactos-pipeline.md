---
title: Contactos · pipeline visual end-to-end
order: 13
area: producto
---

# Contactos — pipeline CRM end-to-end

## Para qué sirve
Sección `/contactos` del OS. Es el CRM completo del negocio. Cada persona que entra en contacto con Capital Hub (lead frío, reservó llamada, asistió, compró, no-show, perdido) vive aquí con todo su historial.

## URL
`https://ecoai.capitalhubapp.com/contactos`

## Cómo llega alguien a /contactos
Hay 5 fuentes por las que un contacto aparece:

1. **Reserva en `/agenda`** → sistema crea contacto con stage `booked`, source `agenda_calendar`
2. **Closer junior lo crea manual** desde `/outreach-ig` cuando hace handoff a Adrián
3. **Compra directa via widget "Registrar venta"** → si email no existe se crea con stage `won`
4. **Webhook ManyChat** (cuando lead acepta DM y entra al flujo de bot)
5. **Webhook Whop** (compras MIFGE legacy — sigue funcionando)

## Datos que guarda cada contacto

| Campo | Para qué |
|-------|----------|
| email | Único, llave primaria operativa |
| full_name | Nombre real |
| phone | Para llamadas + WhatsApp |
| stage | `new` → `contacted` → `booked` → `attended` → `won`/`no_show`/`lost` |
| products[] | Array de productos comprados (IA, MBD, CC) |
| total_revenue | Suma de revenue de todas las ventas |
| total_cash_collected | Suma de cash collected |
| source | De dónde vino (agenda_calendar, outreach_ig, sales_call_close, etc) |
| owner_assignee | Quién lo gestiona (marco, adrian, nagai, etc) |
| last_call_at | Última llamada con él |
| created_at | Cuándo entró al sistema |

## Pipeline visual

```
Sin tocar   →   Contactado   →   Reservó   →   Asistió   →   Cierre
new             contacted        booked         attended      won
                                                              
                                                no_show / lost
```

Cada columna se ve con su count + valor total revenue. Drag and drop entre columnas mueve el stage.

## Drawer detalle del contacto

Click en una card abre drawer derecho con:
- Datos básicos (nombre, email, tel, owner)
- Stage actual + cambio rápido
- Botones: "Registrar venta" / "Reservar llamada" / "Marcar no-show"
- **Journey timeline**: TODOS los eventos del contacto cronológicos
  (booking, llamada, sale, email enviado, email abierto, pago fallido)
- Notas internas del equipo

## Tabla en BD
`public.contacts` (UUID id, RLS habilitada, solo super_admins leen)

## Tablas relacionadas
- `contact_journey_events` (timeline del contacto)
- `calendar_bookings` (sus reservas)
- `student_invites` (sus invitaciones a la App tras venta)
- `email_logs` (emails enviados con tracking aperturas/clicks)
- `meta_events_log` (eventos enviados a Meta CAPI)

## Reglas operativas
- **Nunca borrar contactos.** Marcar como `lost` si abandonan.
- **Email es la clave de identidad.** Si llega un evento (booking, venta) con email existente, se actualiza el contacto, no se crea uno nuevo.
- **El stage solo sube** en el pipeline (excepto `no_show`/`lost`). Si vuelve a reservar tras `lost`, se respeta su stage anterior.
- **owner_assignee determina quién recibe notificaciones** sobre ese contacto.

## Integraciones automáticas
- Cada cambio de stage dispara `contact_journey_events`
- Cada venta dispara email magic link al alumno + notif a Marco
- Cada booking dispara crear evento en Google Calendar de Adrián
- Cada cambio de email crea entrada en `email_logs` con tracking

## Métricas que se calculan en vivo
- Total revenue por mes / por producto / por closer
- Conversion rate por stage (booked → attended → won)
- Tiempo medio en cada stage
- LTV por contacto

## Reportar bugs
Si una métrica no cuadra: revisar `contact_journey_events` para ese contacto. La timeline es la fuente de verdad.
