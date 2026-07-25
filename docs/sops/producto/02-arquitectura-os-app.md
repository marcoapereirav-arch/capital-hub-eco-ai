---
title: Arquitectura — Capital Hub OS vs Capital Hub App
order: 2
---

# Dos productos distintos, dos proyectos distintos

Este documento clarifica qué es qué para no volver a confundirlos.

## REGLA DE ORO: contenido de alumnos SIEMPRE en la App

**TODO lo que sea para el alumno vive en la App** (repo `capital-hub-app`, dominio `app.capitalhubapp.com`), **NUNCA en el OS.**

Incluye: formación y lecciones, material visual de formación (ej. la formación IA Integrator), comunidad, bolsa de empleo, onboarding del alumno, perfil público, y cualquier página que un alumno vaya a ver.

El OS es SOLO el panel interno del equipo. Su única cara pública son los funnels de captación (`/mifge`, `/test-personalidad`, `/reservar`, etc.), que son marketing (leads), no producto del alumno.

**How to apply:**
- Antes de construir cualquier página: ¿la ve un alumno? Si sí, va en la App.
- Si por error se construyó contenido de alumno en el OS, se migra a la App y se retira del OS.

**Why:** Marco lo dejó como regla el 2026-07-02. Mezclar producto del alumno en el panel interno rompe la separación OS/App (aislamiento, permisos, equipos).

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
- **Vercel**: team Pro `adrianvillanuevarios-cmds-projects` (`team_RgIpGFtQApuwauxv803z6z4t`), proyecto `capital-hub-eco-ai` (`prj_hVU242RC7DqTFhHG2IXXjy85w7G9`). La migración desde la cuenta personal de Marco se **completó el 2026-05-05** — ver `producto/06`.
- **Dominio**: `os.capitalhubapp.com`. El antiguo `ecoai.capitalhubapp.com` quedó como legacy y responde 308 hacia `os.`.

## Capital Hub App (otro proyecto)

- **Qué es**: el portal del cliente — donde llega después de comprar.
- **Quién la usa**: clientes que han activado trial o pagado MES/AÑO.
- **Qué contiene**:
  - Formación (masterclasses, plan personalizado)
  - Bolsa de empleo
  - Comunidad (la real es Discord, esto se decidirá después)
  - Test vocacional
- **Stack** (verificado 2026-05-25 al clonar): **Vite + React 19 SPA + Tailwind + Supabase**, NO Next.js. El front vive en `web/`; el backend son **Supabase Edge Functions** en `supabase/functions/` (función `api` con router + handlers como `training.ts`, `subscription.ts`; más webhooks `stripe-webhook`, `hotmart-webhook`, `ghl-webhook`).
- **Modelo de acceso**: por `subscription_tier` (ej. `T1` = acceso completo a formación + marketplace/bolsa de empleo) + estado activo. Lo conceden los webhooks de pago. ⚠️ **Hoy la App tiene webhooks de Stripe / Hotmart / GHL, NO de Whop** — y el OS cobra por Whop. Ese es el hueco a cerrar en la integración.
- **Supabase**: proyecto **DISTINTO** del OS — **NO** es el `aglyoyqtzozdnusltjxe` que usamos en el OS. El App tiene su propio proyecto Supabase con su propia auth.users y sus propias tablas (formación, lecciones, progreso, etc.).
- **Vercel**: **CUENTA distinta** a la cuenta actual del OS (que está en cuenta de Marco). Marco confirmó 2026-05-04 que el App vive en otra cuenta Vercel.
- **Repo** (recibido 2026-05-25): `https://github.com/SASbot01/capitalhub2.0.git`. Clonado en `/Users/marcoantonio/Marco-Codes/App Capital Hub` (carpeta local renombrada desde `capitalhub2.0`; hermana del OS, dentro de Marco-Codes). NO confundir con `app-capital-hub` (carpeta vieja con guiones). NO está dentro de este repo del OS.
  - ⚠️ **El repo `SASbot01/capitalhub2.0` NO es nuestro** (es de otra persona). **Adrián Villanueva debe transferirlo/moverlo a SU espacio de GitHub y trabajar desde ahí.** NO se commitea a `SASbot01`. La copia local solo sirve para estudiar y preparar el contexto/handoff mientras tanto.
- **Contexto de la App** (2026-05-25): se creó un `CLAUDE.md` en la raíz del repo de la App con todo el contexto que tenemos aquí (qué es, relación con el OS, flujo de provisión, reglas de Whop, mapeo de acceso, setup pendiente), para que una sesión abierta en la ventana de la App arranque con contexto completo y las dos cosas queden separadas pero coordinadas.

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

> **Nota de implementación (2026-05-25):** como la App es un SPA Vite (sin rutas API de Next.js), el endpoint de provisión NO es una ruta Next.js sino una **Supabase Edge Function de la App** (ej. `https://<app-ref>.supabase.co/functions/v1/provision-user`), que valida el secret compartido (`_shared/auth.ts`), crea/enlaza el usuario (migración `auth_link`), pone `subscription_tier` activo y devuelve magic link. El lado OS ya está listo salvo esa llamada: es el `// TODO provisión App` en `src/app/api/whop/webhook/route.ts` (case `membership.went_valid`).

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
- Generador de guiones de Content Intel devuelve `OPENROUTER_API_KEY not set` (porque la key está en `.env.local` pero no en Vercel production — incidente 2026-05-07)

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
- **2026-05-07** (v3): incidente Content Intel. Adrián intentó generar un guion en producción y obtuvo `OPENROUTER_API_KEY not set`. Verificado: las 3 keys del feature (`OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `APIFY_TOKEN`) estaban en `.env.local` pero NO en Vercel production. Subidas con `printf | vercel env add ... --force` y triggered redeploy `capital-hub-eco-e9ucfe4l7` (Ready · Production). **Lección**: cualquier feature nueva que añade dependencia de API externa (OpenRouter, Gemini, Apify, Resend, etc.) debe incluir como subtarea explícita "subir keys a Vercel production + redeploy" — no asumir que el equipo lo hará después.
- **2026-05-25** (v4): App **recibida y clonada** (`SASbot01/capitalhub2.0`, carpeta local renombrada a `App Capital Hub`). Stack real verificado: **Vite + React 19 SPA + Supabase Edge Functions**, NO Next.js (se corrige la suposición previa). Modelo de acceso por `subscription_tier`. La App trae webhooks Stripe/Hotmart/GHL pero **no Whop** → hueco de integración identificado. El endpoint de provisión se implementará como Edge Function de la App, llamado desde el `// TODO` del webhook Whop del OS.
- **2026-05-25** (v5): Marco aclara puntos clave. (a) El repo `SASbot01/capitalhub2.0` **NO es nuestro** → Adrián lo mueve a su GitHub y se trabaja ahí; no commitear a SASbot01. (b) **El mapeo de acceso se DERIVA del funnel/Whop que ya existe en el OS**, no se le pregunta a Marco: el producto Capital Hub es una membresía única de acceso completo, así que **Whop MES / AÑO / trial 14d → tier `T1`** (formación + bolsa de empleo), **BUMP → bonus** (coin/badge), y **cancelación Whop → revocar (tier null)**. (c) Reforzado: **Whop = SOLO checkout** (sin emails de Whop, sin acceso/comunidad de Whop a alumnos; el alumno solo entra a la App por magic link nuestro). (d) Se creó `CLAUDE.md` de contexto en el repo de la App.
- **2026-06-26** (v6): **CORRECCIÓN verificada en vivo.** La App de **producción** (`app.capitalhubapp.com`)
  NO usa un Supabase separado: usa la **misma Supabase del OS** (`aglyoyqtzozdnusltjxe`) — tanto el login como
  la edge function `api` apuntan ahí (visto en las llamadas de red con Playwright). La "separación de
  Supabase" descrita arriba (v1–v5) era el plan original / el del repo clonado capitalhub2.0; la realidad
  desplegada es **compartida** (coincide con SOP 17). El proyecto `xkuhkkjeuzxutggbnwed` que aparece en el
  `web/.env` local es legacy, NO producción. Las migraciones del repo de la App son del port viejo y no son el
  esquema vivo. Ver detalle en SOP 50 (verificación en vivo).
- **2026-07-24** (v8): **REGLA DE ORO rota otra vez y corregida.** El contenido nuevo de la formación IA Integrator (los tres entrenamientos) se volvió a construir por error en el OS, pese a que la regla estaba escrita desde el 2026-07-02 y pese a haber leído el Knowledge al empezar la sesión. Además duplicaba guías que ya existían en la App. Rehecho entero en la App y **retiradas del OS** la feature `formacion-ia-integrator` y las rutas `(public)/formacion/*`. Queda cerrado el pendiente de v7. **Comprobación obligatoria antes de crear cualquier pantalla: ¿la ve un alumno? Entonces va en la App, no aquí.**
- **2026-07-02** (v7): Marco fija la REGLA DE ORO (arriba): todo contenido de alumnos vive en la App, nunca en el OS. La formación IA Integrator en versión visual se construyó por error como página pública en el OS (`/formacion/ia-integrator`, feature `formacion-ia-integrator`); queda pendiente migrarla a la App y retirarla del OS. También queda fijada la REGLA #7 del protocolo del agente (SOP 04): prohibido el guion largo (em dash) en todo texto.

- **2026-07-25** (v8): **Verificado con prueba dura** que OS y App comparten UNA sola base de datos en producción (`aglyoyqtzozdnusltjxe`): el JS publicado de `app.capitalhubapp.com` la lleva incrustada, y ahí conviven las tablas del OS y las de la App (~120). El proyecto Supabase `xkuhkkjeuzxutggbnwed` ("Capital Hub APP") existe pero está **vacío y dormido** (0 formaciones, 0 alumnos reales, sin actividad desde el 20-jun): es legacy. El plan histórico de "bases separadas" (v1-v5) quedó atrás cuando la App se reconectó a la del OS. **Pendiente de limpieza:** marcar como legacy los `web/.env` de la App que aún apuntan al proyecto dormido, y decidir su destino. Además se detectó una **puerta entreabierta** (unas tablas de los lados del OS legibles por un alumno logueado: email_logs, algunos leads, invitaciones, afiliados, team); no es crítico pero conviene endurecer su RLS. El Knowledge NO estaba afectado (eran archivos); desde el 2026-07-25 pasa a BD con RLS admin/equipo/alumnos-cero (ver SOP 54).
