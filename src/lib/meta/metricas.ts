/**
 * Catálogo de métricas de Meta, VERIFICADO contra la cuenta de Capital Hub el 2026-08-07.
 *
 * No sale de la documentación: sale de preguntarle a Meta campo por campo qué acepta y qué
 * devuelve con datos. La documentación de Meta y lo que la API acepta no coinciden (hay
 * métricas que su centro de ayuda explica y que no salen en la tabla de campos, y al
 * revés), así que construir esto leyendo docs sería inventar.
 *
 * TRES GRUPOS:
 *   - `principal`: tienen datos en la cuenta y son las que se usan para decidir.
 *   - `avanzada`:  Meta las acepta pero hoy vienen vacías (no hay compras, no hay
 *                  experiencias instantáneas). Se enseñan aparte para no llenar la pantalla
 *                  de columnas en blanco.
 *   - `meta`:      no son métricas, son datos de la campaña (objetivo, moneda).
 *
 * FORMA DEL VALOR: Meta devuelve unas como texto suelto ("1735") y otras como lista
 * (`[{action_type, value}]`). Está marcado en `forma` para que la pantalla no tenga que
 * adivinarlo.
 */

export type GrupoMetrica = "principal" | "avanzada" | "meta"
export type FamiliaMetrica = "gasto" | "alcance" | "clics" | "conversiones" | "video" | "calidad"
export type FormaValor = "numero" | "dinero" | "porcentaje" | "lista" | "texto"

export type Metrica = {
  /** Nombre exacto que entiende Meta. */
  id: string
  /** Cómo se llama en pantalla. */
  nombre: string
  /** Qué mide, en una frase, sin tecnicismos. */
  explica: string
  grupo: GrupoMetrica
  familia: FamiliaMetrica
  forma: FormaValor
  /** Sale marcada de fábrica al entrar por primera vez. */
  porDefecto?: boolean
  /** Marco las pidió expresamente: van las primeras de la lista. */
  destacada?: boolean
}

export const METRICAS: readonly Metrica[] = [
  // ── LO QUE MARCO PIDIÓ EXPRESAMENTE ──
  {
    id: "unique_outbound_clicks_ctr",
    nombre: "CTR saliente único",
    explica:
      "De cada 100 personas que vieron el anuncio, cuántas salieron a nuestra web. Cuenta personas, no clics: si una hace clic tres veces, cuenta una.",
    grupo: "principal", familia: "clics", forma: "lista", porDefecto: true, destacada: true,
  },
  {
    id: "unique_outbound_clicks",
    nombre: "Clics salientes únicos",
    explica:
      "Cuántas personas distintas salieron del anuncio hacia nuestra web. Es el número real de gente que llegó, sin repetidos.",
    grupo: "principal", familia: "clics", forma: "lista", porDefecto: true, destacada: true,
  },
  {
    id: "cost_per_unique_outbound_click",
    nombre: "Coste por clic saliente único",
    explica: "Lo que cuesta traer a una persona distinta a nuestra web.",
    grupo: "principal", familia: "clics", forma: "lista", porDefecto: true, destacada: true,
  },

  // ── GASTO ──
  {
    id: "spend", nombre: "Gasto", explica: "Lo que llevas gastado en el periodo elegido.",
    grupo: "principal", familia: "gasto", forma: "dinero", porDefecto: true,
  },
  {
    id: "cpm", nombre: "CPM", explica: "Lo que cuesta que el anuncio se muestre 1.000 veces.",
    grupo: "principal", familia: "gasto", forma: "dinero", porDefecto: true,
  },
  {
    id: "cpp", nombre: "Coste por 1.000 personas",
    explica: "Lo que cuesta llegar a 1.000 personas distintas. No confundir con CPM, que cuenta veces mostrado.",
    grupo: "principal", familia: "gasto", forma: "dinero",
  },
  {
    id: "social_spend", nombre: "Gasto en social",
    explica: "La parte del gasto que fue a anuncios con interacción social visible.",
    grupo: "avanzada", familia: "gasto", forma: "dinero",
  },

  // ── ALCANCE ──
  {
    id: "impressions", nombre: "Impresiones",
    explica: "Cuántas veces se mostró el anuncio. Si a una persona se le muestra 3 veces, son 3.",
    grupo: "principal", familia: "alcance", forma: "numero", porDefecto: true,
  },
  {
    id: "reach", nombre: "Alcance",
    explica: "A cuántas personas distintas llegó. Aunque a una se le muestre 5 veces, cuenta una.",
    grupo: "principal", familia: "alcance", forma: "numero", porDefecto: true,
  },
  {
    id: "frequency", nombre: "Frecuencia",
    explica: "Cuántas veces vio el anuncio cada persona de media. Por encima de 3 empieza a cansar.",
    grupo: "principal", familia: "alcance", forma: "numero", porDefecto: true,
  },
  {
    id: "full_view_impressions", nombre: "Impresiones vistas del todo",
    explica: "Veces que el anuncio se mostró entero, no a medias.",
    grupo: "avanzada", familia: "alcance", forma: "numero",
  },
  {
    id: "full_view_reach", nombre: "Personas que lo vieron del todo",
    explica: "Personas distintas que vieron el anuncio entero.",
    grupo: "avanzada", familia: "alcance", forma: "numero",
  },

  // ── CLICS ──
  {
    id: "clicks", nombre: "Clics (todos)",
    explica: "Todos los clics, incluidos los que no llevan a la web: me gusta, comentar, ver más, abrir el perfil.",
    grupo: "principal", familia: "clics", forma: "numero",
  },
  {
    id: "ctr", nombre: "CTR (todos)",
    explica: "Porcentaje de clics sobre impresiones, contando todos los clics. Infla el número respecto al CTR saliente.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "cpc", nombre: "CPC (todos)", explica: "Coste medio de un clic, contando todos los clics.",
    grupo: "principal", familia: "clics", forma: "dinero",
  },
  {
    id: "outbound_clicks", nombre: "Clics salientes",
    explica: "Clics que sacaron a la persona de Facebook hacia nuestra web. Con repetidos.",
    grupo: "principal", familia: "clics", forma: "lista", porDefecto: true,
  },
  {
    id: "outbound_clicks_ctr", nombre: "CTR saliente",
    explica: "Porcentaje de clics que salieron hacia nuestra web, con repetidos.",
    grupo: "principal", familia: "clics", forma: "lista",
  },
  {
    id: "cost_per_outbound_click", nombre: "Coste por clic saliente",
    explica: "Lo que cuesta cada salida hacia nuestra web, con repetidos.",
    grupo: "principal", familia: "clics", forma: "lista",
  },
  {
    id: "unique_clicks", nombre: "Personas que hicieron clic",
    explica: "Personas distintas que hicieron algún clic, del tipo que sea.",
    grupo: "principal", familia: "clics", forma: "numero",
  },
  {
    id: "unique_ctr", nombre: "CTR por persona",
    explica: "Porcentaje de personas que hicieron algún clic sobre las que vieron el anuncio.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "cost_per_unique_click", nombre: "Coste por persona que hace clic",
    explica: "Lo que cuesta que una persona distinta haga clic.",
    grupo: "principal", familia: "clics", forma: "dinero",
  },
  {
    id: "inline_link_clicks", nombre: "Clics en el enlace",
    explica: "Clics en el enlace del anuncio concretamente, no en el resto de elementos.",
    grupo: "principal", familia: "clics", forma: "numero",
  },
  {
    id: "inline_link_click_ctr", nombre: "CTR del enlace",
    explica: "Porcentaje de clics en el enlace sobre impresiones.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "cost_per_inline_link_click", nombre: "Coste por clic en el enlace",
    explica: "Lo que cuesta cada clic en el enlace.",
    grupo: "principal", familia: "clics", forma: "dinero",
  },
  {
    id: "unique_inline_link_clicks", nombre: "Personas que pulsaron el enlace",
    explica: "Personas distintas que pulsaron el enlace del anuncio.",
    grupo: "principal", familia: "clics", forma: "numero",
  },
  {
    id: "unique_inline_link_click_ctr", nombre: "CTR del enlace por persona",
    explica: "Porcentaje de personas que pulsaron el enlace sobre las que vieron el anuncio.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "cost_per_unique_inline_link_click", nombre: "Coste por persona que pulsa el enlace",
    explica: "Lo que cuesta que una persona distinta pulse el enlace.",
    grupo: "principal", familia: "clics", forma: "dinero",
  },
  {
    id: "website_ctr", nombre: "CTR hacia la web",
    explica: "Porcentaje de clics que llevaron a la web, desglosado por tipo de enlace.",
    grupo: "avanzada", familia: "clics", forma: "lista",
  },

  // ── CONVERSIONES ──
  {
    id: "actions", nombre: "Resultados",
    explica: "Todo lo que hizo la gente y Meta cuenta: leads, visitas a la web, reacciones, mensajes.",
    grupo: "principal", familia: "conversiones", forma: "lista", porDefecto: true,
  },
  {
    id: "cost_per_action_type", nombre: "Coste por resultado",
    explica: "Lo que cuesta cada tipo de resultado. Aquí se lee el coste por lead.",
    grupo: "principal", familia: "conversiones", forma: "lista", porDefecto: true,
  },
  {
    id: "conversions", nombre: "Conversiones",
    explica: "Las conversiones que Meta cuenta como tales según la configuración de la campaña.",
    grupo: "principal", familia: "conversiones", forma: "lista",
  },
  {
    id: "cost_per_conversion", nombre: "Coste por conversión",
    explica: "Lo que cuesta cada conversión.",
    grupo: "principal", familia: "conversiones", forma: "lista",
  },
  {
    id: "action_values", nombre: "Valor de los resultados",
    explica: "Cuánto dinero generó cada tipo de resultado. Vacío hasta que se manden compras a Meta.",
    grupo: "avanzada", familia: "conversiones", forma: "lista",
  },
  {
    id: "purchase_roas", nombre: "ROAS",
    explica: "Cuánto ingresas por cada euro gastado. Vacío hasta que se manden compras a Meta.",
    grupo: "avanzada", familia: "conversiones", forma: "lista",
  },
  {
    id: "website_purchase_roas", nombre: "ROAS de la web",
    explica: "El ROAS contando solo compras en la web. Vacío hasta que se manden compras.",
    grupo: "avanzada", familia: "conversiones", forma: "lista",
  },

  // ── VÍDEO ──
  {
    id: "video_play_actions", nombre: "Reproducciones",
    explica: "Veces que se empezó a reproducir el vídeo.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_p25_watched_actions", nombre: "Llegaron al 25%",
    explica: "Cuántos vieron al menos la cuarta parte del vídeo.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_p50_watched_actions", nombre: "Llegaron a la mitad",
    explica: "Cuántos vieron al menos la mitad. Es el corte que mejor indica si el vídeo engancha.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_p75_watched_actions", nombre: "Llegaron al 75%",
    explica: "Cuántos vieron al menos tres cuartas partes.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_p100_watched_actions", nombre: "Lo vieron entero",
    explica: "Cuántos llegaron al final del vídeo.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_avg_time_watched_actions", nombre: "Tiempo medio visto",
    explica: "Cuántos segundos aguanta la gente de media.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_thruplay_watched_actions", nombre: "Reproducciones completas",
    explica: "Vieron el vídeo entero, o al menos 15 segundos si es largo. Es la métrica que Meta usa para cobrar.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "cost_per_thruplay", nombre: "Coste por reproducción completa",
    explica: "Lo que cuesta cada reproducción que llega al final.",
    grupo: "principal", familia: "video", forma: "lista",
  },

  // ── CALIDAD ──
  {
    id: "quality_ranking", nombre: "Calidad del anuncio",
    explica: "Cómo compara Meta la calidad de tu anuncio con otros que compiten por el mismo público. Necesita volumen para dejar de decir 'sin datos'.",
    grupo: "principal", familia: "calidad", forma: "texto",
  },
  {
    id: "engagement_rate_ranking", nombre: "Interacción esperada",
    explica: "Si tu anuncio genera más o menos interacción que la competencia.",
    grupo: "principal", familia: "calidad", forma: "texto",
  },
  {
    id: "conversion_rate_ranking", nombre: "Conversión esperada",
    explica: "Si tu anuncio convierte más o menos que la competencia.",
    grupo: "principal", familia: "calidad", forma: "texto",
  },
  {
    id: "estimated_ad_recall_rate", nombre: "Recuerdo del anuncio",
    explica: "Porcentaje estimado de gente que recordaría el anuncio a los dos días. Vacío: necesita campañas de notoriedad.",
    grupo: "avanzada", familia: "calidad", forma: "numero",
  },
  {
    id: "estimated_ad_recallers", nombre: "Personas que lo recordarían",
    explica: "Personas estimadas que recordarían el anuncio. Vacío: necesita campañas de notoriedad.",
    grupo: "avanzada", familia: "calidad", forma: "numero",
  },
] as const

/** Campos que NO son métricas: describen la campaña. Se piden siempre, no se eligen. */
export const CAMPOS_META = ["objective", "optimization_goal", "attribution_setting", "account_currency"]

/**
 * Rechazado por la API el 2026-08-07 pese a estar en la documentación. Aquí anotado para
 * que nadie lo vuelva a intentar creyendo que se olvidó.
 */
export const RECHAZADOS_POR_META = ["total_unique_actions"]

export const FAMILIAS: Record<FamiliaMetrica, string> = {
  gasto: "Gasto",
  alcance: "Alcance",
  clics: "Clics y CTR",
  conversiones: "Resultados",
  video: "Vídeo",
  calidad: "Calidad",
}

export function metricaPorId(id: string): Metrica | undefined {
  return METRICAS.find((m) => m.id === id)
}

export function metricasPorDefecto(): string[] {
  return METRICAS.filter((m) => m.porDefecto).map((m) => m.id)
}
