# Plantilla · Documento "Cómo se llama cada cosa" (nomenclatura de UI)

Documento visual que enseña **el nombre correcto de cada elemento de una interfaz**
(top bar, sidebar, bottom sheet, toggle, slider, modal, popover, toast, badge, card,
tabla, kanban, stepper, skeleton, gauge, donut… ~78 elementos) con un **mini-mockup
animado** de cada uno, qué es, cuándo se usa y en qué se diferencia en móvil vs
ordenador. Sirve para que cualquiera (cliente, alumno, equipo) pueda pedir cambios de
UI con precisión y que la IA le entienda a la primera.

Es **genérico** (no es de ningún producto concreto) y **re-brandeable**: cambias unos
pocos tokens y adopta la marca de tu proyecto.

Incluye de serie:
- **Toggle Ordenador / Móvil**: cada elemento se ve como se ve en cada plataforma.
- **Barra de progreso de scroll** superior (sin lag: `ref` + `requestAnimationFrame`).
- **Mapa de secciones** a la derecha (en pantallas anchas) para navegar y ubicarse.
- **Fondo cósmico** animado (aurora + estrellas con parallax de ratón).

---

## 1. Ficheros

| Archivo | Qué es |
|---|---|
| `NomenclaturaDoc.tsx` | El documento (datos + layout + toggle + secciones). Export principal: `NomenclaturaDoc`. |
| `NomenclaturaMocks.tsx` | Los ~78 mini-mockups (CSS/SVG). El elemento nombrado se resalta con el acento. |
| `fx.tsx` | `CosmicBg` (fondo), `ScrollProgress` (barra), `Reveal` (animación al entrar). |
| `SectionMap.tsx` | El mapa de secciones lateral. |
| `theme.ts` | **Los 4 colores de marca en JS.** El sitio nº1 que tocas al rebrandear. |
| `README.md` | Esto. |

---

## 2. Requisitos

- **React 18+** (usa hooks y, si es Next.js App Router, la directiva `'use client'` ya está puesta).
- **Tailwind CSS** (los componentes usan clases de Tailwind con tokens semánticos).
- **framer-motion** (`npm i framer-motion`) para las animaciones.

Si tu proyecto NO usa Next.js: borra las líneas `'use client'` (o déjalas, otras
herramientas las ignoran). No hay ninguna otra dependencia de Next.

---

## 3. Instalar

1. Copia la carpeta `ui-nomenclatura-doc/` dentro de tu proyecto.
2. `npm i framer-motion`
3. Define los tokens de marca (paso 4). Sin eso, el texto y el fondo salen sin color.

---

## 4. Rebrandear (lo único que tienes que tocar)

### Paso 1 · `theme.ts` (colores en JS)
Abre `theme.ts` y cambia los 4 valores por los de tu marca:

```ts
export const ACCENT = '#C2A665'        // tu acento principal
export const ACCENT_SOFT = '#E1CD91'   // una versión más clara (degradados/brillos)
export const ACCENT_RGB = '194, 166, 101' // el RGB de ACCENT (para transparencias)
export const SECONDARY = '#8a4ed8'     // color secundario (2ª aurora del fondo)
```

### Paso 2 · Tokens de color de Tailwind
Los componentes usan estos **tokens semánticos**. Defínelos en tu `tailwind.config`
con los valores de tu marca (a la derecha van los de ejemplo, cámbialos):

```js
// tailwind.config.{js,ts} -> theme.extend
colors: {
  accent:        '#C2A665',   // = ACCENT
  'accent-soft': '#E1CD91',   // = ACCENT_SOFT
  secondary:     '#8a4ed8',   // = SECONDARY
  canvas:        '#0B0B12',   // fondo de la página (oscuro)
  ink:           '#F4F4FA',   // texto principal (máximo contraste)
  'ink-soft':    '#D4D4DC',   // texto de cuerpo
  'ink-muted':   '#9A9AA6',   // metadatos / etiquetas
},
fontFamily: {
  display: ['TU_FUENTE_TITULARES', 'ui-sans-serif', 'system-ui'],
  body:    ['TU_FUENTE_TEXTO', 'ui-sans-serif', 'system-ui'],
},
```

> Regla de oro del original: **contraste alto**. El texto va con la escala sólida
> `ink / ink-soft / ink-muted` (nunca opacidad de blanco), sobre `canvas` oscuro,
> con superficies elevadas visibles. Mantén esa jerarquía y se ve bien sí o sí.

### Paso 3 · Utilidades custom (una vez, en tu CSS global)
El documento usa 4 utilidades que no vienen en Tailwind. Pega esto en tu CSS global
(ajusta los valores a tu marca):

```css
@layer utilities {
  /* Superficie de las cards: fondo elevado visible + borde + sombra */
  .surface-elevated {
    background-color: #16161A;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.7);
  }
  /* Etiqueta pequeña en mayúsculas */
  .text-eyebrow {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
  }
  /* Título con degradado de acento */
  .text-gradient-accent {
    background-image: linear-gradient(120deg, #C2A665, #E1CD91);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  /* Safe-area móvil (opcional; si no las defines, no hacen nada) */
  .safe-pt { padding-top: env(safe-area-inset-top); }
  .safe-pb { padding-bottom: env(safe-area-inset-bottom); }
  .safe-px { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
}
```

### Paso 4 · Fuentes
Ya cubierto en el `fontFamily` del paso 2: mapea `display` (titulares) y `body`
(texto) a tus tipografías.

### Paso 5 · Hex sueltos (find/replace en la carpeta)
Dentro de algunos mockups concretos hay colores escritos a mano. Haz find/replace
en toda la carpeta para que todo quede con tu marca:

| Buscar | Reemplazar por | Qué es |
|---|---|---|
| `#C2A665` | tu `ACCENT` | acento (queda 1, en `theme.ts`) |
| `#E1CD91` | tu `ACCENT_SOFT` | acento claro (~4 usos) |
| `#8a4ed8` | tu `SECONDARY` | secundario (~3 usos) |
| `194,166,101` | el RGB de tu acento | acento con transparencia (~19 usos) |

### Paso 6 · El botón "Volver"
`NomenclaturaDoc` acepta una prop `backHref` (por defecto `'/'`). Pásale la ruta a
la que debe volver:

```tsx
<NomenclaturaDoc backHref="/tu-ruta-de-vuelta" />
```

---

## 5. Usar

```tsx
import { NomenclaturaDoc } from './ui-nomenclatura-doc/NomenclaturaDoc'

export default function Page() {
  return <NomenclaturaDoc backHref="/recursos" />
}
```

---

## 6. Prompt listo para pegar (para la IA del otro proyecto)

> Te paso una plantilla en `ui-nomenclatura-doc/` (React + Tailwind + framer-motion):
> un documento visual de nomenclatura de interfaces con ~78 elementos, cada uno con
> su mini-mockup animado. Está hecho para adaptarse a la marca del proyecto.
>
> Adáptalo a NUESTRO branding sin tocar el contenido (los nombres y descripciones de
> los elementos se quedan igual). Concretamente:
> 1. En `theme.ts`, pon nuestros colores: `ACCENT`, `ACCENT_SOFT`, `ACCENT_RGB`, `SECONDARY`.
> 2. En `tailwind.config`, define los tokens `accent`, `accent-soft`, `secondary`,
>    `canvas`, `ink`, `ink-soft`, `ink-muted` con nuestros valores, y `fontFamily.display`
>    / `fontFamily.body` con nuestras tipografías.
> 3. En el CSS global, añade las utilidades `surface-elevated`, `text-eyebrow`,
>    `text-gradient-accent` y `safe-*` (hay un snippet en el README) con nuestros valores.
> 4. Find/replace en la carpeta de los hex sueltos: `#C2A665`, `#E1CD91`, `#8a4ed8` y
>    `194,166,101` por los de nuestra marca.
> 5. Monta la página en la ruta que decidamos y pásale `backHref` a nuestra ruta de vuelta.
> 6. Respeta la regla de contraste alto: texto con la escala `ink/ink-soft/ink-muted`
>    sobre `canvas` oscuro, cards con superficie elevada visible. Verifica que nada se
>    corte ni se desborde en móvil (375px) ni en escritorio (1280px).
>
> Cuando termines, dime en qué ruta lo montaste para revisarlo.

---

## 7. Sobre el contenido

Los nombres y descripciones de los elementos son **genéricos y reutilizables tal
cual** en cualquier proyecto. Si tu producto llama a algo distinto, edita el texto
en el array `FAMILIAS` de `NomenclaturaDoc.tsx` (cada elemento es
`{ kind, es, en, what, when, diff? }`).

Origen: extraído del kit "Vibe Coding" de un SaaS con brandkit oscuro + acento
dorado. Aquí va desacoplado de esa marca para que sea tu punto de partida.
