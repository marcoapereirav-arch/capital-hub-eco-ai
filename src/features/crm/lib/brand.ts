/**
 * Brandkit del CRM — valores EXPLICITOS.
 *
 * Por que explicitos y no tokens (`bg-accent`, `font-heading`): los tokens globales del OS
 * NO son el brandkit. Comprobado en `globals.css`: `--accent` vale #2A2D34 (gris grafito)
 * y `--font-heading` empieza por `-apple-system`, asi que en un Mac renderiza SF Pro y no
 * Inter Tight. Escribir `bg-accent` aqui pintaria GRIS creyendo pintar verde.
 * Ver `docs/sops/producto/47-reglas-ui-contraste-legibilidad.md` (seccion "Los tokens del OS
 * NO son el brandkit"): mientras esos tokens no se cambien (es un trabajo aparte, lo decide
 * Marco, porque repinta el OS entero), una pantalla que quiera el brandkit de verdad pone
 * los valores a mano.
 *
 * REGLA AL EDITAR ESTE ARCHIVO: las clases se escriben LITERALES, nunca con plantillas
 * (`border-[${x}]`). Tailwind lee el codigo fuente como texto y solo genera las clases que
 * ve escritas enteras; una clase montada en tiempo de ejecucion no existe en el CSS y el
 * elemento sale sin estilo. Los colores calculados van por `style`, no por `className`.
 *
 * Fuente: `docs/sops/marketing/brand/01-brandkit-oficial.md` + `src/app/brandkit/version-two.tsx`.
 */

// --- Color -------------------------------------------------------------------
export const C = {
  carbon: "#0F0F12",        // fondo de pagina
  panel: "#131318",         // superficie de tarjeta
  panelSoft: "#16161B",     // superficie elevada / hover
  line: "rgba(245,246,247,0.1)",       // hairline
  lineStrong: "rgba(245,246,247,0.2)", // hairline marcado
  text: "#F5F6F7",          // texto principal
  muted: "#A6AAB2",         // texto secundario
  deepMute: "#7C818A",      // texto terciario
  accent: "#22C55E",        // acento (unico color de marca)
  accentSoft: "#4ADE80",    // verde claro: iconos, cifras, enlaces
  greenInk: "#08130C",      // tinta sobre verde
  accentSurface: "#101710", // superficie verde
  accentBorder: "#24462F",  // borde de superficie verde
  warn: "#E5B567",          // ambar, SOLO avisos
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
  "rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#131318]"

/** Panel grande / modal: radio de 8px. */
export const PANEL =
  "rounded-[8px] border border-[rgba(245,246,247,0.1)] bg-[#131318]"

/** Campo de texto y desplegable. 44px de alto: zona tactil minima. */
export const FIELD =
  "h-11 rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#16161B] px-3 " +
  "text-[14px] text-[#F5F6F7] placeholder:text-[#7C818A] " +
  "focus:outline-none focus:border-[#24462F] focus:ring-1 focus:ring-[rgba(34,197,94,0.45)] " +
  "transition-colors"

/** Accion principal: verde con tinta oscura. Una sola por pantalla. */
export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 min-h-[44px] rounded-[4px] " +
  "bg-[#22C55E] px-4 text-[14px] font-semibold text-[#08130C] " +
  "transition-[transform,box-shadow,background-color] duration-200 " +
  "hover:-translate-y-0.5 hover:bg-[#4ADE80] hover:shadow-[0_8px_20px_-8px_rgba(34,197,94,0.6)] " +
  "active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0"

/** Accion secundaria: borde, sin relleno. */
export const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 min-h-[44px] rounded-[4px] " +
  "border border-[rgba(245,246,247,0.1)] bg-transparent px-4 text-[14px] font-semibold " +
  "text-[#A6AAB2] transition-colors hover:border-[rgba(245,246,247,0.2)] " +
  "hover:bg-[#16161B] hover:text-[#F5F6F7]"

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
 * Stages canonicos en `docs/sops/producto/13-contactos-pipeline.md`. Al anadir uno nuevo
 * hay que anadirlo TAMBIEN aqui (paso 5 del checklist de ese SOP).
 */
export type StageTone = {
  /** Clases del chip de stage. Literales, nunca montadas con plantilla. */
  chip: string
  /** Color de la linea superior de la columna del kanban. Va por `style`. */
  rule: string
}

export const STAGE_TONE: Record<string, StageTone> = {
  dm: {
    chip: "border-[rgba(245,246,247,0.1)] bg-[#16161B] text-[#7C818A]",
    rule: "rgba(245,246,247,0.1)",
  },
  lead: {
    chip: "border-[rgba(245,246,247,0.14)] bg-[#16161B] text-[#A6AAB2]",
    rule: "rgba(245,246,247,0.14)",
  },
  lead_cualificado: {
    chip: "border-[rgba(245,246,247,0.2)] bg-[#16161B] text-[#F5F6F7]",
    rule: "rgba(245,246,247,0.2)",
  },
  agendado: {
    chip: "border-[rgba(245,246,247,0.28)] bg-[#16161B] text-[#F5F6F7]",
    rule: "rgba(245,246,247,0.28)",
  },
  seguimiento: {
    chip: "border-[rgba(245,246,247,0.14)] bg-[#16161B] text-[#A6AAB2]",
    rule: "rgba(245,246,247,0.14)",
  },
  alumno: {
    chip: "border-[#24462F] bg-[#101710] text-[#4ADE80]",
    rule: "#22C55E",
  },
  no_show: {
    chip: "border-[rgba(229,181,103,0.35)] bg-[#16161B] text-[#E5B567]",
    rule: "rgba(229,181,103,0.45)",
  },
  perdido: {
    chip: "border-[rgba(245,246,247,0.08)] bg-transparent text-[#7C818A]",
    rule: "rgba(245,246,247,0.06)",
  },
}

export const STAGE_TONE_FALLBACK: StageTone = {
  chip: "border-[rgba(245,246,247,0.14)] bg-[#16161B] text-[#A6AAB2]",
  rule: "rgba(245,246,247,0.14)",
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
