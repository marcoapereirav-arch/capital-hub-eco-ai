---
title: Funnel Test de Personalidad (Equilibria)
order: 7
---

# Funnel Test de Personalidad

Canal **principal** de captación de leads de Capital Hub (confirmado Marco 2026-06-15). No confundir con "captura solo desde Instagram": este funnel es la fuente real de leads.

## Qué es

Una landing pública (`/test-personalidad`) que ofrece **gratis** el test de personalidad de **Equilibria** (empresa colaboradora, el test NO es nuestro). El lead hace opt-in, recibe el acceso al test en la página de gracias, lo hace fuera de nuestro sitio y vuelve con el resultado por Instagram o WhatsApp, donde el setter conversa **manualmente**.

## Flujo end-to-end

```
1. Adrián difunde el test (Reels, stories, ads, conversaciones)
2. Lead llega a /test-personalidad (landing)
3. Pulsa un botón → se abre el POP-UP con el formulario opt-in
4. Rellena: nombre + email + teléfono (LOS 3 OBLIGATORIOS)
5. Submit → POST /api/optin/test-personalidad:
   - Upsert contacto por email (stage='lead' si es nuevo)
   - pipeline = "Test Personalidad" (slug 'test-personalidad') — NO el General.
     Si el contacto ya tenía pipeline_id, se PRESERVA (SOP 12/13).
   - phone guardado en el contacto (contactable por WhatsApp)
   - tag auto 'origen:test_personalidad' · origin/source 'landing_test_personalidad'
   - journey event 'optin_test_personalidad'
   - redirige a /test-personalidad/gracias
6. Gracias: agradece + botón "Abrir el test" (link Equilibria, pestaña nueva)
   + protocolo de 3 pasos: captura del resultado → enviarla por el MISMO chat
   de Instagram que ya tenían abierto, o por WhatsApp de Adrián.
7. Lead hace el test en Equilibria y manda screenshot → setter conversa manual
8. Si quiere agendar → setter le pasa /agenda?email=... → stage 'agendado' auto
9. Llamada → 'alumno'/'seguimiento'/'perdido' auto vía Registrar venta
```

## Estructura de la landing (copy aprobado por Marco)

Fuente del copy: `ch-copy-test-landing-optin.md` (raíz del repo).

- **Sección 1 — Hero**: eyebrow `Test gratis · 15 minutos · +500.000 personas lo han hecho`; titular *"Hay mil formas de vivir de internet. Esta te dice cuál es la tuya"*; subtítulo al avatar; botón **"Quiero hacer el test gratis"** → abre el pop-up.
- **Sección 2 — Qué es este test**: bloque Equilibria (lo usan multinacionales, +500.000 personas) + bloque resultado en 4 colores (fortalezas y limitadores); botón **"Hacer el test gratis"** → mismo pop-up.
- **Pop-up — Formulario**: título *"Déjame tus datos y entra al test"*; 3 campos (nombre · email · teléfono); botón **"Quiero hacer el test gratis"**; microcopy *"Te llega tu acceso y entras directo al test. Sin tarjeta, sin compromiso."*

> **Vídeo:** el copy contempla un vídeo de Adrián bajo el hero (PandaVideo/VTurb), pero **se lanza SIN vídeo**. Se añadirá cuando Marco facilite la URL.

## Configuración centralizada

`src/features/funnel-test-personalidad/config.ts` (un solo sitio):

| Valor | Contenido |
|---|---|
| `TEST_URL` | `https://pdi.equilibria.com/#/instructions/FULLES` |
| `WHATSAPP_NUMBER` | `34611874062` (Adrián, sin `+` ni espacios) |
| `INSTAGRAM_HANDLE` | `adrianvillanuevarios` |

## Archivos

- Landing: `src/features/funnel-test-personalidad/components/landing.tsx`
- Gracias: `src/features/funnel-test-personalidad/components/thank-you.tsx`
- Config: `src/features/funnel-test-personalidad/config.ts`
- Endpoint: `src/app/api/optin/test-personalidad/route.ts`
- Rutas: `src/app/(public)/test-personalidad/page.tsx` (+ `/gracias`)

La landing se muestra **siempre** (force-dynamic), sin gate draft/published, hasta nueva orden.

## Tracking Meta (Pixel + CAPI)

El opt-in dispara el evento **`test_personalidad_lead`** (custom) + **`Lead`** (estándar Meta) cuando el lead se guarda OK, usando el helper `track()` (`src/lib/meta/pixel-client.ts`): Pixel browser + Conversions API server-side con el **mismo `event_id`** para deduplicación. Incluye las UTMs (first-touch) automáticamente. Se registra en la tabla `meta_events_log` y es visible en el panel `/ads` (Tracker).

- Evento registrado en: `capi-client.ts` (CapiEventName), `/api/meta/capi/track` (ALLOWED_EVENTS), `ads-events-service.ts` (KNOWN_EVENTS + label).
- Si Meta falla, NO bloquea la redirección a `/gracias` (catch silencioso).

## Atribución de fuente (afiliados)

Cada fuente de tráfico (Paolo, JP…) reparte un **link propio**: `…/test-personalidad?utm_source=<slug>`.

- La captura de UTM ya existe (`src/lib/utm/utm-capture.ts`, first-touch 30d, montada en el layout público). El opt-in lee `utm_source` y lo envía.
- El endpoint guarda `contacts.affiliate_slug = utm_source` (**first-touch**: no se sobreescribe) y crea/asigna tag **`fuente:<slug>`**.
- Como la venta vive en el mismo contacto, la atribución viaja sola hasta el revenue.
- **Subsección Afiliados** (`/ads` → tab Afiliados): tabla `affiliates`, link autogenerado por afiliado y stats (leads/agendados/alumnos/revenue) leídas de `contacts.affiliate_slug`. Endpoint `/api/admin/affiliates` (GET stats + POST crear).

## Tracking Meta — toggle Test/Live

El modo de envío CAPI vive en `app_settings.meta_capi_mode` (`{mode:'test'|'live'}`), editable desde **/ads → Tracker** (toggle). `test` añade `test_event_code` (no optimiza ads); `live` manda data real. El cliente CAPI (`getCapiMode()`) lo lee con cache de 30s. **Antes de encender ads reales: poner Live.**

## Ajustes editables por funnel (popup ⚙️)

En `/webs`, cada funnel con manifiesto muestra botón **Ajustes** → popup para editar los links de sus botones (test_url, whatsapp, instagram) sin deploy.

- Manifiesto: `src/features/webs/lib/funnel-settings-manifest.ts` (define qué campos tiene cada funnel → el popup los detecta).
- Valores en `app_settings` key `funnel:<slug>` (endpoint `/api/admin/settings/[key]`).
- La página de gracias los resuelve server-side (`get-settings.ts`) con fallback a `config.ts` → nunca se rompe.

## Contacto recurrente (re-opt-in)

Si un contacto que **ya estaba más allá de `lead`** (agendado, seguimiento, alumno…) vuelve a pasar por el opt-in:
- **NO se degrada su stage** (se conserva). El opt-in solo pone `lead` si el contacto no tenía stage.
- Se **notifica al equipo** (tabla `notifications`, una por super_admin, tipo `recurring_optin_test_personalidad`): *"X (que ya estaba en Y) volvió a pasar por la landing"*. Visible en la campana del OS.

## Booking → pipeline (Calendly + agenda propia)

- **Agenda propia** (`/api/calendar/book`): mueve el contacto a `agendado` (guarda no-retroceso); cancelar → `seguimiento`.
- **Calendly** (`/api/webhooks/calendly`) — **CABLEADO 2026-06-25**: evento **`online-coffee`** de Adrián (`https://calendly.com/adrian-sales-capital/online-coffee`). `invitee.created` → match por email → `agendado` (o **crea** el contacto si agendó sin pasar por el test); `invitee.canceled` → `seguimiento`; `invitee_no_show.created` → `no_show`. Con guarda no-retroceso. Webhook ya suscrito (HMAC).

## Funnel de Reserva (`/reservar` → `/reservar/gracias`)

Funnel `web_reservar` en `/webs`. Cubre los dos caminos (lead que ya hizo el test, y lead que agenda directo sin test).

- **`/reservar`**: embebe el Calendly (online-coffee) inline. Al completar, capturamos `calendly.event_scheduled` (postMessage, doc oficial) y **redirigimos nosotros** a `/reservar/gracias`. **No requiere configurar nada en Calendly.** Acepta prefill `?name=&email=`.
- **`/reservar/gracias`** (post-agenda): vídeo de Adrián (Bunny) + copy basado en el vídeo ("cómo sacarle el máximo partido": sitio tranquilo/papel+boli/auriculares/100% · llega con tu ruta más o menos clara entre Marketing/Comercial/IA · puntualidad) + botón **"¿Aún no has hecho el test? Hazlo aquí"** → abre el test en ventana nueva.
- Config: `src/features/funnel-reservar/config.ts` + override `app_settings` key `funnel:reservar` (editable desde ⚙️ de /webs: calendly_url, video_guid, test_path).
- ⚠️ **Vídeo pendiente de subir a Bunny**: la `BUNNY_STREAM_API_KEY` del `.env.local` está caducada (401) y no está en Vercel. En cuanto haya key válida → subir `assets/videos/Video-Adri-Post-Agenda.MOV` y poner el `video_guid`.

## Reglas

- Los 3 campos del opt-in son **obligatorios**. El teléfono es necesario porque el seguimiento es manual por WhatsApp/IG.
- El test es de **Equilibria** (externo): solo medimos opt-ins, no si terminó el test.
- El pipeline contextual es **"Test Personalidad"**; nunca sobreescribir un `pipeline_id` ya existente.
- Si cambia el copy de la landing, la fuente sigue siendo `ch-copy-test-landing-optin.md` + este SOP.

## ManyChat (futuro, no ahora)

De momento SIN ManyChat: el setter abre IG/WhatsApp manualmente. Cuando se reactive: comentario en Reel con keyword o story reply → envía el link de la landing. La fuente única hoy es `/test-personalidad`.

## Cambios versionados

### 2026-06-22 — Copy nuevo + pop-up + teléfono + URLs reales
- Rediseño de la landing con el copy aprobado de Marco (`ch-copy-test-landing-optin.md`): 2 secciones (Hero + "Qué es este test") y formulario en **pop-up** (antes era inline de 1 pantalla).
- Añadido **3er campo: teléfono (obligatorio)**, tanto en la UI como en el endpoint (Zod + guardado en `contacts.phone`).
- Página de gracias reescrita: agradecimiento + link al test + protocolo de 3 pasos (captura → Instagram/WhatsApp).
- Placeholders reemplazados por valores reales: `TEST_URL` = Equilibria, `WHATSAPP_NUMBER` = Adrián.
- Se lanza **sin vídeo** (pendiente URL de Adrián).

### 2026-06-23 — Atribución por afiliados + toggle Test/Live + ajustes editables
- Atribución: `utm_source` → `contacts.affiliate_slug` (first-touch) + tag `fuente:<slug>`. Tablas `affiliates` + `app_settings`. Subsección Afiliados en `/ads`.
- Toggle Test/Live de Meta CAPI desde `/ads` (app_settings.meta_capi_mode), reemplaza la dependencia de la env var.
- Popup ⚙️ por funnel en `/webs` para editar links de botones sin deploy (manifiesto + app_settings + fallback).
- Stage: cancelar una cita pasa `agendado → seguimiento` (antes `lead`). Orden de columnas: lead, agendado, seguimiento, no_show, alumno, perdido.
- Colores de tag a neutros del brandkit.

### 2026-06-22 — Tracking Meta CAPI + link Equilibria actualizado
- El opt-in ahora dispara `test_personalidad_lead` + `Lead` (Pixel + CAPI, dedup por event_id, con UTMs). Antes el funnel NO enviaba nada a Meta.
- `TEST_URL` actualizado a `https://pdi.equilibria.com/#/instructions/FULLES`.
- Handle de Instagram corregido a `adrianvillanuevarios`.
