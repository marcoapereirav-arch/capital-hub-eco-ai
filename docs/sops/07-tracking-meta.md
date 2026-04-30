---
title: Tracking Meta — Pixel + CAPI + Ads Insights
order: 7
---

# Tracking Meta — Pixel browser + CAPI server + Ads metrics

## Credenciales necesarias (pendientes de pasarse)

| Variable env | Qué es | Estado |
|---|---|---|
| `META_PIXEL_ID` | ID del pixel de Capital Hub | ⏳ pendiente del usuario |
| `META_CAPI_TOKEN` | Token de Conversions API server-side | ⏳ pendiente del usuario |
| `META_AD_ACCOUNT_ID` | ID de la cuenta publicitaria | ⏳ pendiente del usuario |
| `META_TEST_EVENT_CODE` | (opcional) Test event code para validar en Events Manager | ⏳ |

El usuario ya tiene los 3 — solo falta pasármelos en `.env.local`.

## 7 eventos custom MIFGE

Doble disparo (browser + server-side) para deduplicación con `event_id`.

| Evento | Trigger | Cuándo se dispara | Value |
|---|---|---|---|
| `mifge_lead` | Browser onClick CTA "QUIERO MI PRUEBA GRATUITA" + insert lead BD | Al hacer click en el CTA principal | 0 |
| `mifge_free_trial_started` | Webhook Whop `membership_activated` MES | Activación del trial 14d | 0 |
| `mifge_order_bump` | Webhook Whop bonus product | Compra del bump 20€ en checkout | 20 EUR |
| `mifge_call_booked` | POST `/api/mifge/calls/book` | Reserva de llamada | 0 |
| `mifge_anual_purchased` | Webhook Whop `membership_activated` AÑO | Compra del plan anual | 970 EUR |
| `mifge_monthly_purchased` | Webhook Whop `invoice_paid` recurrente MES (día 15+) | Cobro mensual exitoso | 97 EUR |
| `mifge_call_attended` | Cron post-slot + Fathom OK | Cliente atendió la llamada | 0 |

## Arquitectura del tracking

```
Browser (Pixel + cookies _fbp/_fbc)
   │
   ├── fbq('track', 'mifge_lead', {value: 0, currency: 'EUR'}, {eventID: 'lead-uuid'})
   │
   └──> evento llega a Meta vía pixel
        │
        └─── DEDUP por eventID con el server-side ───┐
                                                      │
Server (Next.js API routes)                           │
   │                                                  │
   ├── webhook Whop / API book / etc.                 │
   │                                                  │
   └── POST https://graph.facebook.com/v18.0/{PIXEL}/events
       payload: {event_id, event_name, user_data{em,ph,fbp,fbc,client_ip,client_user_agent}, custom_data{value,currency}}
```

## Hash de PII obligatorio

Para CAPI, los datos del usuario (email, phone, etc.) deben llegar **hasheados con SHA256**:

```ts
import crypto from "crypto"
const hash = (s: string) => crypto.createHash("sha256").update(s.toLowerCase().trim()).digest("hex")

const userData = {
  em: hash(lead.email),
  ph: hash(lead.phone.replace(/\D/g, "")),
  fbp: req.cookies._fbp,
  fbc: req.cookies._fbc,
  client_ip_address: req.headers["x-forwarded-for"]?.split(",")[0],
  client_user_agent: req.headers["user-agent"],
}
```

## Integración Meta Ads Insights en `/dashboard`

Llamada al endpoint `https://graph.facebook.com/v18.0/{AD_ACCOUNT_ID}/insights` para traer:
- `spend` (gasto diario)
- `impressions`, `clicks`, `ctr`, `cpc`, `cpm`
- `actions` (conversiones por evento custom)
- `roas` calculado (revenue / spend)

Granularidad: por campaña, adset y ad. Refresh cada 1h via cron.

Tabla nueva en Supabase: `meta_ads_metrics` con snapshot diario para histórico.

## SMS 2FA

Para autorizar el acceso API a Meta Ads desde el OS, Meta Business pide validación SMS al usuario propietario de la cuenta. Tarea separada en el board: `t_sms_2fa_meta_ads`.

## Cambios versionados

- **2026-04-30 (v1)**: documento inicial. Pendiente: ejecutar implementación (tarea `t_mifge_11_meta_tracking` bloqueada por credenciales).
