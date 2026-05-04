---
title: Checkout y Whop — qué hace y qué NO hace
order: 4
---

# Whop = solo gateway de checkout

Reglas que no se rompen.

## Qué SÍ hace Whop

- Procesa pagos (tarjeta, IBAN, etc.)
- Gestiona el formulario de checkout (datos del cliente + tarjeta)
- Maneja el order bump del checkout
- Maneja el free trial 14 días del producto MES
- Manda webhooks a nuestro OS cuando ocurren eventos (membership_activated, invoice_paid, membership_deactivated, etc.)

## Qué NO hace Whop

- **NO** aloja la formación, masterclasses, bolsa de empleo, comunidad — eso vive en **Capital Hub App** (proyecto aparte).
- **NO** redirigimos al cliente a ningún sitio de Whop después de pagar. Tras checkout, el cliente recibe email con acceso directo a Capital Hub App.
- **NO** mostramos el dominio whop.com como destino final.

## Los 3 productos en Whop

| Producto interno | Nombre Whop (provisional) | Precio | Trial | Recurrencia |
|---|---|---|---|---|
| MES | CAPITAL HUB MES | 97€/mes | 14 días gratis | Mensual auto-renovable |
| AÑO | CAPITAL HUB AÑO | 970€/año | Sin trial | Anual auto-renovable (2 meses gratis vs mes) |
| BUMP | CAPITAL HUB BONUS | 19€ | — | One-time (order bump) |

Nombres definitivos pendientes — se actualizan post-MVP.

## Flujo COMPLETO del funnel (orden de páginas)

```
Anuncio Meta
   ↓
/mifge (landing con VSL + CTA)
   ↓
Whop hosted checkout (free trial 14d producto MES, opcional order bump 19€)
   │
   ├─ webhook membership.went_valid → OS:
   │    · upsert lead en mifge_leads (pipeline_stage=free_trial)
   │    · email Resend #1 (bienvenida trial) — desde adrian@mail.capitalhubapp.com
   │    · evento Meta CAPI mifge_free_trial_started
   │    · HTTP call a Capital Hub App → provisión usuario + magic link
   │
   ↓ (success_url Whop redirige al cliente a:)
/mifge/upsell-anual (oferta plan anual 970€ post-checkout — momento high intent)
   │
   ├─ SÍ → Whop checkout AÑO → webhook → pipeline_stage=won_ano + CAPI mifge_anual_purchased + email
   │       success_url Whop AÑO redirige a /mifge/agenda
   │
   └─ NO → /mifge/agenda directo
   ↓
/mifge/agenda (calendar propio, slots disponibles 20min con Adrián)
   ↓ (POST /api/mifge/calls/book)
   │   · insert calls + lead a pipeline_stage=agendados
   │   · email Resend #2 confirmación + .ics
   │   · CAPI mifge_call_booked
   ↓
/mifge/llamada-confirmada (preparación pre-call + recordatorios cron 24h y 1h)
```

**Reglas inquebrantables del flow:**

- Tras Whop checkout (MES o AÑO) → siempre `/mifge/upsell-anual` (NO `/mifge/gracias`). El upsell anual va INMEDIATAMENTE post-pago para capturar intent.
- `/mifge/gracias` existe pero NO está en el flow principal. Sirve como fallback para casos donde no hay upsell que ofrecer (ej: cliente que ya compró anual va directo a /mifge/agenda).
- El cliente NUNCA debe ver `whop.com` salvo durante la pasarela de pago en sí. Después siempre rebota a nuestro dominio.

## URLs de checkout — usar SIEMPRE el `direct_link`

Whop tiene 2 tipos de URLs por producto y son DISTINTAS:

| Tipo | Formato | Para qué sirve |
|---|---|---|
| **Página de presentación** | `https://whop.com/<company-slug>/<product-slug>` (ej: `https://whop.com/capitalhub/capital-hub-mes`) | Pantalla de marketing del producto. Tiene un botón "Comenzar prueba gratuita" que después lleva al checkout. **NO usar como link de checkout — añade un click extra.** |
| **Direct checkout** ✅ | `https://whop.com/checkout/<plan_id>` (ej: `https://whop.com/checkout/plan_HjUAhKnn79rIu`) | Va DIRECTO al formulario de pago. **Esta es la que se usa en `NEXT_PUBLIC_WHOP_CHECKOUT_URL_*`.** |

Cómo conseguir el `direct_link` de un plan:

```bash
curl -H "Authorization: Bearer $WHOP_API_KEY" \
  "https://api.whop.com/v2/plans/<plan_id>" | jq .direct_link
```

Plan IDs (2026-05-04):
- MES → `plan_HjUAhKnn79rIu`
- AÑO → `plan_Y4AWfTlfEqexT`
- BONUS → `plan_1dcgC5O9NfW4f`

## URL del webhook (productivo)

`https://ecoai.capitalhubapp.com/api/whop/webhook` — confirmado 2026-05-01. Vercel actual está en cuenta de Marco; cuando se migre a cuenta de Adrián/Capital Hub el dominio sigue siendo el mismo.

## Configuración pendiente en Whop dashboard (acción manual de Marco)

Por cada producto (MES, AÑO, BONUS) hay 2 cosas que configurar — **NO conozco los nombres exactos de las opciones en el dashboard de Whop, así que la lista es funcional, no literal**:

1. **Desactivar emails que Whop envía al cliente** (welcome, recibos, recordatorios de renovación, etc.). Solo nuestros emails Resend deben llegar al cliente.
2. **Configurar el redirect post-purchase** (success_url o equivalente) a:
   - Producto MES → `https://ecoai.capitalhubapp.com/mifge/upsell-anual`
   - Producto AÑO → `https://ecoai.capitalhubapp.com/mifge/agenda`
   - Producto BONUS → mismo que MES (es order bump)
3. **Desvincular cualquier "experience" / "Discord" / "Telegram" / hub Whop** que dé acceso interno a una comunidad Whop al cliente. El cliente solo accede a Capital Hub App vía magic link nuestro.

Si Marco no encuentra alguna de estas opciones → comparte captura del settings del producto y AI le indica dónde tocar (regla #4: no inventar UI).

Alternativa: la tarea `t_whop_configure_via_api` investiga si la API de Whop permite editar estos settings sin pasar por el dashboard.

## Refinamientos post-MVP

- Personalizar el checkout: usar el widget embebido de Whop dentro de `/mifge/checkout` para mantener al cliente en nuestro dominio (mejor branding, menos drop-off). En **someday** — el embed es nice-to-have. MVP funciona con redirect.
- Renombrar productos con nombres definitivos cuando los confirmemos.

## Cambios versionados

- **2026-04-30** (v1): MVP confirmado link directo Whop + flujo via webhook + provisión usuario via HTTP a App.
