/**
 * Brandkit del CRM — ahora escrito con los TOKENS del tema (actualizado 2026-08-07).
 *
 * POR QUE EXISTIA CON LOS COLORES A MANO, Y POR QUE YA NO.
 * Se escribio cuando los tokens globales del OS no eran el brandkit: `--accent` valia
 * #2A2D34 (gris grafito) y `--font-heading` empezaba por `-apple-system`, asi que escribir
 * `bg-accent` pintaba GRIS creyendo pintar verde. **Eso se arreglo**: hoy `--accent` y
 * `--primary` valen el verde #22C55E con tinta #08130C, y las dos familias tipograficas
 * apuntan a Inter Tight de verdad. Ver `docs/sops/producto/47`.
 *
 * Como los valores del tema y los que habia aqui a mano son los mismos, el cambio a tokens
 * no repinta la pantalla: deja UNA sola forma de pintar en todo el OS, y el dia que cambie
 * la marca el CRM cambia con ella en vez de quedarse con el color viejo grabado.
 *
 * COMO SE ESCRIBE AQUI
 *  - En `className` van los tokens del tema, siempre LITERALES, nunca con plantillas
 *    (`border-[${x}]`). Tailwind lee el codigo fuente como texto y solo genera las clases
 *    que ve escritas enteras; una clase montada en tiempo de ejecucion no existe en el CSS
 *    y el elemento sale sin estilo.
 *  - En `style` va lo que es un COLOR, no una clase: ahi se apunta a la variable del tema
 *    (`var(--primary)`) o se calcula sobre ella (`color-mix(...)`). Nunca un color a mano.
 *  - Solo existen los nombres que estan en el bloque `@theme` de `src/app/globals.css`. No
 *    hay `bg-carbon`, `bg-panel`, `text-offwhite`, `border-line` ni `text-deepmute`. Y ojo:
 *    `muted` es una SUPERFICIE gris, el token de TEXTO secundario es `muted-foreground`.
 *
 * LA UNICA EXCEPCION: el ambar de aviso. Como clase existe (`text-warn`, `border-warn/35`)
 * porque el tema declara `--color-warn`, pero ese bloque es `@theme inline` y por eso
 * Tailwind mete el valor dentro de la clase en vez de publicar la variable: en tiempo de
 * ejecucion `var(--color-warn)` NO resuelve. Por eso el ambar sigue escrito una sola vez,
 * en `C.warn`, y todo lo que necesite ese color en `style` lo toma de ahi.
 *
 * Fuente: `docs/sops/marketing/brand/01-brandkit-oficial.md` + `src/app/brandkit/version-two.tsx`.
 */

// --- Color -------------------------------------------------------------------
/**
 * La paleta, para lo poco que se pinta por `style` y no por clase.
 *
 * Cada entrada apunta al token del tema, no a un color. Si lo que estas escribiendo lleva
 * `className`, NO uses esto: escribe la clase (`text-muted-foreground`, `bg-card`...). Esto
 * es solo para cuando el color tiene que ir en la propiedad `style`.
 *
 * Los grises secundario y terciario caen los dos en `muted-foreground`, y los dos verdes en
 * `primary`: el tema tiene un token por SIGNIFICADO, no un tono por cada matiz.
 */
export const C = {
  carbon: "var(--background)",   // fondo de pagina
  panel: "var(--card)",          // superficie de tarjeta
  panelSoft: "var(--popover)",   // superficie elevada / hover
  line: "color-mix(in oklab, var(--foreground) 10%, transparent)",       // hairline
  lineStrong: "color-mix(in oklab, var(--foreground) 20%, transparent)", // hairline marcado
  text: "var(--foreground)",           // texto principal
  muted: "var(--muted-foreground)",    // texto secundario
  deepMute: "var(--muted-foreground)", // texto terciario
  accent: "var(--primary)",            // acento (unico color de marca)
  accentSoft: "var(--primary)",        // verde claro: iconos, cifras, enlaces
  greenInk: "var(--primary-foreground)", // tinta sobre verde
  accentSurface: "color-mix(in oklab, var(--primary) 5%, transparent)",  // superficie verde
  accentBorder: "color-mix(in oklab, var(--primary) 30%, transparent)",  // borde de superficie verde
  /* Ambar de aviso. El unico color escrito aqui, y a proposito: el tema lo declara dentro
     de `@theme inline`, asi que la clase `text-warn` si existe pero la variable NO llega al
     navegador. Para `className` se usa `text-warn` / `border-warn/35`; esta constante es
     solo para `style`, y es la unica copia del valor en todo el CRM. */
  warn: "var(--warn)",
} as const

/**
 * Inter Tight de verdad: la variable propia del layout raiz, que el stack Apple-first
 * de `--font-heading` no pisa. Se aplica por `style` en la raiz de cada arbol (incluidos
 * los overlays, que se portalean al body y por tanto NO heredan del CRM).
 */
export const FONT = "var(--font-inter-tight), 'Inter Tight', sans-serif"

// --- Clases reutilizables ----------------------------------------------------

/** Superficie de tarjeta: panel + hairline + radio de 4px. */
export const CARD =
  "rounded-lg border border-border bg-card"

/** Panel grande / modal: radio de 8px. */
export const PANEL =
  "rounded-xl border border-border bg-card"

/** Campo de texto y desplegable. 44px de alto: zona tactil minima. */
export const FIELD =
  "h-11 md:h-9 rounded-lg border border-border bg-popover px-3 " +
  "text-base md:text-sm text-foreground placeholder:text-muted-foreground " +
  "focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/45 " +
  "transition-colors"

/** Accion principal: verde con tinta oscura. Una sola por pantalla. */
export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 min-h-11 rounded-lg " +
  "bg-primary px-4 text-sm font-semibold text-primary-foreground " +
  "transition-[transform,box-shadow,background-color] duration-200 " +
  "hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_8px_20px_-8px_var(--ring)] " +
  "active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0"

/** Accion secundaria: borde, sin relleno. */
export const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 min-h-11 rounded-lg " +
  "border border-border bg-transparent px-4 text-sm font-semibold " +
  "text-muted-foreground transition-colors hover:border-ring " +
  "hover:bg-popover hover:text-foreground"

// --- Stages ------------------------------------------------------------------
/**
 * Como se pinta cada stage del funnel.
 *
 * El brandkit solo admite monocromo + el verde de marca (el ambar queda reservado a avisos).
 * Antes cada stage tenia su neon (cian, violeta, naranja, rojo): eso es el diseno viejo y
 * ademas no significaba nada, era color por color. Ahora el color DICE algo:
 *
 *   - avance del funnel   -> gris que se va aclarando segun se acerca a la venta
 *   - `alumno` (la venta) -> VERDE. Es el unico acento, y salta a la vista
 *   - `no_show`           -> ambar, que es exactamente un aviso
 *   - `perdido`           -> el mas apagado de todos, se va al fondo
 *
 * COMO SE ESCRIBE EL AVANCE CON TOKENS: el gris que se aclara es el token del texto con
 * cada vez menos transparencia (`border-foreground/10` -> `/14` -> `/20` -> `/28`). No hay
 * un token por peldano, y no hace falta: el peldano ES la transparencia.
 *
 * Stages canonicos en `docs/sops/producto/13-contactos-pipeline.md`. Al anadir uno nuevo
 * hay que anadirlo TAMBIEN aqui (paso 5 del checklist de ese SOP).
 */
export type StageTone = {
  /** Clases del chip de stage. Literales, nunca montadas con plantilla. */
  chip: string
  /**
   * Color de la linea superior de la columna del kanban. Va por `style`, asi que aqui no
   * se escribe una clase sino la variable del tema, o un calculo sobre ella.
   */
  rule: string
}

/** El gris del avance, calculado sobre el token del texto. Para `style`, no para clases. */
const avance = (porcentaje: number) =>
  `color-mix(in oklab, var(--foreground) ${porcentaje}%, transparent)`

export const STAGE_TONE: Record<string, StageTone> = {
  dm: {
    chip: "border-foreground/10 bg-popover text-muted-foreground",
    rule: avance(10),
  },
  lead: {
    chip: "border-foreground/14 bg-popover text-muted-foreground",
    rule: avance(14),
  },
  lead_cualificado: {
    chip: "border-foreground/20 bg-popover text-foreground",
    rule: avance(20),
  },
  agendado: {
    chip: "border-foreground/28 bg-popover text-foreground",
    rule: avance(28),
  },
  seguimiento: {
    chip: "border-foreground/14 bg-popover text-muted-foreground",
    rule: avance(14),
  },
  alumno: {
    chip: "border-primary/30 bg-primary/5 text-primary",
    rule: "var(--primary)",
  },
  no_show: {
    chip: "border-warn/35 bg-popover text-warn",
    rule: `color-mix(in oklab, ${C.warn} 45%, transparent)`,
  },
  perdido: {
    chip: "border-foreground/8 bg-transparent text-muted-foreground",
    rule: avance(6),
  },
}

export const STAGE_TONE_FALLBACK: StageTone = {
  chip: "border-foreground/14 bg-popover text-muted-foreground",
  rule: avance(14),
}

export function stageTone(stage: string | null | undefined): StageTone {
  if (!stage) return STAGE_TONE_FALLBACK
  return STAGE_TONE[stage] ?? STAGE_TONE_FALLBACK
}

/**
 * Orden en que se enseña el funnel, de la entrada al final.
 * Sale del SOP `producto/13`: lead -> agendado -> seguimiento -> no_show -> alumno -> perdido,
 * con `dm` al principio (solo pipeline webinar) y `lead_cualificado` detras de `lead`
 * (solo pipeline del test).
 *
 * Sirve para ordenar la lista de stages de la vista LISTA, que mezcla los stages de TODOS
 * los pipelines y por tanto no puede heredar el orden de ninguno en concreto.
 */
export const STAGE_ORDER = [
  "dm",
  "lead",
  "lead_cualificado",
  "agendado",
  "seguimiento",
  "no_show",
  "alumno",
  "perdido",
] as const

/** Posicion en el funnel. Lo desconocido va al final, no en medio. */
export function stageRank(key: string): number {
  const i = (STAGE_ORDER as readonly string[]).indexOf(key)
  return i === -1 ? STAGE_ORDER.length : i
}
