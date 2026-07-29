---
name: formacion-visual
description: "Convierte un documento de formación (un .md del Knowledge) en una página visual de Capital Hub con el estilo oficial de la formación IA Integrator: fondo #0F0F12, verde de marca, Inter Tight, entrada escalonada, reveals al scroll y diagramas que se dibujan solos. Se activa cuando Marco pide construir, rehacer o actualizar cualquier página de formación, entrenamiento, manual o material de presentación. También cuando pide 'ponlo bonito como los entrenamientos' o 'la versión visual de este documento'. NUNCA se improvisa el diseño de una página de formación: se usa esta skill."
---

# Skill · Formación visual

> Todas las páginas de formación de Capital Hub se ven igual. Este documento es el contrato.
> Si una página de formación no sale de aquí, está mal hecha.

## Hay DOS caminos, y este documento manda en los dos

Desde 2026-07-29 una página de formación se puede construir de dos maneras:

| Camino | Quién | Cómo |
|---|---|---|
| **A mano** | Yo (el agente) | Componente React montado con el kit. Es el resto de este documento. |
| **Desde el software** | El formador, solo | Sube su PDF, su `.md` o pega texto en la App, y sale una presentación con este mismo estilo |

**El estilo no se decide dos veces.** El camino del software no genera HTML ni código: genera un **documento de bloques** que un renderer pinta con **este mismo kit**. Por eso una presentación que hace un formador un martes y una guía que monto yo dos meses después salen idénticas.

Consecuencia práctica: **si cambia una pieza del kit, cambia en tres sitios o en ninguno.** Ver "El contrato de bloques" abajo.

---

## Regla número CERO: esto vive en la App, no en el OS

**¿La va a ver un alumno? Entonces va en la App** (`capital-hub-app`), nunca en el OS. Es la REGLA DE ORO del SOP `producto/02` y se ha roto ya dos veces (2026-07-02 y 2026-07-24), las dos veces construyendo la formación en el OS.

**Antes de crear el primer archivo:** abrir el repo de la App y comprobar si la guía **ya existe** (`web/src/features/guides/registry.tsx`). En julio de 2026 se rehizo en el OS material que ya estaba portado a la App.

---

## Regla número uno

**El documento del Knowledge es la fuente. La página es su reflejo.**

- El texto vive en `docs/sops/<cuadrante>/<carpeta>/NN-*.md`, con frontmatter `title` y `order`.
- La página no inventa contenido, no resume por su cuenta y no añade ejemplos que no estén en el documento.
- Si el texto cambia, se cambia **en el `.md` primero** y después en el componente, en el mismo bloque de trabajo.
- Si al montar la página detectas que falta algo o que algo no se entiende, **no lo arregles solo en la página**: dilo y arréglalo en los dos sitios.

---

## Las dos reglas duras del proyecto que aquí se rompen sin querer

| Regla | Qué significa aquí |
|---|---|
| **REGLA #7** (SOP `producto/04`) | Cero guion largo. Ni en el `.md`, ni en el copy de la página, ni en los comentarios del código. |
| **REGLA #8** (SOP `producto/04`) | Cero emojis. Si el documento original trae un emoji de advertencia, se convierte en un bloque `<Warn>`. Si trae uno decorativo, se sustituye por un icono de `lucide-react`. |

---

## Dónde vive todo (repo de la App)

```
web/src/features/guides/
  kit/fx.tsx        EL MOTOR: atmósfera, keyframes, hook de scroll. No se toca sin motivo.
  kit/kit.tsx       LAS PIEZAS: Hero, Cards, Steps, Timeline, Warn, Toc, NodeLine...
  <clave>/          Una carpeta por guía (partida en partes si pasa de 500 líneas)
  registry.tsx      guide_key -> componente

web/src/pages/training/
  FormationHubPage.tsx   El hub donde se agrupan los recursos por tipo
  ResourceViewer.tsx     El visor: pone el header, el volver y le inyecta `nav` a la guía
web/src/lib/nav-origen.ts  Volver al sitio exacto (ruta + scroll)
```

**El texto fuente** sigue en el Knowledge del OS: `docs/sops/producto/<carpeta>/NN-*.md`.

**Nunca se escribe CSS nuevo en una guía.** Si hace falta una pieza que no está, **se añade al kit** y desde ahí la usan todas.

**Una guía no conoce rutas ni ids.** Recibe `nav` (`GuiaNav`) con `abrirGuia(guideKey)` y `volverAlHub()`. Si necesita llevar a otro sitio, se amplía `GuiaNav`, no se mete un `<Link>` a pelo.

## Publicar una guía nueva

1. Componente en `features/guides/<clave>/`, montado con el kit.
2. Registrarlo en `registry.tsx` con su `guide_key`.
3. Crear la fila en `resources` (`type='GUIDE'`, `guide_key`, `formation_id`, `display_order`) y enlazarla a sus lecciones.
4. El hub, el visor y el panel de admin ya funcionan solos: no hay que tocarlos.

---

## El sistema visual (no negociable)

### Color

| Uso | Valor |
|---|---|
| Fondo de página | `#0F0F12` |
| Superficie de tarjeta | `#141418` · variante suave `#131316` |
| Superficie de código | `#0C0C0F` |
| Hairline (bordes) | `#2A2D34` · suave `#1F2126` · pie `#1C1D22` |
| Texto principal | `#F5F6F7` y `white` en titulares |
| Texto secundario | `#C7CBD1` → `#9CA3AF` → `#7B818C` → `#6B7280` |
| **Verde de marca** | `#22C55E` |
| **Verde de iconos** | `#4ADE80` |
| Superficie verde (lo bueno, lo importante) | fondo `#101710`, borde `#24462F` |
| Ámbar SOLO para avisos | icono `#E5B567`, fondo `#17150F`, borde `#3A2F1E` |

**Prohibido cualquier otro color.** Nada de violeta, cian, rosa ni degradados de colores. Base monocroma más verde. El ámbar existe únicamente dentro de `<Warn>`.

### Iconos prohibidos

- **`Sparkles` (la estrellita de lucide) está PROHIBIDO.** Marco lo vetó el 2026-07-24: es el icono genérico de "IA" y no encaja con el brandkit. No se usa en ninguna guía, hub, tarjeta de recurso ni eyebrow. Si al portar código ajeno viene con `Sparkles`, se sustituye por un icono que signifique lo que representa (una guía → `BookOpen`, una rama → `GitBranch`, etc.).
- Regla general: el icono tiene que *significar* algo del contenido, no ser decorativo genérico. Nada de estrellitas, destellos ni chispas.

### Tipografía

- **Titulares**: clase `font-display`, `font-medium`, `tracking-[-0.03em]` en el hero y `-0.01em` en los `<Lead>`.
- **Cuerpo**: la fuente por defecto, tamaños `15px` y `16px`, `leading-relaxed`.
- **Código, nombres de archivo, comandos y diagramas**: clase `font-mono`. **Nunca** `style={{fontFamily}}` a pelo: en la App esa variable CSS no existe.
- **Prohibido**: mayúsculas con letter-spacing ancho en cuerpo de texto. Solo se usan en las etiquetas pequeñas de sección (`tracking-[0.12em]`, tamaño 12-13px). Es la REGLA de tipografía normal y legible.

### Motion

Ya está resuelto en `kit/fx.tsx`. Se usa así:

- `vc-load` con `animationDelay` escalonado: lo que se ve al cargar.
- `vc-line`: cada línea del titular sube con clip. La última línea va en verde.
- `data-reveal` + `vc-reveal`: aparece al llegar al scroll. **Se pone en casi todo.**
- `vc-node-1..6` dentro de un `data-reveal`: los elementos entran en secuencia.
- `vc-draw` en un `<path>`/`<line>` con `pathLength={1}`: la línea se dibuja sola.
- Todo degrada con `prefers-reduced-motion`. No lo rompas.

---

## Las piezas del kit

Importar siempre de `../kit/kit`.

| Pieza | Para qué |
|---|---|
| `GuiaPage` | Contenedor de la guía: atmósfera, motion y ancho. Toda guía empieza aquí. **No pone header ni botón de volver**: eso lo pone el `ResourceViewer` |
| `Hero` | Portada de la página: eyebrow, titular en 2 líneas, entradilla y cue de scroll |
| `SectionHead` | El separador numerado de sección. Lleva `id` para el índice |
| `Section` | Contenedor con el respiro correcto entre secciones |
| `Lead` | La frase grande que abre una sección. Una idea, no un párrafo |
| `Text` / `Muted` | Párrafo normal / párrafo de apoyo, más apagado |
| `Cards` | 2 o 3 tarjetas con icono. Para conceptos hermanos |
| `Steps` | Pasos numerados en caja. Para procedimientos |
| `Timeline` | Línea de tiempo vertical. Para secuencias y recorridos |
| `Rules` | Reglas con barra verde. Para listas de "esto no se salta" |
| `Warn` | Aviso. **Sustituye a los emojis de advertencia del original** |
| `Quote` | La frase que hay que recordar de la sección |
| `Split` | Comparación a dos caras: mal/bien, sin/con, se pierde/se conserva |
| `Terms` | Tabla de dos columnas: término y definición, tú y la IA, skill y qué hace |
| `Code` | Bloque de código o comando. Dos o tres líneas, nunca un muro |
| `CodeLine` | **Una línea de código suelta** dentro de una tarjeta o comparación. Obligatoria: un `<p className="font-mono">` a pelo se sale de la caja |
| `Mono` | Un término técnico dentro de una frase |
| `Chips` | Fila de etiquetas cortas: vocabulario, comandos |
| `Flow` | Resumen de un recorrido en una línea mono |
| `NodeLine` | Diagrama horizontal de 2 a 4 nodos con la línea que se dibuja |
| `Chain` | Cajas encadenadas con flecha entre ellas |
| `Closing` | El cierre de la página, con botón al siguiente paso |
| `Toc` | Índice lateral que se sigue solo. **Obligatorio si hay más de 8 secciones** |

---

## El contrato de bloques (el camino del software)

Cuando la presentación la genera el formador desde la App, el material NO se convierte en código: se convierte en un **documento de bloques**, y el renderer lo pinta con las piezas del kit de arriba.

Se hace así a propósito, por tres motivos:

1. **El diseño no se puede desviar.** Por mucho que cambie el texto, lo pinta el kit.
2. **Editar el texto es editar un campo**, no tocar código. Por eso existe el editor rápido de texto.
3. **No se renderiza HTML de nadie**, así que no hay hueco por donde colar nada.

### Dónde vive

| Pieza | Archivo (repo de la App) |
|---|---|
| El contrato y el validador | `web/src/features/presentaciones/documento.ts` |
| El mapa de iconos permitidos | `web/src/features/presentaciones/iconos.ts` |
| El renderer (bloque → pieza del kit) | `web/src/features/presentaciones/Presentacion.tsx` |
| El generador (material → documento) | `supabase/functions/api/handlers/presentaciones.ts` |
| Dónde se guarda | `resources` con `type='PRESENTACION'`, el documento en `doc` |

### Los bloques

Cada bloque es una pieza del kit. La equivalencia es exacta:

| Bloque | Pieza del kit | Para qué |
|---|---|---|
| `hero` | `Hero` | Portada. Una vez, la primera |
| `seccion` | `SectionHead` | Cabecera numerada. Agrupa lo que va detrás |
| `titular` | `Lead` | La frase que abre la sección |
| `texto` / `apunte` | `Text` / `Muted` | Párrafo / párrafo de apoyo |
| `cita` | `Quote` | La frase que hay que recordar |
| `aviso` | `Warn` | Advertencia. Sustituye a los emojis del original |
| `tarjetas` | `Cards` | Conceptos hermanos |
| `pasos` | `Steps` | Procedimiento en orden |
| `cronologia` | `Timeline` | Secuencia en el tiempo |
| `reglas` | `Rules` | Lista de "esto no se salta" |
| `etiquetas` | `Chips` | Vocabulario, términos sueltos |
| `tabla` | `Terms` | Término y definición |
| `comparacion` | `Split` | Antes/después, mal/bien. La derecha es la buena |
| `codigo` | `Code` | Comando o archivo |
| `recorrido` | `Flow` | Un camino en una línea |
| `nodos` | `NodeLine` | Diagrama de 2 a 4 nodos |
| `cadena` | `Chain` | Cajas con flecha |
| `cierre` | `Closing` | Cierre. Una vez, la última |

### Los iconos son lista blanca

El generador solo puede elegir de la lista de `documento.ts`. Un icono inventado no llega a pantalla: el validador lo cambia por el de reserva. `Sparkles` **no está en la lista y no puede estar** (regla de arriba).

### La regla de los tres sitios

Añadir, quitar o cambiar la forma de un bloque obliga a tocar **los tres**, en el mismo bloque de trabajo:

1. **El kit** (`kit/kit.tsx`), si la pieza visual es nueva.
2. **El contrato** (`documento.ts`): el tipo, el normalizador y los campos de texto editables.
3. **El renderer** (`Presentacion.tsx`) y **el prompt del generador** (`presentaciones.ts`).
4. Y esta tabla.

Si solo se toca uno, el generador produce algo que el renderer no sabe pintar, o al revés. **Se cae en silencio**, que es el peor fallo posible.

### Qué NO puede tocar el editor de texto

El editor rápido saca los campos de texto del documento y deja cambiarlos. **Solo escribe sobre una clave que ya existía y que ya era texto.** No puede añadir bloques, ni cambiar iconos, ni alterar la estructura. Es estructuralmente incapaz de romper el diseño, no es una cuestión de confiar en el formador.

### Antes de publicar, la revisa el formador

Una presentación recién generada nace como **borrador**: solo la ven quien la creó y los administradores, por RLS, nunca un alumno. El formador la mira, puede pedir arreglos por escrito las veces que haga falta (el generador rehace el documento entero con esos cambios), y solo cuando la acepta pasa a publicada.

---

## El método, paso a paso

### 1. Leer el documento entero

No la mitad. Entero. Hay que saber qué idea abre cada sección antes de decidir cómo se pinta.

### 2. Trocear en secciones numeradas

Una sección del `.md` es una sección de la página, con su `SectionHead` y su `id` (`s0`, `s1`, `s2`...). El número que se muestra es `00`, `01`, `02`. Las secciones sin número (mapas, cierres, resúmenes) se dejan sin la prop `n`: el kit pinta un punto verde en su lugar.

### 3. Elegir la pieza según la FORMA del contenido, no según la longitud

| Si el contenido es... | Se pinta con |
|---|---|
| Dos o tres conceptos hermanos | `Cards` |
| Una definición corta y su explicación | `Terms` |
| Un procedimiento que se hace en orden | `Steps` |
| Una secuencia que ocurre en el tiempo | `Timeline` |
| Un antes contra un después, o mal contra bien | `Split` |
| Un recorrido entre lugares | `NodeLine` o `Chain` |
| Una lista de "esto no se salta" | `Rules` |
| Una advertencia | `Warn` |
| La frase que resume la sección | `Quote` |
| Un comando o un archivo de ejemplo | `Code` |

### 4. Regla del muro de texto

**Nunca más de dos párrafos seguidos sin una pieza visual entre medias.** Si el original tiene cuatro párrafos, tres de ellos son tarjetas, pasos o un diagrama. La formación se lee bajando, no leyendo.

### 5. Dividir el archivo si crece

Máximo 500 líneas por archivo (regla del proyecto). Si un entrenamiento no cabe, se parte en `<nombre>/index.tsx` más `parte-a.tsx`, `parte-b.tsx`, `parte-c.tsx`. El `index` monta el shell, el hero y el índice, y compone las partes.

### 6. Cerrar bien

- `Closing` con el paso siguiente y su botón (via `nav`, no con un enlace a pelo).
- Registrar la guía en `registry.tsx` y crear su fila en `resources`.
- Actualizar el `00-readme.md` de la carpeta del Knowledge y el SOP `producto/51`.

---

## El desbordamiento: lo que SIEMPRE hay que mirar

**Un texto largo sin espacios no tiene por dónde partirse y se sale de su caja.** Le pasa a las líneas de código, las claves, las URLs y los nombres de archivo. Marco lo pilló el 2026-07-24 en la caja "Mal" del Entrenamiento 1 y no se puede repetir.

Está cerrado a nivel de motor (`kit/fx.tsx`), y aun así **hay que comprobarlo en cada pasada**:

```css
.vc-root code, .vc-root pre, .vc-break { overflow-wrap: anywhere; word-break: break-word; }
.vc-root pre { overflow-x: auto; max-width: 100%; }
```

Reglas al escribir:
- Línea de código suelta en una tarjeta o comparación → **`<CodeLine>`**, nunca un `<p className="font-mono">`.
- Bloque de varias líneas → **`<Code>`** (hace scroll horizontal dentro de su caja).
- Cualquier caja con contenido flexible → `min-w-0` en el hijo, o el flex/grid no la deja encoger.

**Comprobación automática** (pegar en la consola del navegador o en el script de Playwright):

```js
[...document.querySelectorAll('*')].filter(el =>
  el.scrollWidth > el.clientWidth + 2 &&
  getComputedStyle(el).overflowX === 'visible' &&
  el.getBoundingClientRect().right > window.innerWidth + 2
)
```

Debe devolver **array vacío**, en escritorio y en móvil (390px).

---

## Checklist antes de dar por hecha una página

Si alguna sale que no, la página no está terminada:

- [ ] Se ha construido **en la App**, y la guía no existía ya allí.
- [ ] El contenido es fiel al `.md`. No hay nada inventado ni nada perdido.
- [ ] Cero emojis y cero guion largo, en la página y en el `.md`.
- [ ] **Cero desbordamiento**: la comprobación de arriba devuelve vacío en escritorio y en móvil.
- [ ] No hay dos párrafos seguidos sin una pieza visual entre medias.
- [ ] Todos los bloques importantes llevan `data-reveal`.
- [ ] Los colores son solo los de la tabla de arriba.
- [ ] Si hay más de 8 secciones, tiene `Toc`.
- [ ] Ningún archivo pasa de 500 líneas.
- [ ] La guía está en `registry.tsx` y tiene su fila en `resources`, y se abre desde el hub.
- [ ] `npx tsc --noEmit -p tsconfig.app.json` pasa en la App.
- [ ] Se ha visto en el navegador, en escritorio **y en móvil**.
- [ ] El `00-readme.md` de la carpeta del Knowledge está al día.

### Si además se tocó el contrato de bloques

- [ ] La pieza está en el **kit**, en el **contrato** (`documento.ts`) y en el **renderer** (`Presentacion.tsx`).
- [ ] El **prompt del generador** (`presentaciones.ts`) la describe con la misma forma exacta.
- [ ] La tabla de bloques de esta skill está al día.
- [ ] Un documento con un bloque desconocido o un icono inventado **no revienta**: el normalizador lo descarta.

---

## Errores que ya se han cometido (no repetirlos)

**Clases de Tailwind construidas con plantillas.** `md:grid-cols-${n}` no existe en el CSS final: Tailwind necesita la clase entera escrita en el código. Se usa un mapa de clases completas.

**Diagramas en ASCII copiados tal cual.** El original usa cajas de texto porque es un `.md`. En la página se convierten en piezas de verdad (`NodeLine`, `Chain`, tarjetas). El `Code` se reserva para comandos y archivos reales.

**Emojis heredados del documento.** Vienen en el texto de origen y se cuelan sin querer. Se barren en la misma pasada, en el `.md` y en la página.

**Páginas con candado de "próximamente".** Si se anuncia algo, se construye. No se publica una tarjeta bloqueada salvo que Marco lo pida.

**Construir en el repo equivocado.** Dos veces se ha hecho la formación en el OS. Va en la App. Y antes de empezar, mirar si la guía ya existe allí.

**Texto sin espacios que se sale de la caja.** Ver la sección de desbordamiento. Se comprueba SIEMPRE, en escritorio y en móvil.

**`position: sticky` que no pega.** Si una cabecera no se queda fija, mirar los ancestros: un `overflow` distinto de `visible` (aunque sea `overflow-x: hidden` en el `body`) crea un contenedor de scroll y rompe el sticky. La solución no es quitar la protección de scroll horizontal: es `overflow-x: clip`, que recorta igual sin crear contenedor.

**Claves de ejemplo con formato real.** Un material de formación que explica qué es una API key suele traer un ejemplo tipo `sk_live_...`. GitHub lo detecta como clave de verdad y **bloquea el push** (protección de secretos). La solución **nunca** es desbloquearlo desde GitHub: se cambia el ejemplo por un placeholder que no pueda confundirse con una clave (`sk_live_ESTO_ES_UN_EJEMPLO_NO_UNA_KEY`). Se cambia **en el `.md` y en la página**, y enseña exactamente lo mismo.

---

## Cambios de esta skill

### 2026-07-29 — El molde pasa a servir a los dos caminos
Antes esta skill solo describía cómo monto yo una guía a mano. Ahora también manda
sobre las presentaciones que genera el formador desde la App, porque las dos cosas
se pintan con el mismo kit. Añadido: la sección "Hay DOS caminos", el contrato de
bloques con la equivalencia bloque a pieza, la lista blanca de iconos, la regla de
los tres sitios y qué no puede tocar el editor de texto. Detonante: Marco pidió que
cualquier formador pueda hacer su presentación desde el software sin pasar por mí,
y que salga siempre igual.

---

## Trabajo en rama

Una guía nueva o una reescritura de contenido **no es un cambio fácil**: se abre rama desde `dev` (`feat/...`) **en el repo de la App**. Un retoque de copy en una guía que ya existe sí puede ir directo a `main`.

Ojo: normalmente el trabajo toca **dos repos** (la App para el código, el OS para el texto del Knowledge y esta skill). Los dos se commitean y se pushean en el mismo bloque.
