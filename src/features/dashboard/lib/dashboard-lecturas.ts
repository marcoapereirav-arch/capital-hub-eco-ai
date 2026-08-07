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

import type { ConectorCadena, EslabonCadena } from "../components/dashboard-chain"
import type { TramoPulso } from "../components/dashboard-pulse"

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

export type DatosCadena = {
  contactos: number
  contactosAnterior: number
  llamadas: number
  llamadasHechas: number
  noShows: number
  showRate: number
  ventas: number
  ventasAnterior: number
  facturado: number
  ticketMedio: number
  ultimoContacto: string | null
  hayVentasPendientes: boolean
}

export type Cadena = {
  eslabones: EslabonCadena[]
  conectores: ConectorCadena[]
  lecturaPorDefecto: string
  enlacePorDefecto: { texto: string; href: string }
  botonPrincipal: { texto: string; href: string } | null
}

export function construirCadena(d: DatosCadena): Cadena {
  const sinHacer = Math.max(0, d.llamadas - d.llamadasHechas)

  const eslabones: EslabonCadena[] = [
    {
      clave: "contactos",
      nombre: "Contactos",
      valor: d.contactos,
      salida: d.contactos,
      hueco: null,
      anterior: d.contactosAnterior,
      pie: d.ultimoContacto ? `el último entró hace ${timeAgo(d.ultimoContacto)}` : null,
      lectura:
        d.contactos === 0
          ? "No entró ningún contacto en este periodo."
          : `Entraron ${d.contactos} ${plural(d.contactos, "contacto", "contactos")}` +
            (d.contactosAnterior > 0
              ? `, frente a ${d.contactosAnterior} en el periodo anterior.`
              : "."),
      href: "/crm/contactos",
      hrefTexto: "Ver contactos",
    },
    {
      clave: "llamadas",
      nombre: "Llamadas",
      valor: d.llamadas,
      salida: d.llamadasHechas,
      hueco: sinHacer > 0 ? { valor: sinHacer, texto: `${sinHacer} sin hacer` } : null,
      /* El periodo anterior de llamadas no se consulta hoy, asi que este escalon
         se queda SIN marca de comparacion en vez de inventarsela. */
      anterior: null,
      pie: d.llamadas > 0 ? `${d.showRate}% asistencia · ${d.noShows} no-show` : null,
      lectura:
        d.llamadas === 0
          ? "No se agendó ninguna llamada en este periodo."
          : `Se agendaron ${d.llamadas} ${plural(d.llamadas, "llamada", "llamadas")} y se hicieron ${d.llamadasHechas}` +
            (d.noShows > 0 ? `. ${d.noShows} no aparecieron.` : "."),
      href: "/calendario",
      hrefTexto: "Ver el calendario",
    },
    {
      clave: "ventas",
      nombre: "Ventas",
      valor: d.ventas,
      salida: d.ventas,
      hueco: null,
      anterior: d.ventasAnterior,
      pie: d.ventas > 0 ? `Ticket medio ${eur(d.ticketMedio)}` : null,
      lectura:
        d.ventas === 0
          ? "No se cerró ninguna venta en este periodo."
          : `Se cerraron ${d.ventas} ${plural(d.ventas, "venta", "ventas")} por ${eur(d.facturado)}.`,
      href: "/crm/contactos",
      hrefTexto: "Ver contactos",
    },
  ]

  const conectores: ConectorCadena[] = [
    {
      de: d.contactos,
      a: d.llamadas,
      texto: `${d.contactos} ${plural(d.contactos, "entró", "entraron")}, ${d.llamadas} se ${plural(d.llamadas, "agendó", "agendaron")}`,
      perdida:
        d.contactos > d.llamadas
          ? `${d.contactos - d.llamadas} no ${plural(d.contactos - d.llamadas, "agendó", "agendaron")}`
          : null,
    },
    {
      de: d.llamadasHechas,
      a: d.ventas,
      texto: `${d.llamadasHechas} ${plural(d.llamadasHechas, "llamada hecha", "llamadas hechas")}, ${d.ventas} ${plural(d.ventas, "compró", "compraron")}`,
      perdida:
        d.llamadasHechas > d.ventas
          ? `${d.llamadasHechas - d.ventas} no ${plural(d.llamadasHechas - d.ventas, "compró", "compraron")}`
          : null,
    },
  ]

  const todoACero = d.contactos === 0 && d.llamadas === 0 && d.ventas === 0

  let peor = -1
  let peorPct = Number.POSITIVE_INFINITY
  conectores.forEach((c, i) => {
    if (c.de <= 0 || c.a >= c.de) return
    const pct = c.a / c.de
    if (pct < peorPct) {
      peorPct = pct
      peor = i
    }
  })

  const lecturaPorDefecto = todoACero
    ? "Todavía no ha entrado nada en este periodo."
    : peor === 0
      ? `Donde más se pierde: de ${d.contactos} que entraron, ${d.contactos - d.llamadas} no llegaron a agendar llamada.`
      : peor === 1
        ? `Donde más se pierde: de ${d.llamadasHechas} ${plural(d.llamadasHechas, "llamada hecha", "llamadas hechas")}, ${d.llamadasHechas - d.ventas} no llegaron a comprar.`
        : "La cadena no pierde a nadie en este periodo."

  const enlacePorDefecto =
    peor === 1
      ? { texto: "Ver el calendario", href: "/calendario" }
      : { texto: "Ver contactos", href: "/crm/contactos" }

  /* La accion principal existe SIEMPRE y cuelga del escalon que esta parado.
     Cuando hay ventas por completar, el verde vive en ese bloque y aqui no se
     pinta ninguno: una sola accion principal por pantalla. */
  const botonPrincipal = d.hayVentasPendientes
    ? null
    : d.contactos === 0
      ? { texto: "Añadir contacto", href: "/crm/contactos" }
      : d.llamadas === 0
        ? { texto: "Abrir el calendario", href: "/calendario" }
        : { texto: "Ver contactos", href: "/crm/contactos" }

  return { eslabones, conectores, lecturaPorDefecto, enlacePorDefecto, botonPrincipal }
}

// ---------------------------------------------------------------------------
// El pulso
//
// Regla de los tramos, en una frase: el tramo empieza siendo el dia y se
// agranda (dia, semana, quincena, mes) hasta que quepan 7 o menos. Asi el
// dibujo es IDENTICO en el telefono y en el ordenador, y cada columna siempre
// tiene sitio para su numero escrito encima.
// ---------------------------------------------------------------------------

export type Pulso = {
  tramos: TramoPulso[]
  unidad: string
  desde: string
  hasta: string
}

export function construirPulso(
  desde: Date,
  hasta: Date,
  contactos: { created_at: string; total_revenue: number | null }[],
): Pulso {
  const finDia = inicioDeDia(hasta)
  const iniDia = inicioDeDia(desde)
  const dias = Math.max(1, Math.round((finDia.getTime() - iniDia.getTime()) / MS_DIA) + 1)

  const escalas: { g: number; unidad: string; prefijo: string }[] = [
    { g: 1, unidad: "Día", prefijo: "" },
    { g: 7, unidad: "Semana", prefijo: "la semana " },
    { g: 15, unidad: "Quincena", prefijo: "la quincena " },
    { g: 30, unidad: "Mes", prefijo: "el tramo " },
  ]
  const escala = escalas.find((e) => Math.ceil(dias / e.g) <= 7) ?? escalas[escalas.length - 1]
  const cuantos = Math.min(7, Math.max(1, Math.ceil(dias / escala.g)))

  const tramos: TramoPulso[] = []
  const limites: { ini: number; fin: number }[] = []

  for (let i = cuantos - 1; i >= 0; i--) {
    const fin = new Date(finDia)
    fin.setDate(fin.getDate() - i * escala.g)
    const ini = new Date(fin)
    ini.setDate(ini.getDate() - (escala.g - 1))
    const iniReal = ini.getTime() < iniDia.getTime() ? new Date(iniDia) : ini
    const finExclusivo = new Date(fin)
    finExclusivo.setDate(finExclusivo.getDate() + 1)

    limites.push({ ini: iniReal.getTime(), fin: finExclusivo.getTime() })

    const mismoMes = iniReal.getMonth() === fin.getMonth()
    tramos.push({
      clave: String(iniReal.getTime()),
      etiqueta: escala.g === 1 ? String(fin.getDate()) : `${iniReal.getDate()}-${fin.getDate()}`,
      etiquetaLarga:
        escala.g === 1
          ? `el ${fin.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}`
          : mismoMes
            ? `${escala.prefijo}del ${iniReal.getDate()} al ${fin.getDate()} de ${mesLargo(fin)}`
            : `${escala.prefijo}del ${iniReal.getDate()} de ${mesLargo(iniReal)} al ${fin.getDate()} de ${mesLargo(fin)}`,
      contactos: 0,
      ingresos: 0,
    })
  }

  for (const c of contactos) {
    const t = new Date(c.created_at).getTime()
    const idx = limites.findIndex((l) => t >= l.ini && t < l.fin)
    if (idx >= 0) {
      tramos[idx].contactos += 1
      tramos[idx].ingresos += c.total_revenue ?? 0
    }
  }

  return {
    tramos,
    unidad: escala.unidad,
    desde: diaMes(new Date(limites[0].ini)),
    hasta: diaMes(new Date(limites[limites.length - 1].fin - MS_DIA)),
  }
}
