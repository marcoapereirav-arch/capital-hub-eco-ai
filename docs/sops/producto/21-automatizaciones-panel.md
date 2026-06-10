---
title: Automatizaciones · panel en vivo (solo lectura)
order: 21
area: producto
---

# /automatizaciones — panel en vivo de TODAS las automatizaciones del OS

## Para qué sirve
Vista en vivo y SOLO LECTURA de todas las automatizaciones que el sistema ejecuta sin intervención humana. Permite ver de un vistazo qué está activo, qué está pendiente y qué está fallando.

## URL
`https://ecoai.capitalhubapp.com/automatizaciones`

## Reglas duras de esta sección
1. **NO se edita.** Las automatizaciones son código (endpoints, crons, webhooks). Esta página solo las muestra.
2. **NO se crea desde aquí.** Para crear una automatización nueva hay que codearla.
3. **Vivo:** la página hace polling al endpoint cada 30 segundos. Auto-actualiza sin que nadie pulse nada.
4. **Estado calculado en BD real.** Cada automatización tiene su estado evaluado mirando datos reales (último booking, último email enviado, refresh_token OAuth válido, etc).
5. **Cada nueva automatización debe añadirse aquí AUTOMÁTICAMENTE.** El array en `src/app/api/admin/automations/route.ts` es la fuente. Cuando construya una nueva, debe registrarse ahí.

## Estados posibles

| Estado | Cuándo | Color |
|--------|--------|-------|
| `live` | Configurada + ejecutándose + última corrida OK | Verde |
| `pending` | Configurada pero falta algo externo (token, webhook, etc) | Amber |
| `idle` | Lista pero no se ha ejecutado todavía | Gris |
| `error` | Última corrida falló | Rojo |

## Categorías
- **calendario**: agenda, reservas, Google Calendar sync
- **ventas**: registro venta, magic link, notif Marco
- **alumno**: followup, activación cuenta
- **email**: tracking webhooks Resend
- **crm**: ManyChat → CRM, vinculación leads
- **operacion**: error alerts, health checks

## Lo que muestra cada automatización (expandible)

- **Descripción** human-readable
- **Trigger** exacto (endpoint, cron schedule, webhook entrante)
- **Lógica en cadena** numerada paso a paso
- **Tablas BD afectadas**
- **Última ejecución** (timestamp + hace cuántas horas)
- **Total ejecuciones**

## Cómo añadir una nueva automatización a este panel
1. Construir la automatización (endpoint / cron / webhook)
2. Editar `src/app/api/admin/automations/route.ts`
3. Añadir entrada en el array `automations` con:
   - id único
   - category
   - label
   - description
   - trigger
   - actions (array)
   - relatedTables (array)
   - status calculado leyendo BD
   - statusReason (string explicativo)
   - lastRun, lastRunHoursAgo, totalExecutions
4. **Actualizar SOP correspondiente en `docs/sops/`** describiendo la nueva automatización
5. Deploy

## Automatizaciones registradas actualmente

| # | id | Categoría | Estado base |
|---|-----|-----------|-------------|
| 1 | `agenda_to_calendar` | calendario | Crea evento en Google Calendar al reservar |
| 2 | `agenda_reminder_24h` | calendario | Cron 24h antes |
| 3 | `no_show_detection` | calendario | Cron detecta no-shows |
| 4 | `gcal_health_check` | calendario | Cron health del OAuth Google |
| 5 | `sale_to_alumno` | ventas | Widget Registrar venta → magic link |
| 6 | `welcome_alumno_followup` | alumno | Cron 3d sin aceptar invite |
| 7 | `resend_webhook_tracking` | email | Tracking real aperturas/clicks |
| 8 | `error_alerts` | operacion | Digest 30 min errores |
| 9 | `manychat_webhook` | crm | ManyChat → CRM nuevo seguidor |

## Endpoint API
`GET /api/admin/automations`

Devuelve:
- `automations[]` — array con cada automatización + estado en vivo
- `summary` — resumen (total, live, pending, idle, error)
- `generated_at` — timestamp para mostrar "Última actualización"

## Frecuencia de refresh en UI
Polling cada **30 segundos**. Si el usuario quiere refrescar manualmente hay botón.
