---
title: Catálogo de eventos de Meta — cuáles usamos y cuáles no
order: 9
---

# Catálogo de eventos de Meta

Meta tiene **17 eventos estándar**. Son nombres que Meta ya conoce y sobre los que tiene
datos de millones de anunciantes, así que su algoritmo optimiza mucho mejor hacia ellos
que hacia un nombre inventado por nosotros.

Este documento fija **cuáles usamos, cuáles no, y por qué**. Si un evento no está en la
lista de "los nuestros", no se dispara. Sin excepciones y sin improvisar.

---

## Los 17 eventos estándar de Meta

Lista oficial completa (verificada en la documentación de Meta el 2026-07-31).

| # | Evento | Qué significa para Meta | ¿Lo usamos? |
|---|---|---|---|
| 1 | `PageView` | Alguien cargó una página | **Sí**, automático en todo |
| 2 | `ViewContent` | Alguien vio una página que nos importa | **Sí** |
| 3 | `Lead` | Alguien dejó sus datos y pasa a ser un posible cliente | **Sí** |
| 4 | `Schedule` | Alguien reservó una cita | **Sí** |
| 5 | `Contact` | Alguien nos escribió (chat, teléfono, email) | **Sí** |
| 6 | `InitiateCheckout` | Alguien entró al proceso de pago | Más adelante |
| 7 | `Purchase` | Alguien completó una compra | Más adelante |
| 8 | `CompleteRegistration` | Alguien completó un registro o alta de cuenta | No |
| 9 | `StartTrial` | Alguien empezó una prueba gratuita | No |
| 10 | `Subscribe` | Alguien empezó una suscripción de pago | No |
| 11 | `SubmitApplication` | Alguien envió una solicitud a un programa | No |
| 12 | `AddToCart` | Añadió un producto al carrito | No |
| 13 | `AddToWishlist` | Añadió a favoritos | No |
| 14 | `AddPaymentInfo` | Metió su tarjeta en el checkout | No |
| 15 | `CustomizeProduct` | Personalizó un producto | No |
| 16 | `Search` | Buscó algo dentro de la web | No |
| 17 | `FindLocation` | Buscó una tienda física | No |
| 18 | `Donate` | Hizo una donación | No |

> Nota: Meta lista 17 eventos "estándar" más `PageView`, que va aparte porque se dispara
> solo al instalar el píxel. Por eso la tabla tiene 18 filas.

---

## Los 5 que usamos nosotros

### 1. `PageView` — entró a una página

Se dispara **solo**, en cada página, en cuanto el píxel carga. No hay que programarlo.

No significa nada por sí mismo: solo dice "alguien pasó por aquí". Sirve para que Meta
sepa que la persona existe y para poder perseguirla con anuncios después.

**Ojo con cómo se lee en pantalla.** `PageView` sale del píxel dentro del navegador y
**nunca pasa por nuestro servidor**, así que jamás aparece en el registro de envíos. Eso
no significa que no funcione. Por eso en las pantallas va marcado como **automático** y en
verde, no como "sin estrenar": estar sin registro es su comportamiento normal, no un
fallo. Todo lo demás sí lo mandamos nosotros y sí queda registrado con su número de
envíos.

### 2. `ViewContent` — vio la página que nos importa

Esta la disparamos nosotros **a mano**, solo en las páginas que valen.

**La diferencia con `PageView`:** `PageView` salta en todas las páginas, incluida la de
cookies y el aviso legal. `ViewContent` salta solo donde está la oferta. Le está diciendo
a Meta "esta persona vio de verdad lo que vendemos", no "esta persona pasó por la web".

Sin esta separación, tus audiencias mezclan a quien leyó la política de privacidad con
quien vio la landing del webinar. Y no son la misma persona.

### 3. `Lead` — dejó sus datos

Salta cuando alguien rellena el formulario y le da al botón. Nombre, email, teléfono.

**Es el evento hacia el que optimiza la campaña del webinar.** Le dices a Meta "búscame
más gente que haga exactamente esto" y Meta va a buscar más gente que deje sus datos.

### 4. `Schedule` — reservó la llamada

Salta cuando Calendly confirma la reserva. Es el evento oficial de Meta para "reservó una
cita".

**Es el evento hacia el que optimiza la campaña de la agenda.**

### 5. `Contact` — nos escribió

Salta cuando la persona pulsa el botón de WhatsApp o de Instagram para escribirnos.

Es la respuesta a "cuando nos escriba, cómo lo seguimos". Nosotros no vemos la
conversación desde la web, pero **sí vemos el momento exacto en que decidió escribir**, y
eso es una señal de intención altísima. Meta puede optimizar hacia ella.

---

## Por qué NO usamos `CompleteRegistration`

Es la duda razonable: alguien se apunta al webinar, eso es un registro, ¿no?

**Regla dura: una acción del usuario dispara UN solo evento estándar.**

Si al enviar el formulario disparamos `Lead` y `CompleteRegistration` a la vez, Meta cuenta
dos conversiones por una sola persona. Tus números se inflan al doble, el coste por
conversión sale a la mitad de lo real, y el algoritmo reparte su aprendizaje entre dos
señales en vez de concentrarlo en una.

`CompleteRegistration` tendría sentido si el usuario se creara una cuenta con contraseña.
En el webinar no se crea ninguna cuenta: deja sus datos y ya. Eso es `Lead`.

**Corrección:** en el chat anterior dije que al webinar le faltaba `CompleteRegistration`.
Estaba mal. Le falta `ViewContent`, no ese.

---

## Mapa por funnel

### Funnel Webinar semanal

| Momento | Evento | Cómo se dispara |
|---|---|---|
| Entra a la landing | `PageView` | solo |
| Ve la landing | `ViewContent` | al cargar la landing |
| Deja sus datos | `Lead` | al enviar el formulario |
| Pulsa WhatsApp en la gracias | `Contact` | al hacer clic |

**Optimizar la campaña hacia:** `Lead`.

### Funnel Reserva de Sesión (Calendly)

| Momento | Evento | Cómo se dispara |
|---|---|---|
| Entra a la página | `PageView` | solo |
| Ve la página de reserva | `ViewContent` | al cargar la página |
| Reserva la llamada | `Schedule` | cuando Calendly confirma |

**Optimizar la campaña hacia:** `Schedule`.

---

## Los eventos nuestros (personalizados)

Además del estándar, cada acción dispara **un evento nuestro con el mismo identificador**,
para que Meta no lo cuente dos veces y podamos crear audiencias muy específicas.

| Nuestro | Va junto a | Para qué |
|---|---|---|
| `webinar_lead` | `Lead` | separar los leads del webinar de cualquier otro lead |
| `agenda_reserva` | `Schedule` | separar las reservas de esta agenda de otras futuras |

Existe `webinar_lead`. Falta crear `agenda_reserva`.

---

## Las dos capas: píxel y API

Cada evento sale **por dos caminos a la vez**:

- **Píxel (navegador):** rápido, pero se pierde si la persona bloquea cookies o usa un
  navegador con protección.
- **API de conversiones (servidor):** sale desde nuestro servidor, no lo bloquea nadie.

Los dos llevan **el mismo identificador**, así que Meta entiende que es el mismo hecho y
lo cuenta una sola vez. Si el píxel se pierde, el del servidor lo salva.

---

## Interruptor por funnel

Un funnel en borrador no lanza eventos porque no se puede ni entrar (da 404). Pero lo
contrario no es cierto: **estar publicado no debería obligar a mandar eventos**. El acceso
al OS está publicado y no es un funnel de anuncios.

Por eso cada funnel lleva su **propio interruptor de medición**, aparte de publicado o
borrador:

| Publicado | Interruptor de medición | Resultado |
|---|---|---|
| Sí | Encendido | Mide y manda a Meta |
| Sí | Apagado | Se ve, no mide |
| No | Cualquiera | Ni se ve ni mide |

Cuando se crea un funnel nuevo, el interruptor nace **apagado**. Así nada empieza a mandar
datos a Meta por accidente.

---

## Cómo está montado HOY (verificado en vivo)

Estado real a 31-jul-2026, comprobado abriendo las páginas en un navegador y mirando lo
que llegó a Meta. No es el plan: es lo que hay funcionando.

### Modo de envío: REAL

El interruptor prueba/real vive en `app_settings` con la clave `meta_capi_mode`, y se
cambia desde **Ads → Ajustes**. Está en **real** desde el 31-jul-2026.

**Lo que pasó antes:** desde mayo hasta ese día estuvo en prueba. Los 21 eventos enviados
en ese periodo llevaban la marca de prueba, así que Meta los recibió y los descartó. Cero
conversiones reales llegaron nunca. Se descubrió al auditar el sistema antes de escalar
anuncios, y explica por qué las campañas no tenían con qué optimizar.

**Cómo se comprueba de un vistazo:** un evento real NO lleva `test_event_code` en su
payload. Si lo lleva, no cuenta.

### Dónde se dispara cada evento

| Funnel | Evento | Momento exacto |
|---|---|---|
| Clase en directo | `ViewContent` | al abrir la landing |
| Clase en directo | `Lead` + `webinar_lead` | al enviar el formulario del opt-in |
| Clase en directo | `Contact` | al pulsar el botón de WhatsApp en la gracias |
| Reserva de sesión | `ViewContent` | al abrir la página de reserva |
| Reserva de sesión | `Schedule` + `agenda_reserva` | cuando Calendly confirma la reserva |
| Test de personalidad | `Lead` + `test_personalidad_lead` | al enviar el formulario |
| Test de personalidad | `test_personalidad_cualificado` | al abrir el test desde el email |

**El de la reserva no depende de Adrián.** Calendly avisa a la propia página en el
instante en que el usuario confirma día y hora (la página ya escuchaba ese aviso para
llevarlo a la gracias). Ahí mismo se engancha el evento. El webhook de Calendly sigue
pendiente, pero no hace falta para medir.

### Los dos caminos, ahora sí completos

Cada evento sale por píxel (navegador) y por API (servidor) con el mismo identificador.

**Bug encontrado y corregido el 31-jul-2026:** los eventos ESTÁNDAR (`Lead`, `Schedule`)
solo salían por el píxel del navegador. El servidor mandaba únicamente el nuestro
(`webinar_lead`). Resultado: si el lead rechazaba cookies, Meta no recibía ningún `Lead`,
que es justo el evento hacia el que optimizan las campañas. Ahora los dos salen por los
dos caminos.

**Segundo bug de la misma pasada:** un evento estándar mandado como si fuera nuestro. Meta
distingue `fbq("track", ...)` de `fbq("trackCustom", ...)`; si un estándar se manda como
custom, Meta lo trata como un nombre inventado y no optimiza con él.

### La llave para leer las campañas se pega en pantalla

En **Ads → Ajustes**, arriba del todo, hay un campo donde se pega la llave de Meta que
LEE el gasto de las campañas (permiso `ads_read`). Es distinta de la de conversiones: esa
escribe eventos, esta lee rendimiento.

**Antes esto solo se podía poner editando el fichero del proyecto y desplegando**, o sea,
dependía de un desarrollador. Ya no.

Al guardar, el servidor hace tres cosas solo:

1. **La alarga.** Una llave sacada a mano dura un par de horas; se cambia por una de unos
   60 días usando el identificador y el secreto de la app. Las de usuario del sistema no
   caducan y Meta rechaza el cambio: entonces se guarda la original, que es lo correcto.
2. **La prueba de verdad** contra la cuenta publicitaria. Guardar una llave rota es peor
   que no guardar nada: parece resuelto y el fallo sale días después.
3. **Solo la guarda si funciona.** Si Meta la rechaza, se dice el motivo y no se guarda.

**Dónde vive:** tabla `app_settings`, clave `meta_marketing_token`. Esa tabla tiene
seguridad a nivel de fila activada y **cero políticas**, así que ningún usuario logueado
puede leerla: solo el servidor con la llave de administración. A la pantalla solo se le
manda una versión tapada, nunca la llave entera.

**Orden de búsqueda:** primero la guardada desde la pantalla, y si no hay, la del fichero
de entorno. Así se puede cambiar sin tocar código ni desplegar.

### El interruptor de medición

Columna `webs.tracking_enabled`. Se toca desde la tarjeta de cada funnel en **Webs**.

Estado a 31-jul-2026:

| Funnel | Publicado | Mide |
|---|---|---|
| Clase en directo | Sí | Sí |
| Reserva de sesión | Sí | Sí |
| Test de personalidad | Sí | Sí |
| Acceso al OS | Sí | **No**, a propósito: es el login, no capta nada |
| MIFGE, LT8 | Borrador | No |

Cuando la medición está apagada, el evento **no se manda pero sí se registra** con el
motivo. Un funnel apagado nunca queda en silencio: se distingue de "no ha entrado nadie".

### La sección de Ads: tres pestañas

Antes eran cinco (Tracker, Dashboard, Atribución, Afiliados, Configuración). Se entraba y
lo primero era una tabla técnica de eventos, y Atribución era un cartel de "próximamente"
que ocupaba una pestaña entera sin dar nada.

| Pestaña | Qué hay |
|---|---|
| **Campañas** | gasto y resultados en vivo desde Meta |
| **Eventos** | un funnel por fila, con luz verde o roja, qué dispara y cuándo llegó cada evento. Debajo, el detalle de cada envío |
| **Ajustes** | píxel, token, cuenta y el interruptor prueba/real |

Abre en **Eventos**: lo primero que hay que saber es si esto está midiendo.

**Afiliados** salió a su propia sección (`/afiliados`). No se borró nada: son fuentes de
tráfico de personas, no configuración de anuncios.

### Cómo verificar que sigue vivo

1. Entrar en **Ads → Eventos**. Cada funnel que mide debe estar en verde.
2. Un evento en rojo con "nunca ha llegado" es un evento roto, no un funnel vacío.
3. Para probar de verdad: abrir la landing y mirar que aparece un `ViewContent` nuevo con
   estado `sent` y sin marca de prueba.

---

## Cambios versionados

### 2026-07-31: sistema montado y verificado en vivo
Interruptor a real. Añadidos `ViewContent` y `Contact` a la clase en directo, y
`ViewContent` + `Schedule` + `agenda_reserva` a la reserva de sesión, que antes no medía
absolutamente nada. Corregidos dos fallos que dejaban a las campañas sin señal: los
eventos estándar no salían por servidor, y podían mandarse como si fueran custom. Nuevo
interruptor de medición por funnel, independiente de publicado o borrador. Sección de Ads
de cinco pestañas a tres, con la pantalla de Eventos que dice funnel por funnel si mide o
no. Afiliados a su propia sección. Verificado abriendo las dos landings: `ViewContent`
llegó a Meta con estado `sent` y sin marca de prueba.

### 2026-07-31: creación
Fijado el catálogo completo tras la pregunta de Marco de cuáles son los eventos que Meta
ya conoce y cuáles usamos. Decidido: 5 en uso (`PageView`, `ViewContent`, `Lead`,
`Schedule`, `Contact`), 2 para más adelante (`InitiateCheckout`, `Purchase`), el resto
descartados. Corregida la recomendación previa de usar `CompleteRegistration` en el
webinar: una acción, un solo evento estándar. Añadida la regla del interruptor de medición
por funnel, independiente de publicado o borrador.
