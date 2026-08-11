---
title: Funnel Test de Personalidad (Equilibria)
order: 7
---

# Funnel Test de Personalidad

Canal **principal** de captación de leads de Capital Hub (confirmado Marco 2026-06-15). No confundir con "captura solo desde Instagram": este funnel es la fuente real de leads.

> **VERSIÓN VIGENTE: v3 — DIRECTO** (2026-08-11, orden de Marco antes de lanzar la campaña).
> El lead deja sus datos y entra al test en ese mismo momento. **Sin página de espera y sin
> correo.** Todo lo de la v2 (gracias con VSL + Calendly, y email de los 7 minutos) sigue
> construido y **solo está apagado** detrás de un interruptor.
> La v2 y la v1 quedan más abajo, para entender de dónde viene el funnel.

## v3 · El recorrido de hoy

```
1. Anuncio → /test-personalidad
2. Pulsa el botón → pop-up → nombre + email + teléfono (los 3 obligatorios)
3. Submit → POST /api/optin/test-personalidad (CRM, atribución, avisos: igual que siempre)
4. DIRECTO a /test-personalidad/test (lo decide el SERVIDOR con el campo `next`)
5. Pulsa «Abrir el test» → Equilibria en pestaña nueva
   · sube a Lead cualificado en el CRM  · avisa al equipo  · evento a Meta
6. Manda su resultado por Instagram o WhatsApp → el setter conversa a mano
```

### El interruptor «paso intermedio»

Vive en el engranaje ⚙️ de `/webs` (`app_settings` → `funnel:test-personalidad` →
`paso_intermedio`). Nace y está **apagado**.

| Interruptor | Qué pasa |
|---|---|
| **Apagado** (hoy) | El opt-in lleva a `/test-personalidad/test`. No se programa ningún correo. `/test-personalidad/gracias` redirige al test y va con `noindex`. |
| Encendido | Vuelve la v2 entera: gracias con VSL + Calendly, y correo de acceso a los N minutos. Sin tocar código ni desplegar. |

**Nada se borró.** Ni la página de gracias, ni el Calendly, ni la plantilla del correo
(`test_personalidad_acceso` sigue en `/email-marketing`), ni el endpoint del botón del
correo (`/api/funnel/test-personalidad/acceso`, que sigue funcionando por si se reactiva).

### Dónde se decide el destino

En el **servidor**, no en la página: el opt-in devuelve `next` y la landing obedece. Si se
decidiera en el navegador, un usuario con la página vieja en caché seguiría yendo a la
gracias después de apagar el interruptor.

### La calificación cambió de puerta

`lead_cualificado` lo disparaba el clic del correo. Sin correo, esa columna se quedaría
vacía para siempre, así que ahora lo dispara **el botón «Abrir el test»**
(`POST /api/funnel/test-personalidad/abrir`). Las dos puertas comparten la misma pieza:
`src/features/funnel-test-personalidad/cualificar.ts`. Un solo sitio, un solo
comportamiento, y el no-retroceso se respeta igual.

**Quién manda el evento a Meta**: desde el botón lo manda el navegador (píxel + servidor,
mismo identificador, con las cookies de Meta puestas → mejor emparejamiento). Desde el
correo lo manda el servidor, porque ahí no hay navegador nuestro. Nunca los dos: serían
dos conversiones para un solo hecho.

### Por qué se quitó, en palabras de Marco (2026-08-11)

*"Vamos a quitar la página de gracias con el vídeo. No la quitamos, simplemente ponla en
pausa. […] una vez que dan los datos, lo llevamos directamente a donde está el test de
personalidad. […] No le llegue ningún correo electrónico de los siete minutos."*

Contexto: la VSL de Adrián seguía sin grabarse, así que la página de espera enseñaba un
hueco vacío y pedía siete minutos de paciencia a cambio de nada.

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

## El hueco de la VSL

El marco del vídeo **siempre se pinta**, con el mismo tamaño y posición que tendrá el vídeo final (16:9). Mientras `video_guid` esté vacío muestra un placeholder de marca ("El vídeo se está preparando"). En cuanto se pega el GUID en el engranaje de `/webs`, el reproductor aparece exactamente en ese hueco, **sin mover nada de la página y sin tocar código ni hacer deploy**.

Marco lo pidió así el 2026-07-23: quiere entregar el vídeo y que se enchufe de una, sin que la página cambie de forma.

## El email de los 7 minutos

- Plantilla `test_personalidad_acceso`, **editable y pausable** desde `/email-marketing` → Plantillas. El override en BD es la fuente de verdad.
- **Vista previa**: `/api/admin/email/preview/test_personalidad_acceso` (requiere estar logueado). Sirve para comprobar a ojo a dónde apunta cada botón antes de encender nada.
- Lleva **tres** botones: el principal al acceso del test, más **Instagram y WhatsApp** con los mismos destinos que la landing del test. Duplicados a propósito (Marco, 2026-07-23): el lead tiene el canal de contacto a mano aunque nunca abra la landing.
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

## Reporte técnico en el Knowledge

Hay un reporte visual de todo lo construido en **Knowledge > Producto > "Reporte · Funnel Test Personalidad v2"**. Explica pieza por pieza qué se hizo, con los enlaces a cada sitio del OS, y qué falta.

Es una **página viva de la app** (`src/app/reportes/funnel-test-personalidad-v2/page.tsx`) embebida por iframe, igual que el brandkit. **No es un `.html` estático en `public/`**: eso sería una segunda fuente que se desincroniza (el bug del 2026-07-08 con el brandkit). Para cambiarlo se edita ese `.tsx` y ya.

El registro de páginas embebidas vive en `EMBEDDED_PAGES`, en `src/features/knowledge/components/knowledge-page.tsx`. Para añadir otro reporte: crear la página bajo `src/app/reportes/`, añadir su entrada al mapa y engancharla a la carpeta que toque.

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

Desde el 2026-08-11 se mide **todo el recorrido**, no solo el formulario. Cada momento
dispara el evento que Meta ya conoce **y** el nuestro, con el mismo identificador (Meta
cuenta una sola conversión y nosotros podemos hacer audiencias finas por funnel).

| Momento | Estándar de Meta | Nuestro |
|---|---|---|
| Entra a cualquier página del funnel | `PageView` (automático del píxel) | — |
| Ve la landing | `ViewContent` | `test_personalidad_ver_landing` |
| Deja sus datos | `Lead` | `test_personalidad_lead` |
| Llega a la página del test | `ViewContent` | `test_personalidad_ver_test` |
| Pulsa «Abrir el test» | — | `test_personalidad_cualificado` |
| Pulsa Instagram | `Contact` | `test_personalidad_contacto_instagram` |
| Pulsa WhatsApp | `Contact` | `test_personalidad_contacto_whatsapp` |

**Optimizar la campaña hacia `Lead`.** `Contact` es la señal de intención más alta del
funnel (la persona va a hablar con nosotros) y sirve para audiencias y para leer la calidad
del tráfico, no para optimizar todavía: llega poco volumen.

`Abrir el test` no lleva estándar de Meta a propósito: ninguno de los 17 significa eso, y
colgarle un `Lead` o un `ViewContent` duplicaría una conversión que ya contamos antes.

### Lo que faltaba antes (encontrado el 2026-08-11 auditando antes de lanzar)

El funnel solo mandaba `Lead` + `test_personalidad_lead` y el `cualificado`. Le faltaban
`ViewContent` y `Contact`, **y la pantalla de Ads lo pintaba en verde igual**, porque el
catálogo de este funnel no los esperaba. Un hueco que no se ve es peor que un fallo: nadie
lo busca. Por eso todo evento nuevo se registra en los **cuatro** sitios o no cuenta como
hecho: `capi-client.ts` (`CapiEventName`), `/api/meta/capi/track` (`ALLOWED_EVENTS`),
`ads-events-service.ts` (`KNOWN_EVENTS` + `EVENT_LABELS`) y `funnel-catalog.ts`.

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

### 2026-08-11 (v3) — DIRECTO al test, sin espera y sin correo, y todo medido

Orden de Marco antes de lanzar la campaña. Qué cambia:

1. **El opt-in lleva directo a `/test-personalidad/test`.** El destino lo devuelve el
   servidor en `next`.
2. **No se programa el correo de los 7 minutos.** La plantilla y el endpoint del botón
   siguen vivos.
3. **La página de gracias queda en pausa**: `noindex` y redirige al test mientras el
   interruptor esté apagado. No se borró nada.
4. **`lead_cualificado` lo dispara ahora el botón «Abrir el test»**, no el correo. Lógica
   compartida en `cualificar.ts`.
5. **Eventos nuevos**: `ViewContent` y `Contact` (los dos estándar que faltaban) más cuatro
   nuestros. El funnel pasa de 4 señales a 8, y la pantalla de Ads las espera.
6. **Interruptor `paso_intermedio`** en el engranaje de `/webs`, apagado por defecto.

Dos fallos de medición encontrados y corregidos en la misma pasada:

- **La app se recargaba sola en la primera visita** y duplicaba toda la medición. El
  registro del service worker (`PWARegister.tsx`) confundía "primera visita" con "hay
  versión nueva", porque miraba si había un service worker mandando *después* de
  registrarlo, cuando el `clients.claim()` ya lo había puesto. Cada visitante nuevo
  generaba **dos `PageView`**: el doble de gente de la que había, la mitad de coste por
  resultado del real, y campañas optimizando con números inventados. **Afectaba también a
  la clase en directo y a la reserva de sesión.** Ahora se mira antes de registrar.
- **`test_personalidad_cualificado` se saltaba el interruptor de medición del funnel.**
  Salía por su cuenta desde el servidor, así que apagar la medición en `/webs` no lo
  paraba. Ahora lo respeta y, si está apagado, el descarte queda registrado con su motivo.

Y `ViewContent` pasa a contarse **una vez por visita**, no una por vez que se pinta la
página: el candado sobrevive a una recarga (sesión de la pestaña).

Verificado en local con navegador real, evento por evento, antes de publicar.

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

Pendiente al cerrar esta versión: **Adrián tiene que grabar la VSL**. Hasta entonces `video_guid` está vacío y la gracias muestra el placeholder en el hueco del vídeo.

Pasada de ajustes de Marco el mismo día, antes de publicar:
1. **El hueco del vídeo se pinta siempre**, con placeholder de marca. Antes, sin GUID, no se pintaba nada y la página cambiaba de forma al añadir el vídeo.
2. **El email lleva también los botones de Instagram y WhatsApp**, con los mismos destinos que la landing del test.
3. **La plantilla se añadió al endpoint de vista previa** (`/api/admin/email/preview/test_personalidad_acceso`) para poder comprobar a dónde apunta cada botón sin mandar un email de verdad.

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
