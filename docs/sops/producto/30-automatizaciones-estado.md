---
title: Automatizaciones del OS · estado siempre vivo
order: 30
area: producto
---

# Automatizaciones del OS — registro vivo

> **Regla de oro:** este SOP es la **única fuente de verdad** de qué automatizaciones existen. Cuando se crea/activa/desactiva una, se actualiza este documento **en el mismo commit**. Antes de tocar `/api/admin/automations/route.ts` o cualquier cron, **leer este SOP primero**.

## Cómo leer la tabla

| Estado | Cuándo aplica |
|---|---|
| 🟢 **Activa** | Ejecutándose con datos reales (cron corrió en últimas 24h o webhook recibió evento real en últimos 7d) |
| 🟡 **Idle** | Registrada y configurada pero sin ejecuciones recientes (no hay leads/ventas que disparen) |
| 🔴 **Pending** | Bloqueada por algo externo: token, panel ManyChat, OAuth, etc. NO está activa todavía |
| ⚫ **Inactiva** | Desactivada intencionadamente |

## Tabla viva (sincronizar con `/api/admin/automations/route.ts`)

### Calendario (5)

| Estado | id | Trigger | Última ejecución conocida | Notas |
|---|---|---|---|---|
| 🟢 | `agenda_to_calendar` | POST `/api/calendar/book` | Cuando alguien reserva en `/agenda` | Pega evento en Google Calendar de Adrián. Mueve stage a `agendado` (guarda no-retroceso). Cancelar → `seguimiento` |
| 🟢 | `agenda_reminder_24h` | `pg_cron` cada 30 min | Cada 30 min (jobid 1) | Email 24h antes con Zoom link |
| 🟢 | `no_show_detection` | `pg_cron` cada 30 min | Cada 30 min (jobid 3) | Marca `no_show` + email retargeting |
| 🟢 | `gcal_health_check` | `pg_cron` cada hora | Cada hora (jobid 5) | Alerta si OAuth de Adrián caduca |
| 🔴 | `calendly_webhook` | Webhook Calendly → POST `/api/webhooks/calendly` | — | **PENDING**: hoy solo registra en `calendly_scheduled_events`. FALTA: Adrián crea el evento + cablear movimiento de pipeline (agendado/seguimiento/no_show) |

### Ventas / Alumno (3)

| Estado | id | Trigger | Notas |
|---|---|---|---|
| 🟢 | `trial_ends_48h` | `pg_cron` cada hora (jobid 2) | Email 48h antes del cobro MIFGE |
| 🟡 | `register_sale` | POST `/api/admin/sales/register` (widget) | `live` cuando hay ventas; `idle` mientras no haya |
| 🟢 | `welcome_alumno_followup` | `pg_cron` 10am UTC (jobid 6) | Email a alumnos que no entraron a la App tras 3d |

### Email + Tracking (2)

| Estado | id | Trigger | Notas |
|---|---|---|---|
| 🟢 | `resend_webhook_tracking` | Webhook Resend → POST `/api/email/webhooks/resend` | Actualiza email_logs con aperturas/clicks |
| 🟢 | `meta_capi_tracking` | Endpoints internos disparan CAPI | Audit trail en `meta_events_log` |

### Sistema (1)

| Estado | id | Trigger | Notas |
|---|---|---|---|
| 🟢 | `error_alerts_digest` | `pg_cron` cada 30 min (jobid 4) | Digest de errores a Marco |

### CRM / IG (2)

| Estado | id | Trigger | Notas |
|---|---|---|---|
| 🔴 | `manychat_webhook` | Webhook ManyChat → POST `/api/webhooks/manychat` | **PENDING**: FALTA configurar External Request en panel ManyChat (Marco/Adrián). El endpoint está listo. |
| 🟢/🟡 | `test_personalidad_optin` | POST `/api/optin/test-personalidad` | Funnel Test Personalidad: crea contacto `lead` + pipeline + tags origen/fuente + atribución afiliado + Meta CAPI + notif si contacto recurrente. `live` cuando hay opt-ins. |

## Decisiones tomadas

- **2026-06-16:** Eliminadas del panel automatizaciones "fantasma" que aparecían `live` sin estarlo. Ahora `live` requiere evidencia real (cron run en 24h o evento webhook en 7d).
- **ManyChat queda como `pending`** hasta que Adrián configure el External Request en su panel ManyChat. Es honesto, no mostramos cosas como activas si no lo están.
- **2026-06-23:** Registradas `test_personalidad_optin` (funnel del test → CRM + atribución + CAPI + notif recurrente) y `calendly_webhook` (pending). **Recordatorio de proceso:** este sprint se construyeron automatizaciones del funnel sin registrarlas aquí de inmediato; corregido. Toda automatización nueva DEBE pasar por el checklist de abajo en el mismo bloque de trabajo.

## Cómo añadir una automatización nueva

1. Implementar el endpoint o cron en código
2. Si es cron: registrar en `pg_cron` con `cron.schedule(...)`
3. Añadir entrada en `/api/admin/automations/route.ts` (objeto en `automations[]`)
4. **Añadir fila en este SOP con su estado y trigger** (lo más importante)
5. Verificar en `/automatizaciones` que aparece con el status correcto
6. Commit con mensaje `feat(automations): añadir <id>`

## Cómo desactivar una automatización

1. Para crons: `SELECT cron.unschedule(jobid)` o `UPDATE cron.job SET active=false WHERE jobid=N`
2. Para webhooks: revocar secret o cambiar el endpoint a 503
3. Quitar/marcar la entrada en `/api/admin/automations/route.ts`
4. **Actualizar este SOP** moviendo la fila a "Inactivas" (sección abajo)
5. Commit con mensaje `chore(automations): desactivar <id>`

## Inactivas (histórico)

_(Vacío de momento — todas las declaradas están activas o pendientes)_

## Verificación periódica

Mensualmente (o antes de invitar nuevos miembros del equipo):
- Abrir `/automatizaciones` y comparar con esta tabla
- Si algo no cuadra: **actualizar lo que sea correcto** (siempre lo real, no lo "que debería estar")
