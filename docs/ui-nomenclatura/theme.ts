/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TEMA / BRANDING — el ÚNICO sitio con colores en JavaScript.
 *  Cambia estos 4 valores por los de tu marca y las partes animadas del
 *  documento (barra de progreso, aurora del fondo, mockups) se re-tiñen.
 *
 *  Los colores que van en clases de Tailwind (text-accent, bg-canvas, text-ink…)
 *  se definen APARTE, en tu tailwind.config. Ver README → "2. Tokens de Tailwind".
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Acento principal (aquí: dorado). Tu color de marca. */
export const ACCENT = '#C2A665'

/** Acento claro, para degradados y brillos (una versión más clara de ACCENT). */
export const ACCENT_SOFT = '#E1CD91'

/** El RGB de ACCENT, para rgba(...) con transparencia. DEBE coincidir con ACCENT. */
export const ACCENT_RGB = '194, 166, 101'

/** Color secundario (aquí: violeta), solo para la 2ª aurora del fondo. */
export const SECONDARY = '#8a4ed8'
