---
title: Tutoriales (formación interna del equipo)
order: 61
area: producto
---

# Tutoriales: la formación interna del equipo

> Creada 2026-07-31. Marco: *"quiero crear una nueva sección dentro del OS que se
> llame Tutoriales. Yo voy a subir lecciones para que los formadores vean cómo ir
> utilizando el sistema y las acciones que voy a ir añadiendo"*.

---

## La idea, en una línea

**Marco graba una vez, y queda ahí para siempre.** Vídeos organizados en
carpetas, dentro del OS, para todo el equipo interno.

Vive en `/tutoriales`. No confundir con la formación de alumnos: aquella va en la
App (REGLA DE ORO del SOP [`producto/02`](02-arquitectura-os-app.md)). Esto es
para el equipo, y el equipo trabaja en el OS.

## Por qué en el OS y no en la App

Se comprobó antes de construir, porque la primera propuesta se equivocó y decía
que iba en la App:

- El formador **tiene cuenta en el OS** (`profiles.role = 'formador'`) y desde
  ahí salta a la App con "Ir a App" (SOP [`producto/41`](41-sistema-roles-permisos.md)).
- Añadir una sección al OS y decidir quién la ve es el procedimiento ya
  documentado en ese mismo SOP.
- Marco decidió además (2026-07-31) que la vea **todo el equipo interno**, no
  solo formadores: marketing, closers y setters también.

## Quién ve qué

| Quién | Ve la sección | Ve borradores | Puede administrar |
|---|---|---|---|
| `super_admin` / `admin` | Sí | Sí | Sí |
| `formador`, `marketing`, `closer`, `setter` | Sí | **No** | **No** |
| Alumno de la App | **No** | No | No |

El candado copia el patrón ya probado de `knowledges` (SOP [`producto/54`](54-knowledge-3d.md)):

- **Leer:** tener fila activa en `profiles`. Los alumnos viven en `users`, no en
  `profiles`, así que quedan fuera **sin tener que enumerarlos**.
- **Escribir:** `public.is_admin()`, el helper que ya existía.

## Carpetas dentro de carpetas (tipo Google Drive)

Marco, 2026-07-31: *"quiero que la parte de los tutoriales sea como si fuese un
Google Drive... dentro de carpetas podemos crear carpetas, y dentro de carpetas
lecciones, y así sucesivamente"*.

- `tutorial_folders.parent_id` apunta a la carpeta madre. Raíz = `parent_id null`.
  **Sin límite de niveles.**
- La raíz enseña las carpetas **como tarjetas**, que dicen cuántas carpetas y
  vídeos hay dentro **contando todo lo que cuelga más abajo**.
- Migas de pan para volver, y el sitio donde estás va en la dirección
  (`/tutoriales?carpeta=<id>`), así el botón de atrás del navegador funciona y
  se puede pasar el enlace de una carpeta concreta.
- Cada carpeta y cada vídeo tienen menú de **renombrar, mover y borrar**. Sin
  mover, esto no sería un Drive.
- **Un vídeo siempre vive dentro de una carpeta**, nunca suelto en la raíz.

### Los candados del árbol

| Candado | Qué evita |
|---|---|
| Disparador `tutorial_folders_sin_bucles` | Meter una carpeta dentro de sí misma o de una de sus hijas. Eso crea un anillo: esas carpetas desaparecen de la raíz, no hay forma de llegar a ellas y no se pueden recuperar desde la pantalla |
| Dos índices únicos parciales | Dos carpetas con el mismo nombre en el mismo sitio. Hacen falta **dos** porque en Postgres dos NULL son distintos, así que un único índice dejaría pasar duplicados justo en la raíz |
| `nombre_no_vacio` / `titulo_no_vacio` | Tarjetas en blanco creadas desde fuera de la pantalla |
| Disparador `tutorial_orden_al_mover` | Que al mover algo aterrice empatado con una hermana. Postgres devuelve los empates en orden arbitrario, **y ese orden cambia al editar cualquier otra fila**: las tarjetas se recolocarían solas |
| Función `tutorial_subarbol` | Que borrar una carpeta deje vídeos huérfanos en Bunny pagándose para siempre |

## Las dos formas de meter un vídeo

Marco eligió las dos, y conviven en la misma ficha:

| Forma | Dónde acaba el vídeo | Cuándo usarla |
|---|---|---|
| **Subir el archivo** | Bunny, colección **`Tutoriales OS`** (se crea sola) | Lo que deba durar |
| **Pegar link de Loom** | Se queda en Loom. Solo se guarda el link | Algo rápido |

**Al pegar un Loom, la ficha se rellena sola.** Se le pregunta a Loom por el
vídeo con su oEmbed oficial (`https://www.loom.com/v1/oembed?url=...`) y se traen
título, duración y portada. Comprobado el 2026-07-31 con un vídeo real de Marco:
devuelve los tres. Si Loom no contesta **no se bloquea nada**: se guarda igual y
el título se escribe a mano. Un adorno no puede impedir guardar.

**Confirmado también que `loom.com/embed/<id>` se deja incrustar** (responde 200
y no pone `X-Frame-Options`). El intento anterior había fallado porque se probó
con un identificador inventado: Loom redirige a su portada, y **esa** sí prohíbe
el incrustado. No era el mismo caso.

**Contrapartida de Loom, dicha en voz alta:** el vídeo sigue siendo de Loom. Si
se borra allí o se pone en privado, la ficha se queda sin vídeo. Por eso lo
importante se sube como archivo.

La subida va **directa del navegador a Bunny** (protocolo TUS): sin límite de
tamaño y se reanuda si se corta. El OS solo firma el permiso.

## Modelo de datos

`tutorial_folders` (carpetas) y `tutorials` (fichas). Dos candados de integridad
que evitan fichas rotas en pantalla:

- `tutorials_fuente_coherente`: cada fuente exige su dato y **solo** el suyo.
- `tutorials_publicado_con_video`: no se puede publicar una ficha sin vídeo.

Todo nace en **borrador**, también el de Loom (aunque se pueda ver al instante),
para que un link mal pegado no salga al equipo sin que nadie lo mire.

Borrar un tutorial de Bunny lo borra **también en Bunny**, mismo criterio que el
Estudio (SOP [`producto/59`](59-bunny-archivo-ordenado.md)). Un Loom no se toca.

## Comprobado el 2026-07-31

Con el usuario de pruebas (SOP [`sistemas/02`](../sistemas/02-test-agent.md)) y en base de datos:

- Crear carpeta, añadir Loom, nace en borrador, publicar, reproducir: **todo bien**.
- Rechaza un link que no es de Loom; acepta el válido.
- En móvil (390px) no se desborda.
- **Como formador:** ve el publicado, **no** ve el borrador, y crear una carpeta
  le da error de permiso. **Como alumno:** cero. **Sin sesión:** cero.
- La subida crea la colección `Tutoriales OS` en Bunny (verificado y limpiado).

### Segunda pasada, con el árbol y el Loom real (2026-07-31)

Crear carpeta con el panel de marca, entrar, crear subcarpeta, **tercer nivel**,
migas de pan, añadir el **Loom real de Marco** (reconocido, título y duración
rellenados solos), publicar, reproducir (**Loom acepta el incrustado**), mover
una carpeta a otra con los destinos inválidos marcados como "No se puede",
borrar exigiendo escribir el nombre, y a 390px sin desbordar. Todo en verde.

## Aprendizaje: un revisor puede equivocarse con mucha seguridad

La revisión de riesgos previa dio como hallazgo **crítico** que `is_admin()`
buscaba un rol `'admin'` que ya no existe, y que por tanto todas las escrituras
morían en silencio. Sonaba coherente y venía con la migración que lo probaba.

**Era falso.** El revisor leyó `supabase/migrations/` en vez de la base viva.
`select pg_get_functiondef('public.is_admin()'::regprocedure)` devuelve una
versión que **sí** incluye `super_admin` y **sí** comprueba `active`, y una
prueba con la sesión de un super admin devuelve `true`. Además las escrituras ya
funcionaban en las pruebas de la primera pasada.

**Regla derivada:** un hallazgo sobre el estado de la base se comprueba **contra
la base**, nunca contra los archivos del repo. Las migraciones cuentan la
historia, no el presente. Los otros tres hallazgos graves de esa misma revisión
sí eran ciertos y están arreglados.

### Lo que la revisión sí acertó, y quedó arreglado

1. **Fallo mudo en las escrituras.** `update`/`delete` sin `.select()` devuelven
   0 filas con `error: null` cuando la RLS filtra, y la API respondía éxito. En
   pantalla salía guardado y al recargar no había cambiado nada. Los cuatro
   endpoints de escritura llevan ya `.select().maybeSingle()` y responden 403.
2. **Borrar una carpeta no limpiaba Bunny.** Con el anidamiento, un borrado en la
   raíz se llevaba subárboles enteros y dejaba los archivos pagándose para
   siempre. Ahora se pide el subárbol antes de borrar y se limpian sus vídeos.
3. **Un toque borraba una formación entera.** El `confirm` del navegador es un
   toque en el móvil. Ahora, si dentro hay algo, hay que **escribir el nombre**.

**Sigue pendiente:** no hay papelera. Un borrado confirmado es definitivo.

---

## PENDIENTE DE SEGURIDAD: la puerta de subida de la App

**Detectado el 2026-07-31 leyendo el código.**

`/api/admin/lessons/bunny-create-video` **no comprueba quién llama**. Cualquiera
que sepa la dirección obtiene una firma de subida a Bunny válida 24 horas y
puede llenar la biblioteca. Su CORS además devuelve como permitido el origen que
le llegue, sea cual sea.

Las rutas de carpetas ya se cerraron con `quienLlama` (`lib/bunny-acceso.ts`, ver
SOP 59). **Esta se quedó fuera.**

**Se intentó cerrar en este mismo bloque y se revirtió**, porque rompía
producción: la App llama **sin cabecera `Authorization`**
(`web/src/features/estudio/InspectorLeccion.tsx`), así que cerrarla hoy dejaría a
los formadores sin poder subir lecciones.

**El arreglo son dos pasos, en este orden:**

1. **App:** mandar el token de sesión en `Authorization` al llamar al OS.
2. **OS:** exigir `quienLlama(...)` en esa ruta.

Invertir el orden rompe las subidas en producción. La ruta nueva de tutoriales
(`/api/tutoriales/subida`) **sí** comprueba, desde el primer día.

---

## Aprendizaje: el vigilante avisó, la regla no bastó

Al construir esto, `npm run build` se negó a arrancar: `dev` iba **3 cambios por
detrás de `main`** porque otro chat publicó saltándose `dev`.

- La parte automática del método (**un chat = una rama = una carpeta**) funcionó:
  los dos chats no se pisaron ni un archivo.
- La parte no automática (**publicar = rama, `dev`, `main`, subiendo las dos**)
  falló, porque nada la **impide**: es una regla escrita.

`dev` se reparó con un avance limpio (`git push . main:dev`), sin tocar la
carpeta del otro chat y sin subir nada a la web.

**Queda propuesto** convertir esa regla en candado de verdad (que publicar
saltándose `dev` sea imposible, no solo desaconsejado). No se aplicó todavía
porque toca a los dos chats a la vez.

---

## Fuera de alcance a propósito

Marcar como visto, buscador, comentarios, y que suba tutoriales alguien que no
sea Marco o Adrián. Con dos vídeos serían botones que no sirven. Se añaden cuando
haya volumen que los pida.

## Cambios versionados

### 2026-07-31: creación
Sección completa: base de datos con candados, pantalla, panel de administración,
subida a Bunny en `Tutoriales OS` y soporte de Loom. Carpeta "Montar tu
formación" creada y esperando los dos vídeos de Marco. PRP-008.
