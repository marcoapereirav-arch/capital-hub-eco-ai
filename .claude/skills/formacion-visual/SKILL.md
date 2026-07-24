---
name: formacion-visual
description: "Convierte un documento de formación (un .md del Knowledge) en una página visual de Capital Hub con el estilo oficial de la formación IA Integrator: fondo #0F0F12, verde de marca, Inter Tight, entrada escalonada, reveals al scroll y diagramas que se dibujan solos. Se activa cuando Marco pide construir, rehacer o actualizar cualquier página de formación, entrenamiento, manual o material de presentación. También cuando pide 'ponlo bonito como los entrenamientos' o 'la versión visual de este documento'. NUNCA se improvisa el diseño de una página de formación: se usa esta skill."
---

# Skill · Formación visual

> Todas las páginas de formación de Capital Hub se ven igual. Este documento es el contrato.
> Si una página de formación no sale de aquí, está mal hecha.

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

## Dónde vive todo

```
src/features/formacion-ia-integrator/components/
  formacion-fx.tsx     EL MOTOR: atmósfera, keyframes, hook de scroll. No se toca sin motivo.
  formacion-kit.tsx    LAS PIEZAS: Hero, Cards, Steps, Timeline, Warn, Toc, NodeLine...
  portada.tsx          El índice de la formación
  <entrenamiento>.tsx  Una página por documento

src/app/(public)/formacion/<formacion>/<slug>/page.tsx
```

**Nunca se escribe CSS nuevo en una página.** Si hace falta una pieza que no está, **se añade al kit** y desde ahí la usan todas.

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

### Tipografía

- **Titulares**: `'Inter Tight', sans-serif`, `font-medium`, `tracking-[-0.03em]` en el hero y `-0.01em` en los `<Lead>`.
- **Cuerpo**: `'Inter', sans-serif`, tamaños `15px` y `16px`, `leading-relaxed`.
- **Código, nombres de archivo, comandos y diagramas**: `var(--font-mono)`.
- **Prohibido**: mayúsculas con letter-spacing ancho en cuerpo de texto. Solo se usan en las etiquetas pequeñas de sección (`tracking-[0.12em]`, tamaño 12-13px). Es la REGLA de tipografía normal y legible.

### Motion

Ya está resuelto en `formacion-fx.tsx`. Se usa así:

- `vc-load` con `animationDelay` escalonado: lo que se ve al cargar.
- `vc-line`: cada línea del titular sube con clip. La última línea va en verde.
- `data-reveal` + `vc-reveal`: aparece al llegar al scroll. **Se pone en casi todo.**
- `vc-node-1..6` dentro de un `data-reveal`: los elementos entran en secuencia.
- `vc-draw` en un `<path>`/`<line>` con `pathLength={1}`: la línea se dibuja sola.
- Todo degrada con `prefers-reduced-motion`. No lo rompas.

---

## Las piezas del kit

Importar siempre de `./formacion-kit` (o `../formacion-kit`).

| Pieza | Para qué |
|---|---|
| `FormacionPage` | Shell: atmósfera, cabecera con volver, contenedor y pie. Toda página empieza aquí |
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
| `Mono` | Un término técnico dentro de una frase |
| `Chips` | Fila de etiquetas cortas: vocabulario, comandos |
| `Flow` | Resumen de un recorrido en una línea mono |
| `NodeLine` | Diagrama horizontal de 2 a 4 nodos con la línea que se dibuja |
| `Chain` | Cajas encadenadas con flecha entre ellas |
| `Closing` | El cierre de la página, con botón al siguiente paso |
| `Toc` | Índice lateral que se sigue solo. **Obligatorio si hay más de 8 secciones** |

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

- `Closing` con el paso siguiente y su botón.
- Ruta en `src/app/(public)/formacion/.../page.tsx` con `metadata` (title y description, ambos en español).
- Actualizar la portada de la formación para que la página nueva aparezca.
- Actualizar el `00-readme.md` de la carpeta del Knowledge.

---

## Checklist antes de dar por hecha una página

Si alguna sale que no, la página no está terminada:

- [ ] El contenido es fiel al `.md`. No hay nada inventado ni nada perdido.
- [ ] Cero emojis y cero guion largo, en la página y en el `.md`.
- [ ] No hay dos párrafos seguidos sin una pieza visual entre medias.
- [ ] Todos los bloques importantes llevan `data-reveal`.
- [ ] Los colores son solo los de la tabla de arriba.
- [ ] Si hay más de 8 secciones, tiene `Toc`.
- [ ] Ningún archivo pasa de 500 líneas.
- [ ] Existe la ruta con su `metadata` y la portada enlaza a ella.
- [ ] `npm run typecheck` pasa.
- [ ] Se ha visto en el navegador, en escritorio **y en móvil**.
- [ ] El `00-readme.md` de la carpeta del Knowledge está al día.

---

## Errores que ya se han cometido (no repetirlos)

**Clases de Tailwind construidas con plantillas.** `md:grid-cols-${n}` no existe en el CSS final: Tailwind necesita la clase entera escrita en el código. Se usa un mapa de clases completas.

**Diagramas en ASCII copiados tal cual.** El original usa cajas de texto porque es un `.md`. En la página se convierten en piezas de verdad (`NodeLine`, `Chain`, tarjetas). El `Code` se reserva para comandos y archivos reales.

**Emojis heredados del documento.** Vienen en el texto de origen y se cuelan sin querer. Se barren en la misma pasada, en el `.md` y en la página.

**Páginas con candado de "próximamente".** Si se anuncia algo, se construye. No se publica una tarjeta bloqueada salvo que Marco lo pida.

**Claves de ejemplo con formato real.** Un material de formación que explica qué es una API key suele traer un ejemplo tipo `sk_live_...`. GitHub lo detecta como clave de verdad y **bloquea el push** (protección de secretos). La solución **nunca** es desbloquearlo desde GitHub: se cambia el ejemplo por un placeholder que no pueda confundirse con una clave (`sk_live_ESTO_ES_UN_EJEMPLO_NO_UNA_KEY`). Se cambia **en el `.md` y en la página**, y enseña exactamente lo mismo.

---

## Trabajo en rama

Una página de formación nueva o una reescritura de contenido **no es un cambio fácil**: se abre rama desde `dev` (`feat/...`). Un retoque de copy en una página que ya existe sí puede ir directo a `main`.
