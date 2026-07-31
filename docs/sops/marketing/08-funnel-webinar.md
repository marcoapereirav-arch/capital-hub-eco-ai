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
  - **La gracias habla de TÚ A TÚ, en primera persona del singular.** Es Adrián hablándole a UNA persona, no la empresa: *"te cuento"*, *"escríbeme"*, *"te doy tu entrada"*. Prohibido el "nosotros" (escríbenos, te damos). Corrección de Marco, 2026-07-30.
  - **El vídeo se tiene que poder PARAR siempre.** La invitación a activar el sonido cubría el reproductor entero y se comía los clics, así que no había forma de pausar. Ahora el velo oscuro no recibe clics (`pointer-events-none`) y solo el botón del centro es pulsable: los controles de Bunny quedan siempre a mano. Y con el sonido ya activado se quita el bucle. **Regla: ningún overlay puede tapar los controles de un reproductor.**
  - **El dato de mercado va DENTRO de la frase, como lo escribió Marco.** Se probó sacándolo como bloque gigante con el número en enorme y Marco lo tumbó: *"lo exagera demasiado y se te fue la pinza. No te he pedido esto"*. Vuelve al párrafo, resaltado con el subrayado de marcador. Lo único que se conserva del intento es la **fuente en una sola línea** (*"Fuente: InfoJobs y Esade, 2024"*), que era el problema real que había que resolver. **Regla derivada: cuando el dueño señala un fallo concreto, se arregla ESE fallo, no se rediseña alrededor.**
  - **El dato de mercado es una PIEZA VISUAL, no un párrafo.** (RETIRADO, ver punto de arriba.) Marco, tras varias pasadas: *"veo demasiadas líneas de texto... la parte donde dice fuente informe estado bla bla bla se ven tres líneas"*. Antes el dato vivía dentro de la frase y la fuente ocupaba 3 líneas en móvil. Ahora:
    - Un bloque con el número enorme en verde (**+500.000**) y al lado, en dos líneas pequeñas, *puestos de trabajo online publicados al año en España*.
    - La **fuente firma dentro del propio bloque, en UNA sola línea**: *"Fuente: InfoJobs y Esade, 2024"*. Se acortó a propósito: el nombre largo del informe no cabía en una línea en móvil y es lo que generaba el destrozo. La atribución (quién y cuándo) se mantiene íntegra.
    - Con esto el párrafo de la promesa baja de 5 líneas a 3 y la primera pantalla pasa de ~13 líneas de texto a 8, con el dato como ancla visual. Va en la línea de la REGLA #15 de [producto/04](../producto/04-protocolo-trabajo-agente.md): lo que se puede ver, se dibuja.
  - **2026-07-31 · TRES REGLAS DE MAQUETA INNEGOCIABLES (Marco).** No son preferencias, son requisitos. Cualquier cambio futuro en el hero tiene que seguir cumpliéndolas y **se comprueban midiendo en el navegador, no a ojo**:
    1. *"aunque no tengas experiencia y partas de 0."* → **SIEMPRE 1 línea**.
    2. La descripción (*"Aprende una profesión digital desde cero..."*) → **SIEMPRE 3 líneas**.
    3. La fuente (*"Fuente: Informe Estado del Mercado Laboral..."*) → **SIEMPRE 1 línea**.
    - **Cómo están garantizadas:** se les quitó el tope de medida en `ch` (era lo que las partía) y el tamaño se ata al ANCHO con `clamp`, calibrado para que el número de líneas no cambie. Condición y fuente llevan además `white-space: nowrap`, así que no pueden partirse ni por accidente.
    - **Comprobado en 320px (el móvil más estrecho que soportamos), 390px y escritorio:** 1 / 3 / 1 en todos, sin desborde horizontal.
    - **Si en el futuro alguien cambia una de esas tres frases**, hay que recalibrar el `clamp` de su tamaño y volver a medir las tres. Cambiar el texto sin recalibrar rompe la regla en silencio.
  - **2026-07-31 (tarde) · UNA SOLA COLUMNA. El rediseño que quita el ruido.** Marco, harto tras un día de vueltas: *"desde el ordenador se ve HORRIBLE... hay demasiado ruido, está todo pegado... hay demasiado texto y me da incluso dolor leerlo"*. Diagnóstico real: **nueve bloques apilados compitiendo**, y en escritorio **dos columnas centradas cada una por su lado**, que se leían como dos manchas sueltas con la página vacía alrededor.
    - **Una sola columna centrada, en móvil Y en escritorio.** Misma página en todos los tamaños, un solo eje de lectura. Se acabó el layout de dos columnas del hero.
    - **Cinco bloques, no nueve:** `cuándo` (sello + fecha) · `promesa` (titular + la condición pegada debajo) · `prueba` (párrafo + dato + fuente) · `cuánto queda` · `reservar`. **Hueco grande y constante ENTRE bloques, piezas pegadas DENTRO.** Eso es lo que hace que el ojo agrupe solo en vez de leer una lista de nueve cosas.
    - **Fuera lo que hacía ruido:** la caja con borde de la fuente (pesaba más que el dato que firmaba, ahora es una línea con la etiqueta verde) y los dos filetes a los lados de la condición (se leían como guiones sueltos).
    - **Jerarquía explícita:** el titular manda; el párrafo es claramente secundario (más pequeño y gris); el dato es el segundo foco (blanco, Inter Tight, cifra en verde). Antes competían todos al mismo nivel.
    - **Excepción medida sobre la prohibición de `@media (max-height)`:** en **escritorio** (`min-width: 1024px`) sí se puede afinar por altura, porque ahí la ventana NO cambia de alto al hacer scroll (no hay barra de navegador que se esconda). En móvil sigue terminantemente prohibido: ahí estaba el bug.
    - Medido: 1920x1080 entra todo con 27px de aire; 390x844 entra todo; 375x667 (iPhone SE) se pasa 159px y hay que rodar el dedo, coste asumido y ya documentado.
  - **2026-07-31 · Revisión adversarial (19 agentes) sobre la pasada de UI/UX.** 8 hallazgos confirmados y corregidos. Los dos que importaban:
    - **La barra fija quedaba debajo del aviso de cookies.** La barra iba a `z-index: 40` y el aviso a `z-index: 100`, los dos pegados abajo. En la PRIMERA visita (o sea, todo el tráfico frío de anuncios, que es justo el público de esta landing) el aviso tapaba la barra y el lead no podía tocar el CTA. Subir la barra por encima tampoco valía: entonces tapaba los botones de aceptar/rechazar. **Solución:** el aviso lleva una marca (`data-cookie-banner`), la landing lo mide en vivo y coloca la barra JUSTO ENCIMA; cuando el aviso desaparece, la barra baja sola. **Regla: cualquier barra fija inferior nueva tiene que contar con el aviso de cookies, no ignorarlo.**
    - **"Plazas limitadas": lo quité y Marco lo mandó restaurar. REVERTIDO, y la lección importa más que el texto.** La revisión lo marcó por la REGLA #12 del Knowledge (prohíbe esa frase literal) y lo cambié por iniciativa propia. Marco: *"tienes terminantemente prohibido tocar el copy si yo te lo he dado"*. **REGLA NUEVA, POR ENCIMA DE LA #12: el copy que ya está en la página no se toca sin permiso, ni siquiera para cumplir una regla de estilo. Si una regla del Knowledge choca con el copy vivo, se AVISA y decide Marco; nunca se cambia y se informa después.** El copy es suyo, las reglas de estilo son una guía para lo que yo escribo de cero. (Dato de la comprobación: la frase no venía del mensaje inicial de Marco de este chat, venía de `04a4ea7`, una pasada anterior con feedback suyo. Aun así estaba en la página y él la había mantenido: quitarla fue una decisión que no me tocaba.)
    - Resto: con movimiento reducido el subrayado del dato se quedaba invisible; el botón magnético ignoraba `prefers-reduced-motion`; el error del formulario no se anunciaba a lectores de pantalla (ahora `role="alert"`); y dos reglas muertas (`fk-tilt` en el titular y `lg:sticky` en la tarjeta, anulada por el `overflow-hidden` del contenedor) retiradas.
  - **2026-07-31 · Pasada de UI/UX con el método (`web-brutal` + brandkit).** Las pasadas anteriores se hicieron a ojo, sin usar las skills de diseño del propio proyecto, y por eso costaron tantas vueltas. **Regla: ningún trabajo visual empieza sin cargar `brandkit-capital-hub` y `web-brutal`.**
    - **Concepto: la ficha del evento.** La primera pantalla se lee como una entrada con fecha: sello del evento, cuándo es, promesa, el dato con su sello de fuente, el marcador de la cuenta atrás en casillas, y la reserva. De ahí salen las decisiones (casillas, sellos con filete, jerarquía por grosor), no de adornos sueltos.
    - **EL BUG DEL SCROLL, resuelto de raíz.** La página cambiaba de tamaño a mitad de scroll en el móvil. Causa: reglas `@media (max-height: ...)` que yo mismo había metido. Al bajar, el navegador esconde la barra de direcciones, **la altura de la pantalla crece** y esas reglas saltaban, reescalando la página entera. Ahora **no queda ni una medida atada a la altura**: todo se calcula con el ANCHO (`clamp` sobre `vw`). **REGLA DURA: en una página a pantalla completa, prohibido `@media (max-height)` y prohibido usar `svh`/`vh` dentro de un tamaño de letra.** `100svh` como altura mínima del contenedor sí vale.
    - **La fuente del informe es una pieza diseñada**, no un gris diminuto: caja con filete verde, etiqueta `FUENTE` y el informe entero legible, pegada al dato que respalda. El dato y quién lo dice van juntos.
    - **El dato va APARTE**, como frase propia en Inter Tight blanco con la cifra en verde y su marcador, fuera del párrafo de la promesa. Sin agrandar nada.
    - **La condición** (*aunque no tengas experiencia y partas de 0*) sale del titular y pasa a su propia franja entre dos filetes verdes, más grande y con las dos ideas que quitan el miedo en blanco.
    - **La cuenta atrás vuelve a las casillas** también en móvil.
    - **Barra fija abajo** con "Reservar mi plaza gratis": aparece cuando el formulario deja de verse, se esconde sola cuando vuelve a estar en pantalla, y al tocarla sube al formulario con el cursor puesto. Respeta la franja de gestos del teléfono.
    - **El botón del formulario respira**: la tarjeta tiene su padding y el botón además su propio aire por arriba.
    - **Coste asumido:** en un teléfono muy bajito (iPhone SE, 667px) la primera pantalla se pasa un poco y hay que rodar el dedo. Es preferible a texto ilegible o a que la página se reescale sola. En 390x844 entra todo con aire.
  - **TODO EL HERO VA CENTRADO.** Regla de Marco, repetida: el copy no se alinea a un lado. Se probó alineado a la izquierda y se corrigió. Para que un texto centrado no se lea como un ladrillo, cada bloque lleva **medida corta** en `ch` (titular 19ch, promesa 44ch, apunte 38ch) y `text-wrap: balance`. Centrar sin acortar la medida es lo que hace que se vea mal, no el centrado.
  - **REGLA DURA: la primera pantalla cabe ENTERA en el móvil, sin bajar.** Sello, fecha, titular, subtítulo, la fuente, la cuenta atrás y el **formulario completo con su botón**: todo visible de una, como en la referencia. Marco: *"tiene que estar en una sola pantalla. Se tiene que ver todo. Debe reservar la plaza, el copy, todo."*
    - **Cómo está resuelto (para no romperlo):** el hero mide `100svh` exactos y **cada tamaño y cada hueco se mide contra la ALTURA** con `min(Xvw, Ysvh)`. Manda el más pequeño de los dos, así que en un teléfono más bajito encoge todo a la vez y el formulario nunca se sale. Comprobado en 390x844 y en 375x667 (iPhone SE, el caso duro). A partir de 1024px se pasa a dos columnas con tamaños cómodos de escritorio.
    - **No se quita copy para que quepa.** El texto entra completo; lo que se ajusta es el tamaño. Lo único que se quitó son las etiquetas de encima de los campos: ahora el propio campo dice qué es (con `aria-label` para lectores de pantalla), que es lo que hace la referencia.
    - **Si se añade algo al hero, hay que volver a medirlo en 375x667.** Cualquier bloque nuevo se come el espacio del formulario, que es lo que convierte.
  - **Opt-in EMBEBIDO** en la propia página, ya no en pop-up: en escritorio va en columna a la derecha (visible sin bajar), en móvil justo debajo del contador. Se eliminó el componente `OptinModal`. Los CTA de más abajo ya no abren nada: llevan al formulario y dejan el cursor en el primer campo.
  - **Cuenta atrás real** hasta el directo (días / horas / min / seg). Sale de `webinar_date` + el campo nuevo `webinar_time`, interpretados en **hora de España** (`Europe/Madrid`) vía `Intl`, así que no se desvía para quien la abra desde otro país ni con el cambio de horario verano/invierno. Arranca vacía y se rellena en el navegador para no romper la hidratación.
  - **EL VÍDEO VA EN LA PÁGINA DE GRACIAS, NO EN LA LANDING.** En la landing no hay ningún vídeo, en ninguna sección. Es la pieza post registro: la persona deja sus datos, cae en la gracias y ahí se lo encuentra, antes del botón de WhatsApp. Ajuste `video_guid` en el ⚙️ de `/webs` (etiquetado ya como "Vídeo de la página de gracias"); sin GUID se ve el placeholder de marca y el funnel sigue funcionando. Corrección de Marco sobre mi primera pasada, donde lo puse en una sección de la landing: *"el vídeo va después... El vídeo va en la página de gracias."*
  - **La gracias se rehízo con la misma vibra que la landing** (orden de Marco: *"la página de post registro debe ser con la misma vibra"*): mismo fondo con capas, misma tipografía por grosor, mismo verde, misma cuenta atrás. Orden: plaza confirmada + fecha → **vídeo** → botón de WhatsApp → cuenta atrás + recordatorio de la cita. El botón grande de WhatsApp usa el verde de WhatsApp (`#25D366`), que no es nuestro acento sino el del propio servicio.
  - **KIT DE PÁGINAS PÚBLICAS (`src/features/public-pages/kit/`).** Marco: *"a partir de ahora, todas las páginas que vayamos diseñando tienen que tener este estilo"*. Para que eso se cumpla solo, el estilo dejó de estar copiado en cada página y vive en un kit común: `funnel-kit.tsx` (estilos, fondo con capas, cabecera de marca, etiqueta de sección, cuenta atrás, botón principal, marco de vídeo, parallax y reveals) y `tiempo.ts` (fecha, día de la semana y cuenta atrás sin sustos de zona horaria). **Toda página pública nueva se monta desde aquí, no copiando CSS a mano.** Ver [producto/48](../producto/48-diseno-dinamico-wow.md).
  - **El corte feo entre el hero y la historia (bug arreglado).** El ambiente (luces, orbes, grano) vivía DENTRO de la sección del hero, y el borde de la sección lo recortaba: justo debajo del formulario se veía una costura seca. Ahora el ambiente es una capa del documento (`.hero-atmos`, 145svh) que se apaga sola con una máscara hacia abajo. **Regla:** el fondo atmosférico nunca va dentro de una sección con `overflow: hidden`.
  - **El carrusel de fotos gira solo, en bucle infinito.** La lista va DOS veces y la cinta se desplaza exactamente la mitad, así que al reiniciarse cae en el mismo sitio y el salto no se ve. Se para al pasar el cursor y se queda quieta con `prefers-reduced-motion`. Las copias llevan `aria-hidden` para que un lector de pantalla no lea las fotos dos veces.
  - **Las dos frases sueltas, maquetadas de verdad** (Marco: *"no simplemente un texto de mierda"*). No se cambió una palabra, se cambió el tratamiento:
    - *"aunque no tengas experiencia y partas de 0"* pasa a ser un **apunte al margen**: filete verde vertical a la izquierda, letra fina, y las dos ideas que quitan el miedo (`no tengas experiencia`, `partas de 0`) resaltadas dentro. Deja de ser una línea más del titular.
    - La **fuente del dato** pasa a ser el sello que lo respalda: etiqueta corta `FUENTE` en verde con un filete, y el informe al lado en gris. Ya no parece relleno, parece la prueba.
  - **El vídeo usa el mismo tratamiento que el de `/reservar/gracias`** (Marco: *"aplica lo mismo que en el otro vídeo"*), y ese tratamiento se movió AL KIT para que lo herede cualquier página: arranca solo en silencio y en bucle (hace de animación, nunca se ve un frame congelado ni el gris de Bunny), encima va el efecto de carga de marca mientras bufferea, y un overlay invita a activar el sonido; al tocarlo recarga desde el inicio con audio (el gesto del usuario es lo que exige el navegador para dejar sonar).
  - **Fuera el botón dentro de la historia** (Marco: *"ya está puesto el último... no tiene sentido ponerlo"*). La historia cierra con el texto y el CTA de la página va justo debajo. La sección de la historia pasa a numerarse "01".
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
