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
| BUMP | CAPITAL HUB BONUS | 20€ | — | One-time (order bump) |

Nombres definitivos pendientes — se actualizan post-MVP.

## Flujo del checkout (link directo, MVP)

```
Landing /mifge
   │
   └──► click "QUIERO MI PRUEBA GRATUITA"
        │
        └──► Whop hosted checkout (URL directa con producto MES + bump opcional)
             │
             ├──► Whop captura tarjeta + activa trial
             │
             └──► Webhook `membership_activated` → /api/whop/webhook
                  │
                  ├──► Insert lead en `mifge_leads`
                  ├──► Inserta entry en pipeline CRM como "Free Trial"
                  ├──► Llamada HTTP a Capital Hub App para provisionar usuario
                  ├──► Trigger email #1 (bienvenida trial)
                  └──► Trigger evento Meta CAPI `mifge_free_trial_started`

           Después: la página post-checkout dirige al cliente a /mifge/upsell-anual
           dentro de NUESTRO dominio (no Whop). Desde ahí seguimos el flow.
```

## Refinamientos post-MVP

- Personalizar el checkout: usar el widget embebido de Whop dentro de `/mifge/checkout` para mantener al cliente en nuestro dominio (mejor branding, menos drop-off).
- Renombrar productos con nombres definitivos cuando los confirmemos.

## Cambios versionados

- **2026-04-30** (v1): MVP confirmado link directo Whop + flujo via webhook + provisión usuario via HTTP a App.
