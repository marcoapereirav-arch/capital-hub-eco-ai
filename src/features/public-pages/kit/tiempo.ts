/**
 * Fecha y hora de un evento, sin sustos de zona horaria.
 *
 * Se usa en las páginas públicas (landing + gracias) para la cuenta atrás y para
 * imprimir la fecha. Todo con aritmética pura salvo el cálculo del desfase de la zona,
 * que se le pregunta a `Intl`: así el día que sale en el servidor y el que ve el
 * navegador son SIEMPRE el mismo, y no se desvía ni con el cambio de horario.
 */

export const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

export const DIAS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

export function parseISODate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((iso ?? "").trim())
  if (!match) return null
  const y = Number(match[1]); const m = Number(match[2]); const d = Number(match[3])
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return { y, m, d }
}

export function parseTime(time: string): { h: number; min: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec((time ?? "").trim())
  if (!match) return null
  const h = Number(match[1]); const min = Number(match[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return { h, min }
}

/** Día de la semana (0 = domingo) por el algoritmo de Sakamoto. Sin `new Date`. */
export function weekdayIndex(y: number, m: number, d: number): number {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const yy = m < 3 ? y - 1 : y
  return (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[m - 1] + d) % 7
}

/**
 * Momento exacto del evento en milisegundos UTC, leyendo fecha y hora en la zona que se
 * le pase. Es lo que come la cuenta atrás.
 *
 * Por qué no vale `new Date("2026-08-08T10:00")`: eso usa la hora del NAVEGADOR, así que
 * a alguien en México le saldrían horas de más. Aquí se le pregunta a `Intl` cuánto se
 * desvía esa zona ese día concreto y se corrige.
 */
export function zonedDateTimeToMs(isoDate: string, time: string, timeZone: string): number | null {
  const p = parseISODate(isoDate)
  const t = parseTime(time)
  if (!p || !t) return null
  const naive = Date.UTC(p.y, p.m - 1, p.d, t.h, t.min, 0)
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(naive)).map((x) => [x.type, x.value]),
    ) as Record<string, string>
    const asUTC = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
    )
    return naive - (asUTC - naive)
  } catch {
    // Si el navegador no conoce la zona, se queda con la lectura directa antes que romper.
    return naive
  }
}
