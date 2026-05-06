---
title: Estrategia y KPIs del MIFGE
order: 4
---

# Estrategia + KPIs del funnel MIFGE

Fuente única de verdad de la estrategia. Acordada en daily Marco + Adrián + JP el **2026-04-27**. **No modificar sin acuerdo explícito.**

## Misión

> **Invertir 1.000€/día en publicidad alcanzando los 5 KPIs del funnel.**

Esto es el GOL central. Todo lo que hacemos sirve a esto.

## Pricing

| Concepto | Valor |
|---|---|
| Free trial | 14 días |
| Plan mensual | 97€/mes (auto-renovable) |
| Plan anual | 970€/año (= 81€/mes equivalente, 2 meses gratis vs mensual) |
| Order bump | 19€ one-time |
| Llamada de venta | 20 min con Adrián |

## Los 5 KPIs del funnel + KPI 0 lead magnets

| # | De | A | Proyección | Objetivo | Notas |
|---|---|---|---|---|---|
| 0 | Opt-in lead magnet | Free Trial activado | *pendiente baseline* | *pendiente baseline* | **Mini-funnel de 5 pasos** — ver desglose abajo. Añadido 2026-05-06 con la introducción de lead magnets para ampliar el TOFU del funnel sin romper los KPIs 1-5. |
| 1 | Visita landing | Free Trial activado | **15%** | **30%** | Calidad landing + tráfico |
| 2 | Free Trial | Order Bump comprado | **15%** | **30%** | Liquida ad cost (SLO) |
| 3 | Free Trial | Plan Anual 970€ | **2%** | **5%** | Upsell 1. El SLO grande. Cada uno = 970€ inmediato. |
| 4 | Free Trial | Llamada agendada | **50%** | **70%** | Pre-cualificación obligatoria. |
| 5 | Free Trial | Conversión a mensual (no cancela) | **40%** | **60%** | % que NO cancela en los 14d y se queda como cliente mensual. |

### KPI 0 — desglose mini-funnel lead magnets

El KPI 0 NO es un único número — es un mini-funnel de 5 pasos con conversion entre cada uno. Cada paso se mide independiente y se ve agregado en `/dashboard` + drill-down en `/webs/lead-magnets/<slug>`:

```
Views Reel → Comentarios con keyword → DMs iniciados → Email capturado → Recurso abierto → Free Trial activado
```

| Paso | Fuente del dato | Quién lo registra |
|---|---|---|
| Views del Reel | Instagram Insights API | Sync diario (cuando esté conectada) |
| Comentarios con keyword | Webhook ManyChat | OS — endpoint `/api/manychat/lm-router` |
| DMs iniciados | Webhook ManyChat | OS — `manychat_events` table |
| Email capturado | Webhook ManyChat → upsert `mifge_leads` con `stage='lead'` | OS |
| Recurso abierto | Tracking en página `/lm/<slug>?t=<jwt>` | OS — `lead_magnet_deliveries.opened_at` |
| Free Trial activado | Webhook Whop `membership_activated` con `lead_magnet_id != null` | OS (badge 🧲 ya existente) |

Ver SOP `marketing/06-lead-magnets` para flow técnico end-to-end.

## Fórmula del modelo

Con **proyección** (15/15/2/50/40):
- 1.000 visitas/día → 150 trials → 22 bumps + 3 anuales (2.910€) + 75 llamadas + 60 mensuales (5.820€/mes recurrente)

Con **objetivo** (30/30/5/70/60):
- 1.000 visitas/día → 300 trials → 90 bumps + 15 anuales (14.550€) + 210 llamadas + 180 mensuales (17.460€/mes recurrente)

## Por qué cada KPI importa

- **KPI 1** mide la landing: si copy/oferta no encajan con el avatar, este número se hunde.
- **KPI 2** liquida el ad spend del día. Sin bump, escalar es caro.
- **KPI 3** es el match grande. Cada anual = 10 meses de mensualidad cobrados al instante.
- **KPI 4** asegura que el embudo de venta humana esté lleno. Sin llamadas no hay cierre alto.
- **KPI 5** mide retención: cuántos clientes pasan del trial gratis al cobro real.

## Origen del meeting

Estos KPIs salieron de la conversación Marco + Adrián + JP el 27-abr-2026. El meeting completo está en `docs/meetings/daily/2026-04-27-estrategia-funnel-nuevo.md`.

**Métricas son aspiracionales** (no están basadas en histórico real porque el funnel MIFGE aún no ha corrido). Se ajustarán con datos reales una vez encendamos las campañas.

## Cambios versionados

- **2026-04-30** (v1): trasladada de la página `/strategy` (que se elimina) al knowledge para que viva con el resto de documentación operativa.
- **2026-05-04** (v2): order bump cambiado de 20€ → 19€ tras configuración real en Whop.
- **2026-05-06** (v3): añadido KPI 0 "Opt-in lead magnet → Free Trial" como mini-funnel de 5 pasos. Decisión de Marco para ampliar TOFU del funnel sin romper los 5 KPIs originales. Baseline de proyección/objetivo se establecerá tras correr el primer mes de lead magnets en producción.
