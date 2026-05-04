---
title: Arquitectura — Capital Hub OS vs Capital Hub App
order: 5
---

# Dos productos distintos, dos proyectos distintos

Este documento clarifica qué es qué para no volver a confundirlos.

## Capital Hub OS (este proyecto)

- **Qué es**: el "panel interno" de Marco + Adrián + equipo.
- **Quién lo usa**: solo nosotros (admin login).
- **Qué contiene**:
  - `/dashboard` (KPIs marketing + ventas)
  - `/board` (visual de tareas)
  - `/tasks` (lista de tareas)
  - `/crm` (pipeline MIFGE — pendiente)
  - `/webs` (admin de las webs/funnels que sacamos)
  - `/sops` (knowledge — este documento)
  - **`/mifge/*`** (las landings públicas del funnel — son las únicas páginas públicas del OS; el resto requiere auth)
- **Stack**: Next.js 16, Supabase, Vercel.
- **Supabase**: proyecto `aglyoyqtzozdnusltjxe` (cuenta personal de Adrián Villanueva).
- **Vercel**: actualmente cuenta de **Marco Antonio**. **Pendiente migrar a cuenta de Adrián / Capital Hub** (tarea `t_migrar_vercel_marco_adrian` en someday — se hace presencialmente).
- **Dominio**: `ecoai.capitalhubapp.com` (confirmado 2026-05-01). Apunta al deploy actual de Vercel en cuenta de Marco. Tras migrar Vercel, el dominio sigue siendo el mismo (solo cambia owner del proyecto).

## Capital Hub App (otro proyecto)

- **Qué es**: el portal del cliente — donde llega después de comprar.
- **Quién la usa**: clientes que han activado trial o pagado MES/AÑO.
- **Qué contiene**:
  - Formación (masterclasses, plan personalizado)
  - Bolsa de empleo
  - Comunidad (la real es Discord, esto se decidirá después)
  - Test vocacional
- **Stack**: Next.js (otro repo, otro deploy).
- **Supabase**: proyecto **DISTINTO** del OS.
- **Vercel**: cuenta de Adrián.
- **Repo**: en otro directorio del ordenador de Marco. NO está en este repo.

## Cómo se conectan

El cliente nunca toca el OS (excepto las landings públicas `/mifge/*`). Cuando compra:

```
Cliente paga en Whop
   │
   └──► Whop webhook → OS (/api/whop/webhook)
        │
        ├──► OS guarda lead/cliente en su BD
        │
        └──► OS llama por HTTP a App (POST https://app.capitalhub.../api/users/provision)
             con secret compartido + email + plan
             │
             └──► App crea usuario, devuelve magic link
                  │
                  └──► OS envía email al cliente con magic link
                       │
                       └──► Cliente clica → entra a App Capital Hub logueado
```

## Variables de entorno cruzadas

En el `.env.local` del OS:
- `APP_CAPITAL_HUB_URL` — base URL del App (para llamar al endpoint de provisión)
- `APP_CAPITAL_HUB_PROVISION_SECRET` — secret compartido entre OS y App para que App valide la llamada

En el `.env.local` del App (lo gestionará Marco/Adrián):
- Mismo `APP_CAPITAL_HUB_PROVISION_SECRET` — para validar que la llamada de provisión viene del OS legítimo.

## Por qué dos proyectos separados

- **Aislamiento**: si tumbamos el OS por un deploy, la App sigue funcionando para los clientes.
- **Permisos**: el código del OS contiene panel interno; el código del App es producto cliente. Mejor no mezclar.
- **Equipos**: si en el futuro hay un dev del producto y otro del panel, cada uno trabaja en su repo.

## Variables de entorno y deploy

**Regla crítica**: las env vars de `.env.local` (en mi máquina) **NO viajan automáticamente a Vercel**. Cada vez que añado una variable nueva al `.env.local`, **DEBO** subirla también a Vercel production usando:

```bash
printf "%s" "$VALOR" | npx vercel env add NOMBRE production --force
```

Si no lo hago: el código en producción ve la variable como `undefined` y los endpoints que la usan fallan silenciosamente (ej: el botón "Disparar evento manual" del panel /ads devuelve "Meta credentials no configuradas" porque `META_CAPI_TOKEN` no está en runtime).

**Síntomas típicos** del problema:
- Webhook Whop responde 401 (porque `WHOP_WEBHOOK_SECRET` falta y la firma falla)
- Emails Resend no se envían (porque `RESEND_API_KEY` falta)
- Tracking Meta CAPI falla con "Meta credentials no configuradas"
- Botón landing va a `/mifge/checkout` en vez de Whop directo (porque `NEXT_PUBLIC_WHOP_CHECKOUT_URL_MES` está vacía y se usa el fallback)

**Verificación rápida de qué está en Vercel**:
```bash
npx vercel env ls production
```

**Trigger redeploy** con nuevas envs (sin esto, las envs nuevas no aplican):
```bash
npx vercel deploy --prod --yes
```

## Cambios versionados

- **2026-04-30** (v1): definida arquitectura OS ↔ App con HTTP + secret. Pendiente: dominio del OS, migración Vercel a Adrián.
- **2026-05-04** (v2): regla añadida sobre env vars y Vercel. Subidas a Vercel production: WHOP_*, RESEND_*, META_*, NEXT_PUBLIC_WHOP_CHECKOUT_URL_*, NEXT_PUBLIC_META_PIXEL_ID. Triggered redeploy `capital-hub-eco-f738cokki`.
