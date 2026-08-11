/**
 * Lo que el panel principal CALCULA para poder dibujarse.
 *
 * Aqui no se consulta nada: todo entra ya cargado desde `main-dashboard.tsx` y
 * sale convertido en las piezas que dibujan la cadena y el pulso. Vive aparte
 * porque son funciones puras (mismos datos dentro, mismo resultado fuera) y
 * porque asi el componente se queda con lo que se ve.
 *
 * Las frases se escriben aqui a proposito: son la parte que hace que la pantalla
 * se explique sola, y tienen una regla dura. La cadena junta TRES grupos de
 * personas distintos (los contactos creados en el periodo, las llamadas
 * agendadas en el periodo y las invitaciones creadas en el periodo), asi que
 * NUNCA se puede escribir "4 de esos 12": se enuncian los dos hechos y su
 * proporcion. Y si las llamadas superan a los contactos nuevos, la copia dice el
 * motivo en vez de ensenar un porcentaje por encima de 100, que se leeria como
 * un error.
 */


export const MS_DIA = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

export function eur(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n || 0)
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Calcula el rango ANTERIOR de la misma longitud (para comparar deltas). */
export function previousRange(from: Date, to: Date): { from: Date; to: Date } {
  const lengthMs = to.getTime() - from.getTime()
  const prevTo = new Date(from.getTime())
  const prevFrom = new Date(from.getTime() - lengthMs)
  return { from: prevFrom, to: prevTo }
}

export function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ahora"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  return `${d} d`
}

export function inicioDeDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function diaMes(d: Date): string {
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

function mesLargo(d: Date): string {
  return d.toLocaleDateString("es-ES", { month: "long" })
}

export function plural(n: number, uno: string, varios: string): string {
  return n === 1 ? uno : varios
}

// ---------------------------------------------------------------------------
// La cadena
// ---------------------------------------------------------------------------
