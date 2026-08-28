/**
 * Fechas y horas del parte diario.
 *
 * REGLA #23 del protocolo: la hora que se enseña es la hora REAL del negocio. Las horas
 * llegan de la base en UTC y aqui se pasan SIEMPRE a la hora de Madrid, sin depender del
 * reloj del telefono de quien mira: si Marco abre el OS en otro pais, tiene que seguir
 * viendo la hora a la que ocurrio de verdad.
 */

const ZONA = "Europe/Madrid"

/** "2026-08-19" leido como dia suelto, sin husos que lo muevan al dia anterior. */
function comoDia(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number)
  return new Date(a, (m ?? 1) - 1, d ?? 1)
}

/** mié 19 ago */
export function fechaCorta(iso: string): string {
  return comoDia(iso).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
}

/** miércoles 19 de agosto */
export function fechaLarga(iso: string): string {
  return comoDia(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
}

/** 19 */
export function diaDelMes(iso: string): string {
  return String(comoDia(iso).getDate())
}

/** 11:17 */
export function hora(instante: string | null): string {
  if (!instante) return ""
  return new Date(instante).toLocaleTimeString("es-ES", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** 13 ago, 11:36 */
export function fechaYHora(instante: string | null): string {
  if (!instante) return ""
  const d = new Date(instante)
  const dia = d.toLocaleDateString("es-ES", { timeZone: ZONA, day: "numeric", month: "short" })
  return `${dia}, ${hora(instante)}`
}

/** "1 corrección" / "3 correcciones" */
export function plural(n: number, singular: string, plural_: string): string {
  return `${n} ${n === 1 ? singular : plural_}`
}
