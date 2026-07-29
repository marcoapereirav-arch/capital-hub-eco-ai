# SOP 58 · Purga del brandkit antiguo en la App

**Estado:** aplicado en rama `arreglo-entrada-formador` de `App Capital Hub` (sin publicar)
**Fecha:** 2026-07-29
**Manda:** `docs/sops/marketing/brand/01-brandkit-oficial.md`. No hay otra fuente.

---

## Por qué existe este SOP

Marco, tres veces seguidas, sobre la misma pantalla:

> *"Estás usando el diseño antiguo del brandkit, te lo dije antes y NO lo has
> arreglado. ELIMINA DE RAÍZ ESE DISEÑO."*
> *"El ÚNICO brandkit que existe es el que está en el Knowledge y es el ÚNICO
> que vas a usar."*

La causa no era despiste: **la App tenía DOS brandkits a la vez** y los dos se
llamaban igual.

---

## Segunda pasada (2026-07-29, tarde): seguía saliendo el vibe antiguo

Marco, después del primer barrido: *"Todo lo que sea esquinas puntiagudas y todo
ese vibe antiguo, fuera."*

Tenía razón y el error era mío de base: **asumí que "brandkit sobrio" significaba
esquina recta y puse `rounded-none` en media App.** El brandkit vivo
(`src/app/brandkit/version-two.tsx` del OS, la página `/brandkit`) redondea:

| Pieza | Radio |
|---|---|
| Tarjeta, botón, campo | 4px (`rounded-card`) |
| Panel grande, modal, hoja | 8px (`rounded-panel`) |
| Ficha, chip | 2-3px |
| Avatar | círculo |

Y además, valores que yo tenía mal:

- Los bordes NO son `#2A2D34` sólido: son hairlines **translúcidos**
  `rgba(245,246,247,0.1)` (y `0.2` para el borde marcado).
- El texto sobre verde es **`#08130C`** (tinta verde), no el carbón.
- Los grises son `#A6AAB2` y `#7C818A`.
- La curva de movimiento es `cubic-bezier(0.16, 1, 0.3, 1)`, y el botón
  principal al pasar por encima sube 2px y saca sombra verde.
- La tipografía usa TODO el rango: 900 para titulares, 800 sección, 600
  etiquetas y botones, 400 cuerpo. Yo estaba usando 500 para todo.

**Lección: el estilo no se deduce, se lee del brandkit vivo.** Ese archivo es la
fuente; el markdown son las reglas; la skill `brandkit-capital-hub` es el
recordatorio operativo.

## La causa raíz (esto es lo que hay que recordar)

`web/tailwind.config.js` definía `accent: "#FFFFFF"` con el comentario "ÚNICO
acento, monochrome". Es decir: **el token tenía el nombre correcto y el valor
del brandkit viejo.** Cualquier pantalla nueva escrita con `bg-accent` salía
BLANCA creyendo estar usando el brandkit oficial.

Encima, media docena de pantallas ni siquiera usaban tokens: llevaban un objeto
`const C = { bg: '#0F0F12', white: '#FFFFFF', ... }` y `style={{}}` en cada
nodo, más `fontFamily: "'JetBrains Mono'"` con mayúsculas muy espaciadas para
etiquetas de interfaz.

**Lección permanente: el nombre de un token no garantiza su valor.** Antes de
construir sobre `bg-accent`, se abre `tailwind.config.js` y se comprueba.

---

## Qué se hizo

1. **`tailwind.config.js` reescrito** desde el brandkit del Knowledge:
   - `accent` `#FFFFFF` → **`#22C55E`** (verde). `accent-soft` `#4ADE80`.
   - Fuera `accent-glow`, `boxShadow.glow`, `appleGray`, `ultra`, `secondary`.
   - Tipografía: **Inter Tight y nada más** (fuera el stack de fuentes de
     sistema). `JetBrains Mono` queda solo como `font-mono`.
   - Añadida la escala de **cinturones**: `belt-white #F5F6F7`,
     `belt-blue #4F7CC0`, `belt-purple #7B5BA6`, `belt-brown #856046`,
     `belt-black #0F0F12`. Rayas SOLO en la cinta blanca; nunca como color de
     interfaz.
2. **`index.css`**: variables de acento a verde, `font-family` a Inter Tight,
   eliminada la clase `.accent-glow`.
3. **Pantallas barridas** (objeto de colores + `style` + `fontFamily` fuera,
   tokens dentro, esquinas rectas, zonas táctiles de 44px):
   Inicio, Panel Formativo (aula), Comunidad, Mensajes, Entrar, marco de acceso,
   Invitación, 404, Perfil público y el efecto de carga (su anillo era BLANCO y
   ahora es VERDE).
4. **Icono `Sparkles` eliminado** de la pantalla de invitación. Está prohibido en
   todo el producto.

---

## Dónde entra el formador a editar: un WIDGET APARTE

Marco, 2026-07-29: *"El widget es un widget aparte. No es el mismo widget de
'Ver como'. Ese solo lo tengo yo, pero el widget de editar formación tiene que
ser otro aparte del que ya está. Ese está únicamente para los formadores."*

`web/src/features/estudio/WidgetFormador.tsx`. Flotante, **abajo a la
izquierda** (el de "Ver como" vive abajo a la derecha, así que no chocan nunca).
Se monta en `ProtectedRoute`, junto al `Outlet`, para que viaje con todas las
pantallas con sesión. Se esconde solo dentro de `/formador`.

| Quién | Qué ve |
|---|---|
| Formador (ADMIN con `formacion_asignada`) | SOLO su formación. Con una sola, el botón entra directo |
| Super admin | Todas, con su ruta debajo del nombre |
| Alumno o equipo sin permiso | Nada. Ni se pinta ni se consulta |

**Formas ya rechazadas, no volver a ellas:** en Ajustes (arriba), barra ancha
debajo de cada tarjeta, y **tarjeta en el Inicio** (*"quita lo del puto inicio,
que no te lo he pedido"*). El Inicio quedó exactamente como estaba.

## El school NO se toca

Marco: *"nunca te he pedido que rediseñes el school. Deja de perder tokens y
deja de hacer cosas que no te he pedido."* Comunidad, mensajes y aula se quedan
como están. Su rediseño es un trabajo aparte, cuando él lo pida.

---

## Regla que queda viva

Cualquier trabajo visual en la App pasa por la skill `brandkit-capital-hub`, que
a su vez **manda leer el brandkit del Knowledge antes de diseñar**. Si un archivo
que tocas todavía trae diseño antiguo, se deja limpio en esa misma pasada. No se
parchea alrededor.

## El Estudio (pantalla de editar la formación)

Lo que se cambió para que se entienda, no solo para que se vea:

- **La acción principal es lo primero que se ve.** Antes, la única forma de
  crear un módulo era un botón discreto al FINAL de la lista, después de hacer
  scroll. Ahora "Añadir módulo" está arriba, en verde, encabezando la columna de
  contenido. Abajo queda el secundario "Añadir otro módulo al final".
- **El buscador solo aparece con 4 módulos o más.** Antes ocupaba la cabecera
  aunque la formación estuviera vacía.
- **Guía de tres pasos** (módulo, lecciones, vídeo) en el panel derecho, solo
  mientras la formación está vacía. Después desaparece.
- Jerarquía tipográfica real: el nombre de la formación en 900, la ruta como
  kicker verde encima.

Pendiente de verificación con credenciales: las pantallas que exigen sesión
(Estudio y widget) no se han podido mirar en el navegador. Las públicas (Entrar,
404) sí, a 375 y a 1280.


---

## Pasada del 2026-07-29 (noche): quitar, no añadir

Marco, con capturas. Cinco correcciones, y el patrón que hay detrás de cuatro de
ellas: **le estaba metiendo cosas que no pidió.**

1. **"Tipo de módulo" (Técnico / Mentalidad): eliminado.** *"No te lo he
   pedido."* Un módulo se crea y ya. `content_type` sigue en la base con su
   valor por defecto; no se enseña porque no cambia nada de lo que el formador
   va a hacer.
2. **Un solo botón de añadir módulo.** Había el verde arriba y otro "Añadir otro
   módulo al final" abajo. Dos botones para lo mismo confunden. Se queda el de
   arriba.
3. **Bloque "Quién la ve": eliminado.** Dentro vivían "Acceso básico / Acceso
   completo" (niveles de suscripción) y "Abierta a todo el mundo": **resto del
   Stripe falso que ya se borró**, no existen en Capital Hub. Lo único útil
   (publicar u ocultar) sube arriba como un interruptor único que dice su estado
   en palabras: "La ven los alumnos" u "Oculta".
4. **Menos rayas.** *"Hay rayas por todos lados, incluso dos pegadas."* La peor:
   **cada módulo del árbol llevaba `border-b`**, así que con seis módulos había
   seis rayas, y la del último quedaba pegada al `border-t` del bloque de
   material. Regla que queda: **una línea solo cuando cambia una sección de
   verdad**, nunca dos seguidas, y si un bloque ya se distingue por su fondo o
   por su borde propio, no lleva raya.
5. **"Volver" deshacía pasos en vez de salir.** Cada selección de módulo o
   material apilaba una entrada de historial, así que `navigate(-1)` iba
   deshaciendo la edición una a una. Arreglado en dos partes: las selecciones ya
   no apilan historial (`setParams(..., { replace: true })`), y el botón se
   llama **Salir** y devuelve a la pantalla desde la que se entró, que el widget
   y el lápiz dejan dicha en `state.desde` al abrir el editor.

**Regla de fondo: menos bloques, no más.** Antes de añadir una sección al
Estudio, se comprueba que Marco la haya pedido.
