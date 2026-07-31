---
title: Tracking Meta — Pixel + CAPI + Ads Insights
order: 5
---

# Tracking Meta — Pixel browser + CAPI server + Ads metrics

> ⚠️ **Este documento es de mayo de 2026 y habla del funnel MIFGE, que ya no se usa.**
> Para el estado VIVO del sistema de medición (qué eventos se disparan, dónde, la
> sección de Ads con sus tres pestañas y el interruptor por funnel), ir a
> [`09-eventos-meta-catalogo.md`](09-eventos-meta-catalogo.md). Este 05 se conserva por
> el histórico y por la parte de Ads Insights API, que sigue siendo válida.

## Credenciales necesarias (pendientes de pasarse)

| Variable env | Qué es | Estado |
|---|---|---|
| `META_PIXEL_ID` | ID del pixel de Capital Hub | ⏳ pendiente del usuario |
| `META_CAPI_TOKEN` | Token de Conversions API server-side | ⏳ pendiente del usuario |
| `META_AD_ACCOUNT_ID` | ID de la cuenta publicitaria | ⏳ pendiente del usuario |
| `META_TEST_EVENT_CODE` | (opcional) Test event code para validar en Events Manager | ⏳ |

El usuario ya tiene los 3 — solo falta pasármelos en `.env.local`.

## Eventos custom (7 MIFGE + 2 lead magnets)

Doble disparo (browser + server-side) para deduplicación con `event_id`. Los eventos lead magnet son SOLO server-side (el opt-in ocurre dentro de ManyChat, sin browser nuestro).

### 7 eventos MIFGE (existentes)

| Evento | Trigger | Cuándo se dispara | Value |
|---|---|---|---|
| `mifge_lead` | Browser onClick CTA "QUIERO MI PRUEBA GRATUITA" + insert lead BD | Al hacer click en el CTA principal | 0 |
| `mifge_free_trial_started` | Webhook Whop `membership_activated` MES | Activación del trial 14d | 0 |
| `mifge_order_bump` | Webhook Whop bonus product | Compra del bump 19€ en checkout | 19 EUR |
| `mifge_call_booked` | POST `/api/mifge/calls/book` | Reserva de llamada | 0 |
| `mifge_anual_purchased` | Webhook Whop `membership_activated` AÑO | Compra del plan anual | 970 EUR |
| `mifge_monthly_purchased` | Webhook Whop `invoice_paid` recurrente MES (día 15+) | Cobro mensual exitoso | 97 EUR |
| `mifge_call_attended` | Cron post-slot + Fathom OK | Cliente atendió la llamada | 0 |

### 2 eventos lead magnets (nuevos — añadidos 2026-05-06)

| Evento | Trigger | Cuándo se dispara | Value | Custom data |
|---|---|---|---|---|
| `mifge_lead_magnet_optin` | Endpoint `/api/manychat/lm-router` resuelve match | Email capturado vía lead magnet (cualquier LM) | 0 | `lead_magnet_slug`, `reel_post_id` (si lo conocemos), `manychat_subscriber_id` |
| `mifge_lm_<slug>` | Mismo trigger | Mismo momento — evento granular por LM | 0 | mismo + facilita crear audiencias específicas en Meta por LM |

**Por qué 2 eventos por opt-in:** `mifge_lead_magnet_optin` (agregado) facilita análisis cross-LM en Meta sin tener que sumar todos los slugs. `mifge_lm_<slug>` (granular) permite crear audiencias custom y medir ROAS por LM específico. Doble disparo = mismo `event_id` para que Meta NO los cuente como 2 leads — se deduplican y agregan datos.

**Naming `<slug>`:** snake_case del nombre del lead magnet en BD. Ej: `test-vocacional` → `mifge_lm_test_vocacional`.

**Convención server-only:** estos eventos NO llevan Pixel browser. El `user_data` se construye con `em` (email hasheado), `ig_username` si lo tenemos, IP/UA si los pasa ManyChat. Sin `fbp`/`fbc` (no hay browser nuestro en el opt-in).

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

## Cómo verificar eventos en Meta Events Manager (UI real en español)

Las pestañas reales del Events Manager para nuestro Pixel `678018340712657`:

| Pestaña real | Para qué sirve | Cuándo usarla |
|---|---|---|
| **Resumen** | Gráfico agregado de actividad histórica | Verificar volumen acumulado. Tarda hasta **30 min** en mostrar eventos. Eventos custom (`mifge_*`) pueden no contar como "actividad" principal aquí. |
| **Probar eventos** | Live stream de eventos que llegan ahora mismo | **El método correcto para verificar setup**. Te da un `test_event_code` (formato `TEST12345`). Pegas ese código en `META_TEST_EVENT_CODE` del `.env.local` + Vercel + redeploy. Cualquier evento disparado con ese code aparece en segundos en esa pantalla. |
| **Diagnóstico** | Errores/warnings de implementación detectados por Meta | Cuando Meta detecta eventos sin params críticos (sin email hasheado, sin fbp, etc.). Útil para optimizar match rate. |
| **Historial** | Cambios de configuración del pixel | Auditoría de quién cambió qué setting. NO muestra eventos. |
| **Configuración** | Setup técnico del pixel | Editar nombre, integraciones, etc. |

**No existen pestañas "Test Events" ni "Activity"** (son nombres en inglés que no aparecen en la UI en español de Meta — los inventé en una versión anterior y rompí la confianza del usuario).

### Procedimiento real para verificar un evento manual

1. Click pestaña **"Probar eventos"** (la 2ª en el Pixel)
2. Copia el código que Meta muestra ahí (ej: `TEST12345`)
3. Añade a `.env.local` y a Vercel:
   ```
   META_TEST_EVENT_CODE=TEST12345
   ```
4. Trigger redeploy: `npx vercel deploy --prod --yes`
5. Vuelve a `/ads → Configuración → "Enviar test event"` (o usa el modal manual del Tracker)
6. **Inmediatamente** vuelve a la pestaña "Probar eventos" en Meta — verás el evento llegar con todos los datos hasheados, value, currency

Sin `META_TEST_EVENT_CODE`: el evento va a producción (cuenta real, pero tarda 30+ min en aparecer en "Resumen" y los custom events pueden no salir nunca como métrica principal).

### Cómo el OS confirma internamente

Cuando se dispara un evento (manual o auto), la respuesta del modal/panel ya muestra:
- `events_received: 1` ← Meta confirmó recepción
- `fbtrace_id: <id>` ← ID con el que Meta lo registró internamente (para soporte/debug)
- `messages: []` ← cero warnings/errores
- Link directo a "Probar eventos" del Pixel

Si los 3 datos están: el evento llegó OK al servidor de Meta, sin importar lo que muestre el "Resumen" después.

### Regla operativa derivada

**NO inventar nombres de UI de servicios externos** (Meta, Whop, Resend, Vercel, etc.) sin verificarlos en la documentación oficial o en una captura del usuario. Cuando le digo a Marco "ve a la pestaña X" y esa pestaña no existe → pierde tiempo + pierde confianza. Si no estoy 100% seguro del nombre exacto, pido screenshot o digo "busca la pestaña que tenga `<funcionalidad>`" en lugar de inventar un nombre.

## Cambios versionados

- **2026-04-30 (v1)**: documento inicial. Pendiente: ejecutar implementación (tarea `t_mifge_11_meta_tracking` bloqueada por credenciales).
- **2026-05-04 (v2)**: añadida estructura del módulo `/ads` en el OS (5 tabs: Dashboard / Tracker / Atribución / Configuración / Health). 7 tareas creadas en el board para construirlo.
- **2026-05-04 (v3)**: implementación MIFGE 11 completa (Pixel + CAPI + 7 eventos wirados). Sección /ads con Tab Tracker + Config funcionales. Test event probado y confirmado por Meta (`events_received: 1`, `fbtrace_id: Au6GRITMGqL3NOkTCcoFnJV`). Modal manual + Config "Enviar test event" mejorados con respuesta enriquecida (eventId + fbtrace_id + events_received + link directo "Probar eventos"). Pestañas reales de Meta UI documentadas (en español). Regla nueva: NO inventar nombres de UI de servicios externos.
- **2026-05-06 (v4)**: añadidos 2 eventos custom para lead magnets (`mifge_lead_magnet_optin` agregado + `mifge_lm_<slug>` granular). Convención server-only — no hay Pixel browser porque el opt-in vive dentro de ManyChat. Custom data incluye `lead_magnet_slug`, `reel_post_id` y `manychat_subscriber_id`. Wiring del trigger se hará en Fase A del proyecto lead-magnets — ver SOP `marketing/06-lead-magnets`.
