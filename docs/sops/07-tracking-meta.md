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
| `mifge_order_bump` | Webhook Whop bonus product | Compra del bump 19€ en checkout | 19 EUR |
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

## Módulo `/ads` en el OS — estructura propuesta

Sección dedicada al tracking + métricas Meta Ads (futuro: Google Ads, TikTok Ads). Nueva ruta `/ads` con tabs:

### Tab 1 — Dashboard (live Meta Ads Insights API)
Lo que Marco/Adrián ven al entrar:
- **KPIs grandes arriba**: spend hoy, spend 7d, conversiones 7d, ROAS 7d, CAC actual
- **Gráfica diaria** (30d): línea de spend + barras de conversiones
- **Tabla por campaña** (sortable): nombre, spend, impresiones, CTR, CPC, CPM, conversiones (por evento custom MIFGE), ROAS calculado
- **Tabla por adset** (drill-down al hacer click en una campaña)
- **Top 5 ads ganadoras** (mayor ROAS) con thumbnail del creative
- **Top 5 ads perdedoras** (bajo ROAS, alto spend) — para pausar

### Tab 2 — Tracker (audit trail eventos CAPI)
Para debugging y control:
- **Tabla en vivo de eventos enviados**: timestamp, evento (mifge_lead, mifge_free_trial_started, etc.), valor + currency, lead asociado, status (sent/failed/deduplicated)
- **Filtros**: por evento, status, fecha, lead
- **Detalle expandible** por fila: payload completo, response Meta (event_id, fbtrace_id), fbp/fbc cookies usadas
- **Stats**: % match rate Pixel+CAPI, % failed, total enviados 24h
- **Botón "Crear evento manual"**: modal donde se elige evento + se busca lead por email + se dispara desde el OS. Útil cuando un lead no fue trackeado (ej: error de cookie, pago manual fuera del flow)

### Tab 3 — Atribución (cruce Meta + datos propios)
Donde el usuario entiende qué creatives están funcionando:
- **Funnel breakdown**: visitas landing → leads → trials activos → bumps → llamadas → WON Mes / WON Año, con conversion % entre cada paso
- **Cost per stage**: CPL, CPA (post-trial), CAC (cliente activo)
- **Atribución por creative**: qué ads generaron las conversiones grandes (especialmente WON Año = 970€)
- **Identificar leaks**: dónde se atasca más tráfico para optimizar

### Tab 4 — Configuración
Panel admin de la integración:
- Pixel ID (mostrado, editable)
- CAPI token (ofuscado, botón regenerar)
- Ad Account ID
- Status conexión: ✓ conectado / ⏳ SMS pendiente / ✗ desconectado
- Botón **"Enviar test event"** → dispara evento de prueba a Meta para verificar setup
- Lista de los 7 eventos custom configurados con su `event_name` esperado
- Match rate global de los últimos 30 días
- Reconexión OAuth si caduca el token (Adrián recibe SMS)

### Tab 5 — Health & Alertas (someday, post-MVP)
Sistema reactivo:
- ROAS por debajo de target (ej: <1.5x) → alerta naranja
- CTR cayendo más del 30% vs media 7d → alerta naranja
- Eventos CAPI fallando >5% → alerta roja
- Match rate Pixel+CAPI <50% → alerta amarilla
- Tarjeta de pago Meta próxima a caducar → alerta amarilla
- Push notifications PWA cuando se dispare alguna

### Por qué `/ads` y no dentro de `/dashboard`
- `/dashboard` es vista ejecutiva resumida (KPIs del negocio en una sola pantalla)
- `/ads` es panel de control + debug + acciones (audit trail, manual triggers, config)
- Separación clara: ejecutivo vs operativo
- Futuro-proof: cuando se sume Google Ads / TikTok Ads, son tabs adicionales aquí, no contaminan el dashboard

### Tareas en el board
- `t_ads_section_setup` — ruta + tabs
- `t_ads_dashboard_metrics` — Tab 1 (depende de `t_mifge_11_meta_tracking` para credenciales)
- `t_ads_capi_tracker` — Tab 2 (lo más útil para debug, primero)
- `t_ads_attribution` — Tab 3
- `t_ads_config_panel` — Tab 4
- `t_ads_health_alerts` — Tab 5 (someday)
- `t_ads_section_nav` — entrada sidebar

## Cambios versionados

- **2026-04-30 (v1)**: documento inicial. Pendiente: ejecutar implementación (tarea `t_mifge_11_meta_tracking` bloqueada por credenciales).
- **2026-05-04 (v2)**: añadida estructura del módulo `/ads` en el OS (5 tabs: Dashboard / Tracker / Atribución / Configuración / Health). 7 tareas creadas en el board para construirlo. Pendiente validación de Marco antes de implementar.
