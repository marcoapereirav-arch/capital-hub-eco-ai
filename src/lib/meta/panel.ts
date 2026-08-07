import "server-only"
import { pedirInsights, periodoAnterior, type RangoFechas } from "./insights"
import { CAMPOS_META, METRICAS, metricaPorId } from "./metricas"

/**
 * Todo lo que necesita el panel de Campañas, en una sola pasada.
 *
 * Se pide junto a propósito: los totales, el día a día, el desglose por campaña y el
 * periodo anterior. Si cada trozo fuera su propia petición, la pantalla se llenaría a
 * cachos y los números bailarían mientras llegan.
 */

/** Meta devuelve unas métricas como texto ("1735") y otras como lista de acciones. */
type ValorCrudo = string | number | Array<{ action_type: string; value: string }> | undefined

/**
 * Deja cualquier métrica en un número utilizable.
 *
 * Las de tipo lista traen una entrada por tipo de acción. Para las de clics salientes
 * la entrada buena es `outbound_click`; si no se encuentra la esperada, se suma todo, que
 * es lo que hace el propio administrador de anuncios.
 */
export function aNumero(v: ValorCrudo, accionPreferida?: string): number {
  if (v == null) return 0
  if (typeof v === "number") return v
  if (typeof v === "string") return Number.parseFloat(v) || 0
  if (!Array.isArray(v)) return 0

  if (accionPreferida) {
    const exacta = v.find((a) => a.action_type === accionPreferida)
    if (exacta) return Number.parseFloat(exacta.value) || 0
  }
  return v.reduce((suma, a) => suma + (Number.parseFloat(a.value) || 0), 0)
}

/** Qué entrada de la lista es la buena para cada métrica que viene en forma de lista. */
const ACCION_PREFERIDA: Record<string, string> = {
  unique_outbound_clicks: "outbound_click",
  unique_outbound_clicks_ctr: "outbound_click",
  cost_per_unique_outbound_click: "outbound_click",
  outbound_clicks: "outbound_click",
  outbound_clicks_ctr: "outbound_click",
  cost_per_outbound_click: "outbound_click",
  website_ctr: "link_click",
}

export function valorDe(fila: Record<string, unknown>, id: string): number {
  return aNumero(fila[id] as ValorCrudo, ACCION_PREFERIDA[id])
}

/** Los tipos de acción que de verdad importan del bloque `actions`. */
export const ACCIONES = {
  lead: ["lead", "onsite_web_lead", "offsite_conversion.fb_pixel_lead"],
  visitaWeb: ["landing_page_view", "omni_landing_page_view"],
  clicEnlace: ["link_click"],
  compra: ["purchase", "offsite_conversion.fb_pixel_purchase"],
} as const

/** Suma los tipos de acción que correspondan a un concepto. */
export function sumaAcciones(
  fila: Record<string, unknown>,
  campo: "actions" | "cost_per_action_type",
  tipos: readonly string[]
): number {
  const lista = fila[campo] as Array<{ action_type: string; value: string }> | undefined
  if (!Array.isArray(lista)) return 0
  // Para el coste NO se suma: se coge el primero que exista, porque sumar costes
  // de tipos distintos no significa nada.
  if (campo === "cost_per_action_type") {
    for (const t of tipos) {
      const hit = lista.find((a) => a.action_type === t)
      if (hit) return Number.parseFloat(hit.value) || 0
    }
    return 0
  }
  return lista
    .filter((a) => tipos.includes(a.action_type))
    .reduce((s, a) => s + (Number.parseFloat(a.value) || 0), 0)
}

export type FilaDia = { fecha: string; gasto: number; leads: number; clicsSalientes: number }

export type FilaCampana = {
  id: string
  nombre: string
  objetivo: string
  /** Los valores de las métricas elegidas, ya en número. */
  valores: Record<string, number>
}

export type DatosPanel = {
  ok: true
  totales: Record<string, number>
  anteriores: Record<string, number>
  embudo: { impresiones: number; clicsSalientes: number; visitasWeb: number; leads: number }
  dias: FilaDia[]
  campanas: FilaCampana[]
  moneda: string
}

export type ErrorPanel = { ok: false; error: string; sinPermiso: boolean }

/** Todas las métricas del catálogo, para pedirlas de una y no tener que volver. */
function todosLosCampos(): string[] {
  return [...new Set([...METRICAS.map((m) => m.id), ...CAMPOS_META])]
}

export async function getDatosPanel(rango: RangoFechas): Promise<DatosPanel | ErrorPanel> {
  const campos = todosLosCampos()

  const [tot, ant, dia, camp] = await Promise.all([
    pedirInsights<Record<string, unknown>>({ rango, campos }),
    pedirInsights<Record<string, unknown>>({ rango: periodoAnterior(rango), campos }),
    // La evolución se pide a nivel de cuenta: día a día por anuncio serían cientos de filas
    // y la pantalla no dibuja eso.
    pedirInsights<Record<string, unknown>>({
      rango,
      porDia: true,
      campos: ["spend", "actions", "outbound_clicks"],
    }),
    pedirInsights<Record<string, unknown>>({
      rango,
      nivel: "campaign",
      campos: [...campos, "campaign_id", "campaign_name"],
    }),
  ])

  if (!tot.ok) return { ok: false, error: tot.error, sinPermiso: tot.sinPermiso }

  const fila = tot.filas[0] ?? {}
  const filaAnt = ant.ok ? (ant.filas[0] ?? {}) : {}

  const valores = (f: Record<string, unknown>) => {
    const out: Record<string, number> = {}
    for (const m of METRICAS) out[m.id] = valorDe(f, m.id)
    out.leads = sumaAcciones(f, "actions", ACCIONES.lead)
    out.costePorLead = sumaAcciones(f, "cost_per_action_type", ACCIONES.lead)
    out.visitasWeb = sumaAcciones(f, "actions", ACCIONES.visitaWeb)
    return out
  }

  const totales = valores(fila)
  const anteriores = valores(filaAnt)

  return {
    ok: true,
    totales,
    anteriores,
    embudo: {
      impresiones: totales.impressions,
      clicsSalientes: totales.unique_outbound_clicks || totales.outbound_clicks,
      visitasWeb: totales.visitasWeb,
      leads: totales.leads,
    },
    dias: dia.ok
      ? dia.filas
          .map((f) => ({
            fecha: String(f.date_start ?? ""),
            gasto: valorDe(f, "spend"),
            leads: sumaAcciones(f, "actions", ACCIONES.lead),
            clicsSalientes: valorDe(f, "outbound_clicks"),
          }))
          .filter((d) => d.fecha)
      : [],
    campanas: camp.ok
      ? camp.filas.map((f) => ({
          id: String(f.campaign_id ?? ""),
          nombre: String(f.campaign_name ?? "Sin nombre"),
          objetivo: String(f.objective ?? ""),
          valores: valores(f),
        }))
      : [],
    moneda: String(fila.account_currency ?? "EUR"),
  }
}

export { metricaPorId }
