---
title: App · El Estudio (panel del formador) y las presentaciones visuales
order: 56
area: producto
---

# El Estudio: el panel del formador

> Creado 2026-07-29. Marco: *"la parte formativa donde el formador configura todo
> debe ser extremadamente profesional, dinámica, muy visual y muy intuitiva. Los
> formadores, cuando intentan crear una lección o un módulo, les cuesta saber
> dónde están las cosas. Tiene que cambiarlo todo. No quiero parches."*

---

## La idea, en una línea

**El formador no navega: entra y ya está dentro de su formación.**

Una sola pantalla (`/formador/f/:id`) con dos zonas que nunca desaparecen:

| Zona | Qué es |
|---|---|
| **El árbol** (izquierda, 400px) | La formación entera: módulos, lecciones y material. Siempre visible, siempre en el mismo sitio. |
| **El inspector** (derecha) | Lo que estás tocando ahora mismo. |

Tocas algo en el árbol, cambia el inspector. Nunca se cambia de página, nunca se
pierde el scroll. En móvil el inspector entra como hoja inferior y el árbol se
queda detrás con el scroll intacto: al cerrar, vuelves al punto exacto.

La selección vive en la URL (`?modulo=`, `?leccion=`, `?material=`, `?panel=ajustes`),
así que el botón atrás del navegador funciona y un enlace se puede compartir.

## El arreglo central

**El botón de crear está SIEMPRE en el hueco donde va a aparecer lo creado.**

El "+ Añadir lección aquí" vive dentro de su módulo, al final de sus lecciones,
no al final de la página. Eso es lo que resuelve el "no sé dónde se crean las
cosas", que es literalmente lo que Marco reportó.

## Cómo se eligió el diseño

No se improvisó. Se pidieron **tres propuestas independientes** con ángulos
distintos (todo en una pantalla · guiado por pasos · taller de dos paneles) y las
puntuaron **tres jueces** con criterios distintos:

| Juez | Qué miraba |
|---|---|
| Formador novato | ¿Sabría crear un módulo sin que nadie me lo explique? |
| Implementable | ¿Se construye con lo que ya existe sin romper lo que funciona? |
| Marca | ¿Es de verdad un cambio de 180 grados o un parche disfrazado? |

Ganó **El Estudio** con 23 de 30.

---

## Qué trae que antes no existía

| Hueco que cierra | Antes |
|---|---|
| **Crear una formación desde la pantalla** | Imposible. Solo desde el panel legacy, que además está cerrado al formador. |
| **Cambiar el tipo de módulo** (Técnico / Mentalidad) | Fijado a mano en el código (`content_type: 'TECHNICAL'`). Un módulo de mentalidad no se podía hacer. |
| **El enlace de vídeo externo** | Escondido. Ahora va siempre visible, al lado de la zona de subida. |
| **Subida de vídeo** | El identificador solo se guardaba al pulsar Guardar: cerrar el panel perdía una subida de 20 minutos. Ahora se guarda en cuanto termina. |
| **Borrar algo** | `confirm()` del navegador, sin decir qué se llevaba por delante. Ahora se dice CON NÚMEROS y hay 10 segundos para deshacer. |
| **Confirmación de guardado** | Solo se pintaban errores. Ahora hay testigo (Guardando / Guardado / No se guardó) y aviso en pantalla. |

## Las presentaciones visuales

El formador sube su material y sale una presentación con el estilo oficial, sin
pasar por nadie. Tres pasos visibles: **Material · Revisión · Publicada**.

1. **Material.** Sube un PDF, un `.md` o pega texto. Comprobado el 2026-07-29
   contra OpenRouter: `anthropic/claude-opus-5` lee el PDF directamente como
   content part `file`, así que no hace falta ninguna librería de PDF en el
   navegador.
   **El material se guarda ANTES de generar.** Si la generación falla, no se
   pierde y se reintenta sin volver a subir nada.
2. **Revisión.** Ve la presentación tal cual la verá el alumno. Pide arreglos por
   escrito las veces que quiera (con historial de lo ya pedido y vuelta a la
   versión anterior). **Mientras es borrador no la ve ningún alumno**, y eso lo
   garantiza la RLS, no un filtro del navegador.
3. **Publicada.** Solo cuando el formador acepta.

### El editor de solo texto

Para corregir una errata o afinar un titular. Los textos a un lado, la
presentación real al otro: al escribir, el bloque se resalta y se trae a
pantalla.

**No puede romper el diseño, y no es cuestión de confiar en nadie:** los campos
salen de `camposDeTexto(doc)` y se escriben con `conCampoCambiado`, que solo
escribe sobre una clave que ya existía y ya era texto. Desde ahí es
estructuralmente imposible añadir un bloque, cambiar un icono o alterar el orden.

### Por qué una presentación son DATOS y no código

Es una lista de bloques tipados que un renderer pinta con **el mismo kit visual**
que usan las guías hechas a mano. Ver la skill `formacion-visual`, que es el
molde único de los dos caminos. Consecuencias buscadas: el diseño no se puede
desviar del brandkit, editar el texto es editar un campo, y no se renderiza HTML
de nadie.

**La regla de los tres sitios:** cambiar un bloque obliga a tocar el kit, el
contrato (`documento.ts`) y el renderer más el prompt del generador. Si solo se
toca uno, el generador produce algo que el renderer no sabe pintar y **se cae en
silencio**.

---

## Dónde vive

```
web/src/features/estudio/
  Puerta.tsx              /formador: resuelve a dónde entra y entra
  EstudioPage.tsx         el armazón: barra + árbol + inspector
  useEstudio.ts           la capa de datos. TODA escritura pasa por mustWrite
  ui/Avisos.tsx           avisos, confirmación con números, deshacer, testigo
  ui/BarraDePasos.tsx     Material / Revisión / Publicada
  Arbol*.tsx              la columna izquierda (4 archivos)
  CuadroDeMando.tsx       qué falta para publicar
  AjustesFormacion.tsx    identidad, ruta, visibilidad, acceso, y CREAR
  InspectorModulo.tsx     incluye el tipo de módulo
  InspectorLeccion.tsx    contenido, vídeo, material
  TallerPresentacion.tsx  paso 1
  RevisionPresentacion.tsx paso 2
  EditorTexto.tsx         el editor de solo texto
```

El editor viejo (`/admin/formaciones`) sigue alcanzable mientras esto se asienta.

## Reglas que cumple

Cero guion largo, cero emojis, cero icono `Sparkles`, cero `confirm()` del
navegador, español neutro, copy al grano, mobile-first con zonas táctiles de
44px, y **ningún botón visible que al pulsarlo no haga nada**: si no se puede
hacer algo, no se pinta.

Un formador en modo lectura (formación que no es suya) ve una cinta que lo
explica y **ni un solo control de escritura**. Ver SOP [`producto/55`](55-formador-vs-admin.md).

---

---

## Las formaciones son TRES y no se crean desde la App

> Marco, 2026-07-30: *"Solo y exclusivamente existen tres formaciones hasta
> ahora. Si sacamos una formación nueva, te lo haré saber y lo haremos. Por
> ende, no se pueden crear más formaciones y nadie puede crear más formaciones.
> Solamente se pueden crear módulos y lecciones dentro de las tres que ya
> existen."*

| Ruta | Formación |
|---|---|
| IA Integrator | IA Integrator - Modulo introduccion |
| Media Buyer Digital | Técnico en Marketing Digital |
| Comercial Closing | Comercial Closing - Setter to Closer |

Una ruta, una formación. Consecuencias aplicadas:

- **Fuera crear y borrar formaciones** del Estudio y del panel viejo
  (`/admin/routes/:id/formations`). El Estudio ya solo edita.
- **Fuera el selector "Ruta"** de los ajustes. Con una formación por ruta no
  decidía nada y Marco decía que confundía.
- **La base también lo impide**: se retiraron las policies de INSERT y DELETE de
  `formations`. Esconder el botón no es un candado (SOP [`producto/55`](55-formador-vs-admin.md)).
- Cuando salga una cuarta formación, se crea **con una migración**. Es una
  decisión de negocio, no una tarea del formador.

## La pantalla principal es un panel de seguimiento

Antes, al entrar, la columna derecha enseñaba una lista de recados ("1 lección
sin vídeo") y dos botones que ya estaban en la barra de arriba. Marco: *"esa
pantalla no me dice nada... esto tiene que ser una sección de métricas exactas,
ultra visual, con líneas gráficas y toda la película"*.

Ahora tiene tres bloques:

1. **Cifras**: alumnos, avance medio, lecciones completadas y cuántos terminaron.
2. **Cómo va cada alumno**: una barra por alumno, ordenados por avance, con
   cuándo fue la última vez que tocó la formación.
3. **Dónde se quedan**: la curva de cuántos alumnos completan cada lección, en
   orden. Donde cae en picado, ahí se atascan. Debajo, la lectura en una frase
   (la caída más fuerte y la lección menos vista): un gráfico que hay que
   interpretar solo no sirve.

### El candado que hacía falta para que esto funcione

`user_progress` solo dejaba que **cada persona leyera sus propias marcas**. Es
decir: el formador entraba y el panel salía en cero, no por un fallo de la
pantalla sino porque la base le devolvía cero filas.

La migración `20260730120000` añade una policy de LECTURA acotada por
`puede_editar_leccion(lesson_id)`: el formador ve el avance de los alumnos de su
ruta y de ninguna otra; el super admin, de todas. Escribir el progreso sigue
siendo cosa de cada alumno.

Quién es alumno de una formación sale de `student_invites` (invitación aceptada
cuyo producto es la ruta), que es **el mismo criterio que usa la base** para
decidir qué ve el alumno. Si se calculara de otra forma, los dos números
acabarían discrepando.

### Datos de ejemplo: solo en local, y comprobado

Marco pidió ver el diseño con datos aunque todavía no haya alumnos. El ejemplo
se pinta solo en local, con una cinta que lo dice en pantalla.

**Aprendizaje que costó tres intentos:** `if (import.meta.env.DEV)` NO basta.
El empaquetador resuelve el módulo **antes** de simplificar el código, así que
los nombres inventados acababan dentro del archivo publicado aunque no se
pintaran nunca. Se comprobó buscándolos dentro de `dist/`, y ahí estaban.

La solución es un plugin de `vite.config.ts` que sustituye el módulo por uno
vacío al construir para producción. **Regla: cualquier dato de ejemplo se
verifica buscándolo dentro de `dist/` después del build.** Si aparece, viaja.

## Borrador y publicado, por módulo y por lección

> Marco, 2026-07-30: *"si yo entro en un módulo, quiero un switch que esté en
> borrador o publicado. Si está publicado, todos los alumnos lo pueden ver. La
> misma en las lecciones."*

- Columnas nuevas `modules.published` y `lessons.published`, **por defecto
  `true`**: nada de lo que ya existía cambió de estado.
- El alumno no ve los borradores, y eso lo garantiza la base. Un módulo en
  borrador **se lleva sus lecciones con él** aunque estén publicadas: si no, el
  alumno vería lecciones sueltas sin su módulo.
- Verificado simulando al alumno real dentro de una transacción revertida: con
  el módulo 2 en borrador veía **1 módulo de 2**; al republicarlo, los dos.
- Se quitó a la vez el interruptor de la formación entera (*"obviamente lo
  tienen que ver los alumnos, las formaciones que están aquí son para eso"*).
  Lo que se publica u oculta es el contenido, no el contenedor.
- La copia de una lección nace **en borrador**: nadie quiere que a sus alumnos
  les aparezca de golpe una lección llamada "(copia)".

## Otras cosas que Marco mandó quitar el 2026-07-30

| Qué | Por qué |
|---|---|
| Campo **"Duración"** de la lección | *"Si se rellena automáticamente con el vídeo, ¿para qué está ahí?"*. Encima no se rellenaba sola: había que escribirla a mano. Ahora se **mide del propio archivo** al subirlo (el navegador lee la cabecera del vídeo), es exacta y no depende de que Bunny termine de procesar |
| Desplegable **"Mover a otro módulo"** | *"Por algo está el drag and drop"*. Ahora se arrastra la lección de un módulo a otro |
| La palabra **"Contenido"** en la lección | Había una pestaña y un campo con el mismo nombre, y Marco preguntó qué era. Es **la descripción**: el texto que el alumno lee debajo del vídeo. Ahora se llama así, y lo dice debajo del campo |
| **Portada por enlace** | *"El objetivo es que tú crees la portada, no nosotros"*. Ahora se sube el archivo (al bucket `formations`, que ya existía desde el primer día). Hasta 5 MB |

### El fallo de navegación que quedaba

Al entrar en los ajustes o en un módulo **no había forma de volver al resumen**
sin salir del editor y entrar otra vez. Arreglado con dos salidas que no se
mueven nunca: el botón **"Resumen y alumnos"** en lo alto de la columna
izquierda, y el nombre de la formación en la barra de arriba.

**Y un fallo que solo se veía en el teléfono:** el resumen vive en la columna
derecha, que en móvil no existe. Tocar el botón no hacía absolutamente nada.
Ahora abre la hoja inferior, igual que un módulo. **Aprendizaje: en esta pantalla
de dos columnas, todo lo que se añada a la izquierda hay que probarlo a 375px,
porque la columna derecha desaparece.**

---

## Cambios versionados

### 2026-07-30 — Seguimiento de alumnos, borrador/publicado y limpieza
Panel de métricas con la curva de abandono, interruptor borrador/publicado por
módulo y lección (con su candado en la base), formaciones cerradas a tres,
vuelta al resumen siempre a la vista, duración automática, arrastre entre
módulos, portada por subida y "Contenido" renombrado a "Descripción".
Migración `20260730120000_borrador_publicado_y_metricas.sql`.
Verificado en local a 1280 y 375 con sesión real, y en la base simulando al
alumno. Ver también SOP [`producto/04`](04-protocolo-trabajo-agente.md) REGLA #14,
que nació en este mismo bloque.

### 2026-07-29 — Creación
El Estudio publicado. Diseño elegido por panel de jueces, construido sobre los
arreglos de raíz del mismo día (SOP 55 y SOP 50 v8). Verificado: TypeScript
limpio, build de producción limpio, y las prohibiciones duras comprobadas a
grep sobre el código nuevo.
