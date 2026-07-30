---
title: Funnel Clase gratuita en directo (opt-in → WhatsApp → agenda)
order: 8
---

# Funnel Clase gratuita en directo

> **Cómo se llama de cara al lead (2026-07-30):** en la landing, la gracias y los correos
> se dice **"Clase gratuita en directo"**, nunca "webinar". Internamente el slug sigue
> siendo `webinar` (ruta, pipeline, tags, ajustes) y eso NO se cambia: renombrarlo rompería
> los contactos y los tags ya guardados.

Canal de captación por **webinar en directo**. Decidido en la reunión Marco/Adrián del 6-jul-2026. Primer directo de prueba **viernes 10 jul**; después, **recurrente los miércoles**.

Es una estrategia estándar de webinar (la usan cientos de negocios), no una copia de nadie.

> **FLUJO VIGENTE (2026-07-29, reunión de marketing del 24-jul):** el foco es el **lanzamiento del 8 de agosto**. La landing `/webinar` lleva una **mini-VSL** en la página 1 + opt-in; la página de gracias ya **no manda a un grupo**, manda a **escribir por WhatsApp privado a Adrián** con un mensaje predefinido para conseguir la entrada (ese envío es el punto de éxito). **A partir de ese envío, se nutre a la persona DENTRO del chat. Nada más forma parte de este funnel:** no hay grupo, ni sorteo, ni "nutrición hasta el 8" como proceso documentado (no se documenta lo que no está definido). Detalle en "Cambios versionados" (v4). La descripción de abajo (opt-in → grupo → Zoom) es el flujo v1, superado; se conserva por histórico.

## El flujo end-to-end

```
Landing OPT-IN  →  Página de GRACIAS  →  Grupo WhatsApp  →  Webinar (Zoom)  →  Agenda llamada  →  Venta → Alumno
   /webinar          /webinar/gracias      (link editable)     (link en el grupo)   /reservar (Calendly)
```

1. El lead llega a **`/webinar`** (hostname `ch` → `ch.capitalhubapp.com/webinar`).
2. Opt-in: **nombre + email + teléfono** (los 3 obligatorios) → `POST /api/optin/webinar`.
3. Redirige a **`/webinar/gracias`** con botón grande **"Entrar al grupo de WhatsApp"**.
4. En el grupo se suelta el **link del Zoom** del directo y los avisos (acción manual).
5. En el webinar, el CTA lleva al **funnel de agendar** (`/reservar`, con el Calendly embebido).
6. Al agendar → el webhook de Calendly mueve el contacto a **Agendado**. Al pagar → registro de venta lo mueve a **Alumno** + acceso.

## Qué hace el opt-in (`/api/optin/webinar`)

Clon del de `test-personalidad` (ver SOP 07), cambiando el contexto al webinar:

- Upsert de contacto por email → `stage='lead'` si es nuevo; **no degrada** si ya estaba avanzado (avisa al equipo).
- Pipeline contextual **`webinar`** (slug). Se **preserva** el `pipeline_id` si el contacto ya tenía uno.
- Tags `origen:webinar` + `fuente:<utm_source>` (atribución **first-touch**).
- `contact_journey_events` tipo `optin_webinar`.
- **Email de confirmación** con el link del grupo de WhatsApp (template `optin_webinar`, editable/pausable en `/email-marketing`). Solo se envía si el grupo está configurado.
- Meta Pixel + CAPI: evento `webinar_lead` + estándar `Lead`.

## Pipeline

Pipeline `webinar` (migración `20260706120000_pipeline_webinar.sql`), espejo de `test-personalidad`:
`lead → agendado → seguimiento → alumno → no_show → perdido`. Así el webhook de Calendly y `resolveAutoStage` (guarda no-retroceso) funcionan sin cambios.

## Config editable (sin deploy)

Desde el **⚙️ de `/webs`** (funnel "Funnel Webinar semanal"), key `app_settings → funnel:webinar`:

| Campo | Tipo | Qué es |
|---|---|---|
| `video_guid` | texto | GUID de la mini-VSL en Bunny. Vacío = placeholder de marca. |
| `whatsapp_number` | texto | Número de Adrián (solo dígitos con prefijo, sin + ni espacios). |
| `whatsapp_message` | texto | Mensaje predefinido del botón. **SIN fecha**. Al cambiarlo se refleja al instante en el botón de la gracias **y** en el correo. |
| `email_whatsapp` | toggle | Si el correo de confirmación incluye o no el botón de WhatsApp. Default ON. |
| `webinar_date` | fecha | **Fecha REAL del webinar (ISO). Fuente única.** De aquí sale el tag (`whatsapp-webinar-DD_MM_YYYY`) Y la fecha visible en la landing. Se cambia en UN sitio; al cambiarla por cada webinar, el tag del siguiente cambia solo. |
| `date_label` | texto | Texto opcional de la fecha en la landing. Vacío = se arma solo desde `webinar_date` (ej. "8 de agosto"). No afecta al tag. |
| `instagram` | texto | Usuario IG de Adrián (pie/soporte). |

Defaults en `src/features/funnel-webinar/config.ts`. Resolución server-only en `get-settings.ts` (nunca rompe: si la BD falla, usa defaults). El popup ⚙️ soporta campos de tipo `date` y `toggle` (ver `funnel-settings-manifest.ts` + `funnel-settings-modal.tsx`).

### Tag por webinar (identifica de qué directo vino cada persona)

Al tocar WhatsApp en la gracias, el sistema le pone al contacto el tag **`whatsapp-webinar-DD_MM_YYYY`** con la **fecha del webinar al que accedió** (ej. `whatsapp-webinar-08_08_2026`). Como hacemos webinars de forma constante, este tag deja claro de qué webinar salió cada lead. Se arma solo desde `webinar_date`; al cambiar la fecha del siguiente webinar, el tag cambia solo. Helper: `webinarTagName()` en `config.ts` (parseo manual de la fecha, sin `new Date`, para no tener saltos por zona horaria).

## Estado

- ✅ **Link del grupo de WhatsApp PUESTO** (2026-07-08): `https://chat.whatsapp.com/C5wQD0OvYLlFLNOdYVcHAS`. Guardado en `app_settings` (funnel:webinar → whatsapp_group) Y como default en `config.ts`. El botón de la gracias y el email ya funcionan. Editable en el ⚙️ de `/webs`.
- ✅ **Notificaciones**: cada lead del webinar avisa al equipo (in-app + push). Ver SOP producto/53.
- Pendiente (Adrián): escribir a **Mark Boy** para recuperar el grupo de ~400 personas ("Reto mil euros"); escribir el **guion del webinar**.

## Copy aprobado (no inventar)

- Promesa hero (v2, 2026-07-07, dictada por Marco): *"En enero de 2022 dejé mi trabajo y gané 4.000 € al mes. Te enseño a hacer lo mismo en menos de 90 días."* (historia de Adrián en primera persona como gancho). Debajo: *"Un directo gratuito y en vivo donde te enseño el paso a paso:"* + chips: *Qué profesión digital encaja contigo · Empezar sin montar un negocio · Acceso a nuestra bolsa de trabajo*.
- Sección **"Bolsa de oportunidades y clientes"** (antes "bolsa de trabajo garantizada por contrato"). PROHIBIDO usar "te colocamos" (en España "colocarse" = drogarse). Titular: *"No te formas y te quedas solo. Te acompañamos."* Cuerpo: *"Aprendes una profesión digital que las empresas están demandando y entras en nuestra bolsa de oportunidades y clientes..."*. Marquee: Startups / Marcas / Ecommerce buscando talento · Consultoras buscando marketers · Agencias buscando integradores de IA · Servicios de alto ticket buscando talento.
- Sección **"La profesión que me dio la libertad"** = historia real de Adrián en primera persona (no "habilidad", siempre "profesión digital"), como sección abierta con scroll. Fechas cuadradas con el hero: dejó su trabajo en **enero de 2022**, primer mes como profesional digital ganó 4.000 € limpios. Cierre: *"No me hice rico, pero pude dejar mi trabajo y empezar a vivir de internet."*

## Archivos

- Feature: `src/features/funnel-webinar/` (config, get-settings, components/landing, components/thank-you).
- Rutas: `src/app/(public)/webinar/page.tsx` + `webinar/gracias/page.tsx`.
- Endpoint: `src/app/api/optin/webinar/route.ts`.
- Meta: `webinar_lead` en `capi-client.ts` (CapiEventName), `api/meta/capi/track` (ALLOWED_EVENTS), `ads-events-service.ts` (KNOWN_EVENTS + label).
- Manifest editable: `src/features/webs/lib/funnel-settings-manifest.ts` (`webinar`).
- Panel: automatización `webinar_optin` en `api/admin/automations/route.ts` (SOP producto/21).

## Cambios versionados

- **2026-07-30 (v5) — Rediseño de la landing (feedback Marco, referencia `live.mkthackers.com/mkt-hackers-optin-d`).**
  - **En pantalla NUNCA se dice "webinar".** Es **"Clase gratuita en directo"** con icono de calendario, más la fecha y hora reales: *"Sábado 8 de agosto a las 10:00h"*. El slug interno (`/webinar`, pipeline `webinar`, tag `whatsapp-webinar-...`, key `funnel:webinar`) **NO se toca**: cambiarlo rompería los datos ya guardados.
  - **Titular nuevo (dictado por Marco):** *"Cómo ganar de 2k a 4k al mes en menos de 90 días con una profesión digital aunque no tengas experiencia y partas de 0."* Con contraste de peso: lo importante en Inter Tight Black 900 y verde de marca, el resto en Light 300.
  - **Subtítulo nuevo (dictado por Marco):** la promesa completa + el dato de mercado (*más de 500.000 puestos de trabajo online al año en España*) con la **fuente en pequeño**: "Informe Estado del Mercado Laboral en España 2024 · InfoJobs y Esade". Marco lo pasó con guion largo; se sustituyó por punto medio (REGLA #7).
  - **Opt-in EMBEBIDO** en la propia página, ya no en pop-up: en escritorio va en columna a la derecha (visible sin bajar), en móvil justo debajo del contador. Se eliminó el componente `OptinModal`. Los CTA de más abajo ya no abren nada: llevan al formulario y dejan el cursor en el primer campo.
  - **Cuenta atrás real** hasta el directo (días / horas / min / seg). Sale de `webinar_date` + el campo nuevo `webinar_time`, interpretados en **hora de España** (`Europe/Madrid`) vía `Intl`, así que no se desvía para quien la abra desde otro país ni con el cambio de horario verano/invierno. Arranca vacía y se rellena en el navegador para no romper la hidratación.
  - **El vídeo sale de la primera pantalla** y pasa a su propia sección ("01 · El evento"), debajo del titular. Mismo hueco de Bunny plug-and-play (`video_guid` en el ⚙️ de `/webs`); sin GUID muestra placeholder de marca.
  - **Fuera la sección "No te formas y te quedas solo. Te acompañamos."** (bolsa de oportunidades + marquee). Motivo de Marco: levanta alarmas del cliente. El copy queda registrado arriba por si se recupera.
  - **Fuera la foto de la madre** de la galería de Adrián (quedan 7 fotos). El texto de la historia no se tocó.
  - **AUTO-BLINDAJE (error mío, 2026-07-30): el brandkit manda por encima de lo que se pida en el chat.** Marco pidió "cambiar el verde por el lila que teníamos al principio" y lo implementé en morado. Su corrección: *"¿por qué carajos lo pones morado? Tenemos un fucking brandkit... Tu regla obligatoria número 1 es siempre diseñar con el puto brandkit."* Revertido al **verde oficial `#22C55E` / `#4ADE80`**. Regla derivada: si una petición de color choca con el brandkit, **se avisa ANTES de tocar una línea** y por defecto se hace con el brandkit. Ver [brandkit oficial](brand/01-brandkit-oficial.md) y [producto/48](../producto/48-diseno-dinamico-wow.md) (otros neones prohibidos).
  - **La dopamina se consigue sin inventar colores:** peso tipográfico (300 vs 900), tamaño, contador con brillo verde, botones verdes con barrido de luz, orbes y glows en verde de marca, reveals al scroll. Todo dentro del brandkit.
  - **Campo nuevo editable en el ⚙️ de `/webs`:** `webinar_time` (hora de la clase, formato 24h). `date_label` sigue como override manual del texto y ya NO afecta al contador.
  - Archivos: `src/features/funnel-webinar/config.ts` (+`WEBINAR_TIME`, `webinarDateTimeLabel()`, `webinarTargetMs()`), `get-settings.ts`, `components/landing.tsx` (reescrito), `components/thank-you.tsx` (fecha con día y hora), `src/app/(public)/webinar/page.tsx` (metadatos), `src/features/webs/lib/funnel-settings-manifest.ts`.
  - **Pendiente de Marco:** el vídeo está en su Google Drive y yo no tengo acceso a esa carpeta; para que aparezca hay que subirlo a Bunny y pegar el GUID en el ⚙️ de `/webs`.

- **2026-07-29 (v4) — Ajustes del funnel del 8 (feedback Marco) + tag por webinar.**
  - **Mensaje de WhatsApp SIN fecha y editable.** El default pasó a "Hola Adrián, quiero acceder al evento." (antes llevaba la fecha, que Marco no autorizó). Se edita en el ⚙️ de `/webs` (`whatsapp_message`) y se refleja al instante en el botón de la gracias Y en el correo. La fecha ya NO va en el mensaje.
  - **Fecha del webinar como campo real (`webinar_date`, tipo fecha).** Fuente única: alimenta el tag y la fecha visible en la landing (no se escribe en dos sitios). `date_label` queda como override opcional del texto de la landing.
  - **Tag dinámico por webinar:** al tocar WhatsApp se pone `whatsapp-webinar-DD_MM_YYYY` con la fecha de `webinar_date` (ej. `whatsapp-webinar-08_08_2026`). Antes era el genérico "Tocó WhatsApp". Helpers `webinarTagName()` / `webinarDateLabel()` en `config.ts`.
  - **Interruptor de WhatsApp en el correo (`email_whatsapp`, toggle).** Marco decide desde el ⚙️ si el correo de confirmación incluye o no el botón de WhatsApp; el mensaje del botón es el mismo editable. Template `webinar-optin.tsx` ahora acepta `whatsappUrl` opcional.
  - **Popup ⚙️ de funnels** ahora soporta tipos `date` y `toggle` (`funnel-settings-manifest.ts` + `funnel-settings-modal.tsx`).
  - **Hero de la landing en una sola pantalla** (móvil y desktop), sin quitar contenido; solo se quitó "Sin tarjeta, sin compromiso." (queda "Plazas limitadas."). Alturas/espacios fluidos con `svh` y la mini-VSL con altura acotada.
  - **No inventar procesos:** tras WhatsApp solo se nutre a la persona **dentro del chat** (fuera grupo/sorteo/"hasta el 8").
  - Board visual (estilo Miro) de este funnel en vivo en el OS: **`/sistemas/webinar`** (ver SOP producto/57).
  - **Auto-blindaje (bug arreglado):** el modal "Editar funnel" (`web-edit-modal.tsx`) hacía el PUT de los ajustes (que es un REEMPLAZO total, no merge) aunque el GET de los overrides aún no hubiera cargado (`settings` en `{}`), borrando `webinar_date`/número/mensaje/etc. con vacío y devolviendo la fecha y el tag al default. Fix: el guardado de ajustes se hace solo con `!settingsLoading` y el botón "Guardar cambios" está deshabilitado mientras cargan. Se eliminó `funnel-settings-modal.tsx` (código muerto con el mismo patrón).
  - Archivos: `src/features/funnel-webinar/*`, `src/app/api/optin/webinar/route.ts`, `src/app/api/funnel/webinar/whatsapp-click/route.ts`, `src/lib/email/templates/webinar-optin.tsx`, `src/features/webs/lib/funnel-settings-manifest.ts`, `src/features/webs/components/funnel-settings-modal.tsx`.

- **2026-07-28 (v3) — Rediseño para el lanzamiento del 8 (reunión de marketing del 24-jul).** Transcript: `transcript-funnel-ch-webinar-8` (reunión "Capital Hub Marketing - July 24").
  - **Página 1 (landing):** **mini-VSL** de presentación del evento (hueco Bunny plug-and-play, `video_guid` editable en el ⚙️ de `/webs`; sin GUID muestra placeholder de marca) + opt-in (nombre, email, teléfono). Popup al grano: "Reserva tu plaza en el evento" / "Deja tus datos para acceder al directo" / botón "Reservar mi plaza". Perspectiva de acceder, no de pedir. Sin marketing.
  - **Página de gracias:** botón a **WhatsApp privado de Adrián** con mensaje predefinido ("Conseguir mi entrada por WhatsApp"). Fuera el botón/copy del grupo. Ese clic es el **punto de éxito** del funnel: al tocarlo se le pone al contacto el tag **"Tocó WhatsApp"** (vía `sendBeacon` → `/api/funnel/webinar/whatsapp-click?c=<slug>`) + evento en su timeline. El `slug` del contacto viaja del opt-in a la gracias (`?c=`).
  - **Email del opt-in (`optin_webinar`):** ya NO manda al grupo. Ahora confirma la reserva + botón al **WhatsApp privado** para conseguir la entrada (coherente con la gracias). Se envía siempre (el número tiene default), editable/pausable en `/email-marketing`. Registrado en el editor de plantillas.
  - **Ajustes editables (`/webs` ⚙️, key `funnel:webinar`):** `video_guid` (mini-VSL), `whatsapp_number`, `whatsapp_message`, `date_label`, `instagram`. Se quitaron `whatsapp_group` y `reservar_url`.
  - **Fuera de alcance de este funnel (lo lleva el equipo):** tras el envío de WhatsApp, se nutre a la persona **dentro del chat**. No se documentan grupo/sorteo/"nutrición hasta el 8" porque no están definidos (corregido en v4: no inventar procesos).
  - Archivos: `src/features/funnel-webinar/*`, `src/app/(public)/webinar/*` (+ `/gracias`), `src/app/api/optin/webinar/route.ts`, `src/app/api/funnel/webinar/whatsapp-click/route.ts`.
- **2026-07-06**: creación del funnel webinar (reunión Marco/Adrián). Pipeline `webinar`, landing+gracias, opt-in con email, Meta `webinar_lead`, registro en `/webs` y en el panel de automatizaciones.
- **2026-07-06 (v2, feedback Marco)**: pasada de diseño y copy.
  - Hora del directo: **viernes 10 jul, 17:00** (`date_label`).
  - HERO rehecho como sección estrella: profundidad 3D (perspective + parallax por puntero), orbes flotantes, número destacado con brillo, chips de la descripción (más visual, sin perder conceptos). Móvil primero.
  - Sección **bolsa de trabajo** mejorada (glow, marquee de "empresas buscando talento", subrayado animado).
  - Sección "Lo que verás en el directo" **eliminada** (contenido aún sin definir; se reañadirá cuando Marco lo diga).
  - Historia de Adrián con **galería de fotos** en scroll horizontal. Las 8 fotos se descargaron a **`public/adrian/`** (comprimidas + `next/image`), ya NO dependen del storage externo de GHL.
  - Pop-up reenfocado: el formulario es la "excusa" para **entregarles** la invitación al grupo (icono regalo, copy "te enviamos la invitación", botón "Enviarme la invitación"). Campos obligatorios (`required`).
  - Gracias: **botón grande verde** a WhatsApp + **confeti de celebración** al entrar + recordatorio con día/hora y "reserva el hueco, sin distracciones". Enfoque: "aquí tienes tu acceso".
  - Email `optin_webinar` reenfocado (plaza reservada → entra al grupo → ahí va el link del Zoom).
  - Barrido del guion largo (em dash): cero en todo el funnel. Ver REGLA #7 (producto/04).
