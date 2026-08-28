import "server-only"
import { getMarketingToken } from "./marketing-token"

/**
 * Puerta única a los datos de campañas de Meta.
 *
 * Todo lo que pide gasto, impresiones o resultados pasa por aquí. Un solo sitio que sepa
 * hablar con Meta, para que no haya dos pantallas pidiendo lo mismo de formas distintas y
 * enseñando números que no cuadran.
 *
 * FECHAS: siempre por rango explícito (`time_range`), nunca por los atajos de Meta
 * (`date_preset`). El motivo es que el OS tiene SU filtro de fechas y sus periodos no
 * coinciden con los de Meta: "esta semana" del OS empieza en lunes, el `this_week` de Meta
 * no tiene por qué. Traduciendo a fechas concretas, lo que se ve en Ads coincide siempre
 * con lo que se ve en el resto del OS. Ver SOP producto/58.
 */

const GRAPH = "https://graph.facebook.com/v19.0"

export type RangoFechas = { from: Date; to: Date }

/** Meta quiere las fechas en AAAA-MM-DD y en la zona horaria de la cuenta. */
function fecha(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dia}`
}

/**
 * El periodo justo anterior y del mismo tamaño, para poder decir si algo sube o baja.
 * Ejemplo: si miras del 1 al 30, el anterior es del 2 de agosto al 31 de agosto del mes
 * previo, no "el mes pasado" a ojo.
 */
export function periodoAnterior(r: RangoFechas): RangoFechas {
  const dias = Math.max(1, Math.round((r.to.getTime() - r.from.getTime()) / 86400000))
  const to = new Date(r.from.getTime() - 86400000)
  const from = new Date(to.getTime() - dias * 86400000)
  return { from, to }
}

export type OpcionesInsights = {
  rango: RangoFechas
  /** Qué nivel de detalle: la cuenta entera, por campaña, por conjunto o por anuncio. */
  nivel?: "account" | "campaign" | "adset" | "ad"
  /** true = una fila por día (para dibujar la evolución). */
  porDia?: boolean
  campos: string[]
  limite?: number
  /**
   * Ver solo estas campañas. Vacio o sin poner = la cuenta entera.
   * Marco quiere marcar VARIAS con casillas, no elegir una: si tiene cinco campañas y
   * quiere ver tres, marca tres y los numeros salen sumados de esas tres.
   */
  campanas?: string[]
  /** Igual pero para conjuntos, cuando se baja un nivel. */
  conjuntos?: string[]
  /** Y para anuncios sueltos, el nivel mas fino. */
  anuncios?: string[]
  /** Desglose de Meta: por donde se muestra, por edad, por dispositivo. */
  desglose?: "publisher_platform" | "age" | "impression_device" | "gender"
}

export type RespuestaInsights<T = Record<string, unknown>> =
  | { ok: true; filas: T[] }
  | { ok: false; error: string; codigo?: number; sinPermiso: boolean }

/**
 * Pide datos a Meta. Devuelve SIEMPRE un resultado manejable, nunca lanza: una pantalla
 * en blanco sin explicación es peor que un mensaje diciendo qué pasó.
 */
export async function pedirInsights<T = Record<string, unknown>>(
  o: OpcionesInsights
): Promise<RespuestaInsights<T>> {
  const cuenta = process.env.META_AD_ACCOUNT_ID
  const token = await getMarketingToken()

  if (!cuenta || !token) {
    return {
      ok: false,
      sinPermiso: true,
      error:
        "Falta la cuenta publicitaria o la llave para leerla. Se pega en Ads, Ajustes, arriba del todo.",
    }
  }

  const params = new URLSearchParams({
    time_range: JSON.stringify({ since: fecha(o.rango.from), until: fecha(o.rango.to) }),
    fields: o.campos.join(","),
    level: o.nivel ?? "account",
    limit: String(o.limite ?? 500),
    access_token: token,
  })
  if (o.porDia) params.set("time_increment", "1")
  if (o.desglose) params.set("breakdowns", o.desglose)

  // El filtro de Meta admite varios valores con el operador IN, que es justo lo que hace
  // falta para marcar varias campañas a la vez. Comprobado contra la cuenta real.
  const filtros: { field: string; operator: string; value: string[] }[] = []
  if (o.campanas?.length) filtros.push({ field: "campaign.id", operator: "IN", value: o.campanas })
  if (o.conjuntos?.length) filtros.push({ field: "adset.id", operator: "IN", value: o.conjuntos })
  if (o.anuncios?.length) filtros.push({ field: "ad.id", operator: "IN", value: o.anuncios })
  if (filtros.length) params.set("filtering", JSON.stringify(filtros))

  try {
    const res = await fetch(`${GRAPH}/act_${cuenta}/insights?${params}`, { cache: "no-store" })
    const json = (await res.json()) as {
      data?: T[]
      error?: { message?: string; code?: number }
    }

    if (json.error) {
      const msg = json.error.message ?? "Meta devolvió un error"
      return {
        ok: false,
        error: msg,
        codigo: json.error.code,
        sinPermiso: /permission|ads_read|access_token|capability/i.test(msg),
      }
    }
    return { ok: true, filas: json.data ?? [] }
  } catch (e) {
    return {
      ok: false,
      sinPermiso: false,
      error: e instanceof Error ? e.message : "No se pudo contactar con Meta",
    }
  }
}

/**
 * Pregunta a Meta cuáles de estos campos acepta DE VERDAD, uno por uno.
 *
 * Existe porque la documentación de Meta no coincide con lo que la API acepta: hay
 * métricas que ellos explican en su centro de ayuda y que no salen en la tabla de campos,
 * y al revés. Construir el selector de métricas sobre nombres sacados de la documentación
 * sería inventar. Esto lo pregunta y se queda con la respuesta.
 *
 * Estrategia: se piden todos juntos. Si Meta acepta, todos valen. Si rechaza, nombra el
 * culpable en el mensaje, se aparta y se vuelve a intentar con el resto.
 */
export async function comprobarCampos(
  candidatos: string[],
  rango: RangoFechas
): Promise<{ validos: string[]; rechazados: { campo: string; motivo: string }[] }> {
  const rechazados: { campo: string; motivo: string }[] = []
  let pendientes = [...candidatos]

  // Tope de vueltas: cada vuelta descarta al menos uno, así que no puede quedarse colgado.
  for (let vuelta = 0; vuelta < candidatos.length + 1; vuelta++) {
    if (pendientes.length === 0) break

    const r = await pedirInsights({ rango, campos: pendientes, limite: 1 })
    if (r.ok) return { validos: pendientes, rechazados }

    // Meta nombra el campo malo dentro del mensaje, pero hay que buscarlo con cuidado:
    // muchos nombres son subcadena de otros. `actions` está dentro de
    // `total_unique_actions`, así que una búsqueda simple acusaba al inocente y descartaba
    // una métrica que funciona perfectamente. Se busca como palabra completa y, si aun así
    // encajan varios, gana el más largo (el más específico).
    const culpable = pendientes
      .filter((c) => new RegExp(`(^|[^a-z_])${c}([^a-z_]|$)`).test(r.error))
      .sort((a, b) => b.length - a.length)[0]
    if (!culpable) {
      // No sabemos cuál falla: se devuelve lo que hay y el motivo, sin adivinar.
      return {
        validos: [],
        rechazados: [...rechazados, ...pendientes.map((c) => ({ campo: c, motivo: r.error }))],
      }
    }
    rechazados.push({ campo: culpable, motivo: r.error })
    pendientes = pendientes.filter((c) => c !== culpable)
  }

  return { validos: pendientes, rechazados }
}
