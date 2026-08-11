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

/**
 * Los tipos de acción que de verdad importan del bloque `actions`.
 *
 * El ORDEN es la prioridad, y es lo que hace que el número sea correcto. Meta devuelve el
 * mismo hecho con varios nombres y unos CONTIENEN a otros: `lead` es el total de todos los
 * canales y ya incluye dentro `offsite_conversion.fb_pixel_lead` y `onsite_web_lead`. Lo
 * mismo con `omni_landing_page_view`, que contiene a `landing_page_view`.
 */
export const ACCIONES = {
  lead: ["lead", "onsite_web_lead", "offsite_conversion.fb_pixel_lead"],
  visitaWeb: ["landing_page_view", "omni_landing_page_view"],
  clicEnlace: ["link_click"],
  compra: ["purchase", "offsite_conversion.fb_pixel_purchase"],
} as const

/**
 * El valor de un concepto dentro del bloque de acciones de Meta.
 *
 * NO SE SUMAN los tipos: se coge el PRIMERO de la lista que exista.
 *
 * Antes se sumaban, y el 11-ago-2026 eso salio a la vista en el panel: el embudo decia 75
 * leads y el medidor 11,28 € por lead con 282,02 € de gasto, que son 25 leads. El mismo
 * lead venia contado tres veces, una por cada nombre, porque `lead` ya incluye a los otros
 * dos. Con las visitas pasaba igual: 1144 paginas cargadas de 1011 clics, o sea mas
 * llegadas que salidas.
 *
 * Sumar cosas que se solapan no da un total: da el mismo hecho repetido.
 */
export function valorDeAccion(
  fila: Record<string, unknown>,
  campo: "actions" | "cost_per_action_type",
  tipos: readonly string[]
): number {
  const lista = fila[campo] as Array<{ action_type: string; value: string }> | undefined
  if (!Array.isArray(lista)) return 0
  for (const t of tipos) {
    const hit = lista.find((a) => a.action_type === t)
    if (hit) return Number.parseFloat(hit.value) || 0
  }
  return 0
}

export type FilaDia = { fecha: string; gasto: number; leads: number; clicsSalientes: number }

export type FilaCampana = {
  id: string
  nombre: string
  objetivo: string
  /** Los valores de las métricas elegidas, ya en número. */
  valores: Record<string, number>
}

export type FilaConjunto = {
  id: string
  nombre: string
  campanaId: string
  campanaNombre: string
  valores: Record<string, number>
}

/** Lo que se ha marcado con casillas. Vacio = la cuenta entera. */
export type Seleccion = { campanas: string[]; conjuntos: string[] }

/** Una linea de desglose: donde se muestra, o que edad responde. */
export type FilaDesglose = { clave: string; gasto: number; leads: number; impresiones: number }

export type DatosPanel = {
  ok: true
  totales: Record<string, number>
  anteriores: Record<string, number>
  embudo: { impresiones: number; clicsSalientes: number; visitasWeb: number; leads: number }
  dias: FilaDia[]
  campanas: FilaCampana[]
  conjuntos: FilaConjunto[]
  plataformas: FilaDesglose[]
  edades: FilaDesglose[]
  moneda: string
}

export type ErrorPanel = { ok: false; error: string; sinPermiso: boolean }

/** Todas las métricas del catálogo, para pedirlas de una y no tener que volver. */
function todosLosCampos(): string[] {
  return [...new Set([...METRICAS.map((m) => m.id), ...CAMPOS_META])]
}

export async function getDatosPanel(
  rango: RangoFechas,
  sel: Seleccion = { campanas: [], conjuntos: [] }
): Promise<DatosPanel | ErrorPanel> {
  const campos = todosLosCampos()
  // Lo marcado con casillas se aplica a los totales, al dia a dia y al embudo. La LISTA de
  // campañas se pide SIEMPRE entera: es de donde salen las casillas, asi que si se filtrara
  // tambien, al marcar una desaparecerian las demas y no se podria desmarcar.
  const filtro = { campanas: sel.campanas, conjuntos: sel.conjuntos }

  const desglose = (b: "publisher_platform" | "age") =>
    pedirInsights<Record<string, unknown>>({
      rango,
      desglose: b,
      campos: ["spend", "impressions", "actions"],
      ...filtro,
    })

  const [tot, ant, dia, camp, conj, plat, edad] = await Promise.all([
    pedirInsights<Record<string, unknown>>({ rango, campos, ...filtro }),
    pedirInsights<Record<string, unknown>>({ rango: periodoAnterior(rango), campos, ...filtro }),
    // La evolución se pide a nivel de cuenta: día a día por anuncio serían cientos de filas
    // y la pantalla no dibuja eso.
    pedirInsights<Record<string, unknown>>({
      rango,
      porDia: true,
      campos: ["spend", "actions", "outbound_clicks"],
      ...filtro,
    }),
    pedirInsights<Record<string, unknown>>({
      rango,
      nivel: "campaign",
      campos: [...campos, "campaign_id", "campaign_name"],
    }),
    pedirInsights<Record<string, unknown>>({
      rango,
      nivel: "adset",
      campos: [...campos, "campaign_id", "campaign_name", "adset_id", "adset_name"],
      campanas: sel.campanas,
    }),
    desglose("publisher_platform"),
    desglose("age"),
  ])

  if (!tot.ok) return { ok: false, error: tot.error, sinPermiso: tot.sinPermiso }

  const fila = tot.filas[0] ?? {}
  const filaAnt = ant.ok ? (ant.filas[0] ?? {}) : {}

  const valores = (f: Record<string, unknown>) => {
    const out: Record<string, number> = {}
    for (const m of METRICAS) out[m.id] = valorDe(f, m.id)
    out.leads = valorDeAccion(f, "actions", ACCIONES.lead)
    out.costePorLead = valorDeAccion(f, "cost_per_action_type", ACCIONES.lead)
    out.visitasWeb = valorDeAccion(f, "actions", ACCIONES.visitaWeb)
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
            leads: valorDeAccion(f, "actions", ACCIONES.lead),
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
    conjuntos: conj.ok
      ? conj.filas.map((f) => ({
          id: String(f.adset_id ?? ""),
          nombre: String(f.adset_name ?? "Sin nombre"),
          campanaId: String(f.campaign_id ?? ""),
          campanaNombre: String(f.campaign_name ?? ""),
          valores: valores(f),
        }))
      : [],
    plataformas: leerDesglose(plat, "publisher_platform"),
    edades: leerDesglose(edad, "age"),
    moneda: String(fila.account_currency ?? "EUR"),
  }
}

/** Deja un desglose de Meta en filas ordenadas por gasto, sin las que no gastaron nada. */
function leerDesglose(
  r: { ok: true; filas: Record<string, unknown>[] } | { ok: false },
  clave: string
): FilaDesglose[] {
  if (!r.ok) return []
  return r.filas
    .map((f) => ({
      clave: String(f[clave] ?? ""),
      gasto: valorDe(f, "spend"),
      leads: valorDeAccion(f, "actions", ACCIONES.lead),
      impresiones: valorDe(f, "impressions"),
    }))
    .filter((x) => x.gasto > 0)
    .sort((a, b) => b.gasto - a.gasto)
}

export { metricaPorId }
