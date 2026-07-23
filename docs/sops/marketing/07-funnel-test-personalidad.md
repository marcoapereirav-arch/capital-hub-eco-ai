---
title: Funnel Test de Personalidad (Equilibria)
order: 7
---

# Funnel Test de Personalidad

Canal **principal** de captación de leads de Capital Hub (confirmado Marco 2026-06-15). No confundir con "captura solo desde Instagram": este funnel es la fuente real de leads.

> **VERSIÓN VIGENTE: v2** (2026-07-23), decidida en la reunión Adrián + Marco + Pat + JP + Giustina del 18-jul-2026. Transcript: `transcripts/2026-07-18_marco_adrian_funnel_ht.md`. Construcción: `.claude/PRPs/PRP-007-funnel-test-personalidad-v2.md`.
> La v1 está más abajo, en "Histórico v1", para entender de dónde viene.

## Qué es

Una landing pública (`/test-personalidad`) que ofrece **gratis** el test de personalidad de **Equilibria** (empresa colaboradora, el test NO es nuestro). El lead hace opt-in y, mientras espera su acceso, ve la **VSL de Adrián** con el **Calendly embebido** debajo. El acceso al test le llega por **email a los 7 minutos**. Al pulsarlo se le marca como **Lead cualificado** y aterriza en una landing nuestra desde la que abre Equilibria y manda su resultado por WhatsApp o Instagram.

## Por qué cambió respecto a la v1

| Problema de la v1 | Cómo lo resuelve la v2 |
|---|---|
| El lead saltaba a Equilibria en 3 segundos, sin escuchar nada de Capital Hub | La página de gracias es ahora la página de venta: VSL + Calendly |
| No había reenganche: si no pulsaba en ese momento, se perdía | El email de los 7 minutos lo recupera |
| El link al test era un `<a>` externo: no sabíamos quién lo abría | El clic pasa por nuestro endpoint y queda medido |
| Todos los opt-in valían igual: el setter escribía a ciegas | Stage **Lead cualificado**: el que abre el test sube solo de columna |

**La restricción que manda en todo el diseño:** el test es de Equilibria, vive fuera de nuestro dominio y **no podemos detectar cuándo lo termina** ni redirigirlo de vuelta. Por eso la medición se hace en el clic del email, que es el último punto que sí controlamos.

## Flujo end-to-end (v2)

```
0. Anuncio de Adrián (a cámara, estilo genuino) o difusión orgánica
1. Lead llega a /test-personalidad (landing, copy v1 sin cambios)
2. Pulsa un botón → se abre el POP-UP con el formulario opt-in
3. Rellena: nombre + email + teléfono (LOS 3 OBLIGATORIOS)
4. Submit → POST /api/optin/test-personalidad:
   - Upsert contacto por email (stage='lead' si es nuevo)
   - pipeline = "Test Personalidad" (slug 'test-personalidad'). NO el General.
     Si el contacto ya tenía pipeline_id, se PRESERVA (SOP 12/13).
   - phone guardado en el contacto (contactable por WhatsApp)
   - tag auto 'origen:test_personalidad' · origin/source 'landing_test_personalidad'
   - journey event 'optin_test_personalidad'
   - NUEVO v2: PROGRAMA el email de acceso a los 7 minutos (Resend scheduledAt)
   - NUEVO v2: devuelve el slug opaco del contacto
   - redirige a /test-personalidad/gracias?c=<slug>
5. GRACIAS = PÁGINA DE VENTA (v2):
   - "Tu test llega a tu correo en 7 minutos. Mientras tanto, mira este vídeo."
   - VSL de Adrián (Bunny Stream)
   - CALENDLY EMBEBIDO justo debajo, visible desde el segundo 0
   - Prefill del Calendly con nombre y email, resueltos en el server desde el slug
   - Si reserva → /reservar/gracias (vídeo de preparación) → stage 'agendado'
     (lo mueve el webhook de Calendly, que ya funcionaba)
   - NO lleva botón de WhatsApp: se quitó por fricción
6. A los 7 minutos llega el email 'test_personalidad_acceso'
   - Su botón NO va a Equilibria: va a /api/funnel/test-personalidad/acceso?c=<slug>
7. Ese endpoint es EL DISPARADOR DE CALIFICACIÓN:
   - stage → 'lead_cualificado' (con guarda de no retroceso)
   - journey event 'acceso_test_personalidad'
   - Meta CAPI 'test_personalidad_cualificado' (solo la primera vez)
   - notifica al equipo (campana + push) para priorizar el seguimiento
   - redirige a /test-personalidad/test PASE LO QUE PASE
8. /test-personalidad/test (landing nuestra):
   - Botón "Abrir el test" → Equilibria en pestaña nueva
   - Protocolo de 3 pasos + botones de Instagram (recomendado) y WhatsApp
9. Lead hace el test y manda screenshot → setter conversa manual
10. Si agenda → stage 'agendado' auto. Llamada → 'alumno'/'seguimiento'/'perdido'
    auto vía Registrar venta
```

## Stage nuevo: Lead cualificado

Idea de JP en la reunión ("lead válido"). El pipeline Test Personalidad queda:

```
Lead → Lead cualificado → Agendado → Seguimiento → Alumno
                                            ↓
                                    No show / Perdido
```

- **Key**: `lead_cualificado`. **Rótulo**: "Lead cualificado". **Color**: `#4ADE80` (verde claro del brandkit).
- **Solo en el pipeline `test-personalidad`.** El pipeline `webinar` no tiene la señal del clic del email, así que una columna vacía ahí sería ruido. Se replica si el webinar gana esa señal.
- **Qué significa**: pulsó el botón del email y abrió el acceso al test. Intención real demostrada, todavía sin agendar. El setter escribe a estos primero.
- Escalera del no retroceso (`stage-guard.ts`): `dm(0) → lead(1) → lead_cualificado(2) → agendado(3) → alumno(4)`.
- Migración: `supabase/migrations/20260723120000_pipeline_stage_lead_cualificado.sql`.

## El email de los 7 minutos

- Plantilla `test_personalidad_acceso`, **editable y pausable** desde `/email-marketing` → Plantillas. El override en BD es la fuente de verdad.
- **Sin cron y sin tabla de cola**: se programa en el propio opt-in con `scheduledAt` del SDK de Resend (verificado en la 6.12.2). El retraso es editable desde el engranaje de `/webs` (`email_delay_minutes`, default 7).
- **Se envía siempre**, haya agendado o no. Es la promesa a cambio de sus datos.
- **Gotcha**: la comprobación de "plantilla pausada" ocurre AL PROGRAMAR, no al entregar. Si se pausa la plantilla dentro de esos 7 minutos, el email igualmente sale.
- **El botón del email debe apuntar SIEMPRE al endpoint de acceso**, nunca al link directo de Equilibria. Si alguien lo cambia, se pierde la calificación y la medición entera del funnel.

## Regla dura del endpoint de acceso

`/api/funnel/test-personalidad/acceso` **nunca le falla al lead**. Si no hay slug, si el contacto no existe, si la BD peta o si Meta peta, igualmente redirige a la landing del test. Marcar es secundario; entregar el test es lo principal.

El identificador que viaja en la URL es `contacts.slug` (opaco, ya existente). **Nunca** se expone el UUID ni el email en la query string.

## Estructura de la landing (copy aprobado por Marco)

Fuente del copy: `ch-copy-test-landing-optin.md` (raíz del repo).

- **Sección 1 — Hero**: eyebrow `Test gratis · 15 minutos · +500.000 personas lo han hecho`; titular *"Hay mil formas de vivir de internet. Esta te dice cuál es la tuya"*; subtítulo al avatar; botón **"Quiero hacer el test gratis"** → abre el pop-up.
- **Sección 2 — Qué es este test**: bloque Equilibria (lo usan multinacionales, +500.000 personas) + bloque resultado en 4 colores (fortalezas y limitadores); botón **"Hacer el test gratis"** → mismo pop-up.
- **Pop-up — Formulario**: título *"Déjame tus datos y entra al test"*; 3 campos (nombre · email · teléfono); botón **"Quiero hacer el test gratis"**; microcopy *"Te llega tu acceso y entras directo al test. Sin tarjeta, sin compromiso."*

> **Vídeo:** el copy contempla un vídeo de Adrián bajo el hero (PandaVideo/VTurb), pero **se lanza SIN vídeo**. Se añadirá cuando Marco facilite la URL.

## Configuración centralizada

`src/features/funnel-test-personalidad/config.ts` (un solo sitio). Todos los valores se pueden sobreescribir **sin deploy** desde el engranaje de `/webs`:

| Valor | Contenido |
|---|---|
| `TEST_URL` | `https://pdi.equilibria.com/#/instructions/FULLES` |
| `WHATSAPP_NUMBER` | `34611874062` (Adrián, sin `+` ni espacios) |
| `INSTAGRAM_HANDLE` | `adrianvillanuevarios` |
| `VIDEO_GUID` | GUID del VSL en Bunny. **Vacío hasta que Adrián lo grabe.** Con el vacío la gracias no se rompe: oculta el reproductor y el resto del funnel sigue funcionando |
| `BUNNY_LIBRARY_ID` | `686883` (la misma library que `/reservar/gracias`) |
| `CALENDLY_URL` | `https://calendly.com/adrian-sales-capital/online-coffee` |
| `EMAIL_DELAY_MINUTES` | `7` |

## Archivos

- Landing opt-in: `src/features/funnel-test-personalidad/components/landing.tsx`
- Gracias (VSL + Calendly): `src/features/funnel-test-personalidad/components/thank-you.tsx`
- Landing del test: `src/features/funnel-test-personalidad/components/test-landing.tsx`
- Config: `src/features/funnel-test-personalidad/config.ts`
- Ajustes editables: `src/features/funnel-test-personalidad/get-settings.ts`
- Opt-in: `src/app/api/optin/test-personalidad/route.ts`
- Acceso que califica: `src/app/api/funnel/test-personalidad/acceso/route.ts`
- Plantilla de email: `src/lib/email/templates/test-personalidad-acceso.tsx`
- Rutas: `src/app/(public)/test-personalidad/page.tsx` (+ `/gracias`, + `/test`)
- Migración del stage: `supabase/migrations/20260723120000_pipeline_stage_lead_cualificado.sql`

La landing se muestra **siempre** (force-dynamic), sin gate draft/published, hasta nueva orden. `/test-personalidad/test` va con `robots: noindex` porque es página de entrega privada.

## Tracking Meta (Pixel + CAPI)

Dos eventos, uno por cada nivel de intención. Esto es lo que pidió JP para poder optimizar por calidad y no solo por volumen.

| Evento | Cuándo | Dónde se dispara |
|---|---|---|
| `test_personalidad_lead` + `Lead` (estándar) | Opt-in guardado OK | Cliente, helper `track()` |
| `test_personalidad_cualificado` | Clic del botón del email (primera vez) | Servidor, `sendCapiEvent` |

El del opt-in usa el helper `track()` (`src/lib/meta/pixel-client.ts`): Pixel browser + Conversions API server-side con el **mismo `event_id`** para deduplicación. Incluye las UTMs (first-touch) automáticamente. Ambos se registran en `meta_events_log` y son visibles en el panel `/ads` (Tracker).

Todo evento nuevo debe registrarse en los **tres** sitios o el Tracker lo muestra como desconocido: `capi-client.ts` (`CapiEventName`), `/api/meta/capi/track` (`ALLOWED_EVENTS`) y `ads-events-service.ts` (`KNOWN_EVENTS` + `EVENT_LABELS`).

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
- ✅ **Vídeo subido a Bunny** (2026-06-25): `assets/videos/Video-Adri-Post-Agenda.MOV` → library `686883`, GUID `86fa2fc6-1d04-473a-bc27-273188bbfea6`. El `video_guid` está en `app_settings` key `funnel:reservar` (editable desde ⚙️). Embed: `iframe.mediadelivery.net/embed/686883/<guid>`. Copy de la gracias en **directo** (sin "de Adrián"); botón del test apunta al **test literal de Equilibria** (no a la landing).

## Reglas

- Los 3 campos del opt-in son **obligatorios**. El teléfono es necesario porque el seguimiento es manual por WhatsApp/IG.
- El test es de **Equilibria** (externo): solo medimos opt-ins, no si terminó el test.
- El pipeline contextual es **"Test Personalidad"**; nunca sobreescribir un `pipeline_id` ya existente.
- Si cambia el copy de la landing, la fuente sigue siendo `ch-copy-test-landing-optin.md` + este SOP.

## ManyChat (futuro, no ahora)

De momento SIN ManyChat: el setter abre IG/WhatsApp manualmente. Cuando se reactive: comentario en Reel con keyword o story reply → envía el link de la landing. La fuente única hoy es `/test-personalidad`.

## Cambios versionados

### 2026-07-23 (v2) — VSL + Calendly + email de los 7 minutos + Lead cualificado

Reunión Adrián + Marco + Pat + JP + Giustina del 18-jul-2026. Transcript en `transcripts/2026-07-18_marco_adrian_funnel_ht.md`. Construcción documentada en `PRP-007`.

Qué cambia:
1. **La página de gracias deja de entregar el test.** Pasa a ser la página de venta: aviso de espera, VSL de Adrián (Bunny) y **Calendly embebido visible desde el segundo 0** (Pat: "yo lo pondría desde el principio"). Al reservar va a `/reservar/gracias`, que ya existía.
2. **El test se entrega por email a los 7 minutos**, programado con `scheduledAt` de Resend desde el propio opt-in. Sin cron ni tabla de cola.
3. **Landing nueva `/test-personalidad/test`**: destino del email. Se lleva el protocolo de captura y los botones de Instagram y WhatsApp que antes vivían en la gracias.
4. **Stage `lead_cualificado`** entre Lead y Agendado, solo en el pipeline del test. Lo dispara el clic del botón del email.
5. **Evento Meta `test_personalidad_cualificado`** para optimizar por calidad de lead.
6. Ajustes nuevos editables sin deploy en `/webs`: `video_guid`, `calendly_url`, `email_delay_minutes`.

Decisiones cerradas en esa reunión y que NO hay que volver a debatir:
- **Fuera el botón de WhatsApp de la página de gracias.** Giustina señaló la fricción ("si pido un test y ya me están diciendo manda mensaje o espera, me olvido"). El WhatsApp vive en la landing del test.
- **Nada de automatizar WhatsApp** de momento: permisos, políticas y coste. JP: "mantenerlo simple y analógico". Queda en roadmap, hablando con Pere.
- **No se quita el formulario.** Giustina: es la única forma de tener la base de datos.
- **Se sigue usando Equilibria**, no un test propio. Da autoridad ("no es mío, es de gente con 20 años de experiencia") y es más rápido de lanzar. Test propio queda en roadmap.
- **El botón de agenda se ve desde el principio.** Si la calidad de las llamadas baja, se retrasa dentro del vídeo.

Pendiente al cerrar esta versión: **Adrián tiene que grabar la VSL**. Hasta entonces `video_guid` está vacío y la gracias muestra el resto del funnel sin reproductor.

### Histórico v1

Lo de abajo describe la v1 (opt-in y salto directo a Equilibria desde la gracias). Se conserva para entender de dónde viene el funnel. **No es el comportamiento vigente.**

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

### 2026-06-26 — Pasada de diseño WOW (tipografía limpia + verde de acento)
- Landing + gracias rediseñados: fuera los labels mono espaciados en mayúsculas → **Inter normal y legible** (regla [[feedback-tipografia-normal-legible]]).
- **Verde de marca `#22C55E` como acento** (regla nueva [[feedback-brandkit-absoluto]]): punto de estado, `+500.000` en verde, motivo "4 colores" con el verde de protagonista, CTA que se llena de verde al hover, focus de inputs verde, checks/pasos/"Recomendado" en verde, glow verde sutil.
- Motion intacto (entrada escalonada, headline con clip, count-up, botón magnético, reveals al scroll). Copy y lógica del opt-in **sin tocar**.
- Componentes: `src/features/funnel-test-personalidad/components/{landing,thank-you}.tsx`. (`dashboard-section.tsx` es código muerto, no se usa.)
