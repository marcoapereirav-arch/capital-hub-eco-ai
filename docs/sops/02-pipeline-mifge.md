---
title: Pipeline MIFGE — stages del CRM
order: 2
---

# Pipeline MIFGE — el flow real de cada lead

Pipeline DEFINITIVO del funnel MIFGE. Sirve para construir el CRM `/crm` (kanban) y para que el equipo entienda en qué fase está cada lead. **Versión final tras debate con Marco — 2026-04-30.**

## Principio inquebrantable

**Cero acciones manuales.** Todo se mueve por webhooks Whop, APIs internas o cron jobs. Si un stage requiere mano, NO es stage.

## Los 8 stages

| # | Stage | Cómo entra (auto) | Cómo sale (auto) |
|---|---|---|---|
| 1 | **Free Trial** | Webhook Whop `membership_activated` producto MES | → Agendados / No Agendados / WON Año / Beta |
| 2 | **Agendados** | POST `/api/mifge/calls/book` | → WON Año / WON Mes / No-show / Beta |
| 3 | **No-show** | Cron 1h post-slot SIN grabación Fathom | → Agendados (reagenda) / WON Mes (día 15) / Beta |
| 4 | **No Agendados** | Cron diario: ≥7d en Free Trial sin booking | → Agendados / WON Mes / Beta |
| 5 | **WON Año** | Webhook Whop `membership_activated` producto AÑO | → Beta (al cancelar) |
| 6 | **WON Mes** | Webhook Whop `invoice_paid` recurrente día 15+ | → Pago Fallido / Beta |
| 7 | **Pago Fallido** | Webhook Whop `invoice_past_due` (ventana 3d) | → WON Mes/Año (recupera) / Beta (3d sin pagar) |
| 8 | **Beta** | Webhook Whop `membership_deactivated` | terminal (origen retargeting) |

## Los 2 badges (info en card, NO son estados)

| Badge | Significa | Detección automática |
|---|---|---|
| 🎁 **Bump 20€** | Compró el order bump en checkout | Webhook Whop bonus product |
| 📞 **Convirtió post-llamada** | Atribución: la llamada cerró la venta | Fathom grabó la call y luego pasó a WON |

## Por qué este pipeline (decisiones)

- **No-show es STAGE** porque tras la cita perdida el lead queda en limbo: ya no tiene cita futura ("Agendados" miente) y aún no ha churneado ni convertido. Necesita columna propia para flow de reactivación.
- **"Llamada Realizada" NO es stage** porque la llamada es un EVENTO, no un estado. Tras la llamada el lead va directo a WON Año / WON Mes / Beta. La info de "atendió" vive como badge "Convirtió post-llamada" para atribución.
- **Pago Fallido es stage propio** — ventana crítica de 3 días con flow de recuperación (email + reintentos). No puede ser badge porque define un flow distinto.
- **WON Mes y WON Año separados** — distinto LTV, distinta estrategia de cuidado/upsell.
- **Beta unificado** — destino terminal de cancelados con tag de origen (trial / mes / año) para retargeting segmentado.

## Cobertura — cualquier caso real cae en algún stage

| Caso | Recorrido |
|---|---|
| Activa trial → no agenda nada → día 15 cobra | Free Trial → No Agendados (día 7) → WON Mes |
| Activa trial → agenda → atiende → no compra anual → día 15 | Free Trial → Agendados → WON Mes (badge 📞) |
| Activa trial → agenda → atiende → compra anual | Free Trial → Agendados → WON Año (badge 📞) |
| Activa trial → agenda → no aparece → reagenda → atiende → cobra mes | Free Trial → Agendados → No-show → Agendados → WON Mes |
| Activa trial → agenda → no aparece → no reagenda → día 15 | Free Trial → Agendados → No-show → WON Mes |
| Activa trial → cancela día 5 | Free Trial → Beta |
| Compra anual directo (entrada upsell) | (entry) → WON Año |
| WON Mes 4 meses → falla mes 5 → recupera 2d después | WON Mes → Pago Fallido → WON Mes |
| WON Mes 4 meses → falla mes 5 → no paga 4d después | WON Mes → Pago Fallido → Beta |
| WON Año termina año, no renueva | Beta |

## Coherencia con los 5 KPIs de la estrategia

| KPI estratégico | Stage que lo mide |
|---|---|
| KPI 1 — Visita landing → Free Trial | Conteo de Free Trial nuevos / visitas totales |
| KPI 2 — Free Trial → Order Bump | % de Free Trial con badge 🎁 |
| KPI 3 — Free Trial → Plan Anual | Conteo de WON Año / Free Trial |
| KPI 4 — Free Trial → Llamada agendada | Conteo de Agendados (acumulado) / Free Trial |
| KPI 5 — Free Trial → Conversión mensual | Conteo de WON Mes (no Beta) / Free Trial |

## Implementación técnica

- Columna en `mifge_leads`: `pipeline_stage TEXT NOT NULL DEFAULT 'free_trial'` con CHECK enum.
- Columna `bump_purchased BOOLEAN` para badge 🎁.
- Columna `converted_post_call BOOLEAN` para badge 📞.
- Trigger BEFORE UPDATE → actualiza `pipeline_stage_updated_at` cada vez que cambia `pipeline_stage`.
- Realtime subscription en el CRM para que las cards se muevan en vivo cuando llegan webhooks.

## Pipelines fuera de MIFGE (futuros)

El meeting menciona también un Pipeline 2 — **Funnel Hub** (la web pública con captación). Se diseñará después de tener MIFGE funcionando.

## Cambios versionados

- **2026-04-30 (v1)**: 7 stages + 3 badges (versión inicial, descartada)
- **2026-04-30 (v2 final)**: 8 stages + 2 badges. No-show ascendido a stage. Llamada Realizada eliminada como stage (es evento, no estado). Confirmado por Marco.
