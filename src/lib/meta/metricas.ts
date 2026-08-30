/**
 * Catálogo de métricas de Meta, VERIFICADO contra la cuenta de Capital Hub el 2026-08-07.
 *
 * No sale de la documentación: sale de preguntarle a Meta campo por campo qué acepta y qué
 * devuelve con datos. La documentación de Meta y lo que la API acepta no coinciden (hay
 * métricas que su centro de ayuda explica y que no salen en la tabla de campos, y al
 * revés), así que construir esto leyendo docs sería inventar.
 *
 * LOS NOMBRES SON LOS DE FACEBOOK, LITERALES. No se traducen, no se acortan y no se
 * mejoran. Marco, 2026-08-28: "tienen que estar exactamente todas las métricas que están
 * en Facebook Ads con el mismo nombre". El motivo no es estético: si el panel dice "CTR por
 * persona" y Facebook dice "CTR único (todos)", nadie puede comparar las dos pantallas y el
 * panel deja de servir. Lo que explica qué mide cada una va en `explica`, nunca en el
 * nombre. Y NUNCA se le cuelga a una métrica una etiqueta que hable de quién la pidió.
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
 *
 * DE DÓNDE SALE EL NÚMERO (`fuente`): la mayoría son campos que se le piden a la API. Pero
 * las visitas a la página de destino y los clientes potenciales NO son campos: viven dentro
 * del bloque `actions`. Pedirlas como campo hace que Meta RECHACE la petición entera y el
 * panel se quede en blanco. Por eso van marcadas como `accion` y se calculan de `actions`.
 */

export type GrupoMetrica = "principal" | "avanzada" | "meta"
export type FamiliaMetrica = "gasto" | "alcance" | "clics" | "conversiones" | "video" | "calidad"
export type FormaValor = "numero" | "dinero" | "porcentaje" | "lista" | "texto"

/**
 * `campo`  → se le pide a Meta por su nombre y viene en la fila.
 * `accion` → no es un campo. Se saca del bloque `actions` o `cost_per_action_type`.
 */
export type FuenteMetrica = "campo" | "accion"

export type Metrica = {
  /** Nombre exacto que entiende Meta, o el id interno si es derivada de acciones. */
  id: string
  /** Cómo se llama EN FACEBOOK. Literal. */
  nombre: string
  /** Qué mide, en una frase, sin tecnicismos. */
  explica: string
  grupo: GrupoMetrica
  familia: FamiliaMetrica
  forma: FormaValor
  /**
   * Familia de variantes. Meta ofrece VARIAS versiones de la misma idea (nueve CTR
   * distintos, siete formas de contar clics). Esto las agrupa para poder enseñarlas
   * juntas y explicar en qué se diferencian, en vez de soltar 50 nombres sueltos.
   */
  base: string
  /** Sale marcada de fábrica al entrar por primera vez. */
  porDefecto?: boolean
  /** De dónde sale el número. Sin poner = `campo`. */
  fuente?: FuenteMetrica
  /**
   * Solo para las de `fuente: "accion"`. Los `action_type` de Meta que valen, EN ORDEN DE
   * PRIORIDAD. Se coge el primero que exista, NO se suman: Meta devuelve el mismo hecho con
   * varios nombres y unos contienen a otros (`lead` ya incluye `onsite_web_lead`). Sumarlos
   * cuenta el mismo lead tres veces. Está contado en `panel.ts`.
   */
  acciones?: readonly string[]
  /** Solo para `fuente: "accion"`: de qué bloque se lee. */
  bloque?: "actions" | "cost_per_action_type"
}

export const METRICAS: readonly Metrica[] = [
  // ── GASTO ──
  {
    id: "spend", base: "Gasto", nombre: "Importe gastado",
    explica: "Lo que llevas gastado en el periodo elegido.",
    grupo: "principal", familia: "gasto", forma: "dinero", porDefecto: true,
  },
  {
    id: "cpm", base: "Gasto", nombre: "CPM (coste por mil impresiones)",
    explica: "Lo que cuesta que el anuncio se muestre 1.000 veces.",
    grupo: "principal", familia: "gasto", forma: "dinero", porDefecto: true,
  },
  {
    id: "cpp", base: "Gasto", nombre: "CPP (coste por mil personas alcanzadas)",
    explica: "Lo que cuesta llegar a 1.000 personas distintas. No es lo mismo que el CPM, que cuenta veces mostrado.",
    grupo: "principal", familia: "gasto", forma: "dinero",
  },
  {
    id: "social_spend", base: "Gasto", nombre: "Importe gastado en social",
    explica: "La parte del gasto que fue a anuncios con interacción social visible.",
    grupo: "avanzada", familia: "gasto", forma: "dinero",
  },

  // ── ALCANCE ──
  {
    id: "impressions", base: "Alcance", nombre: "Impresiones",
    explica: "Cuántas veces se mostró el anuncio. Si a una persona se le muestra 3 veces, son 3.",
    grupo: "principal", familia: "alcance", forma: "numero", porDefecto: true,
  },
  {
    id: "reach", base: "Alcance", nombre: "Alcance",
    explica: "A cuántas personas distintas llegó. Aunque a una se le muestre 5 veces, cuenta una.",
    grupo: "principal", familia: "alcance", forma: "numero", porDefecto: true,
  },
  {
    id: "frequency", base: "Alcance", nombre: "Frecuencia",
    explica: "Cuántas veces vio el anuncio cada persona de media. Por encima de 3 empieza a cansar.",
    grupo: "principal", familia: "alcance", forma: "numero", porDefecto: true,
  },
  {
    id: "full_view_impressions", base: "Alcance", nombre: "Impresiones con visualización completa",
    explica: "Veces que el anuncio se mostró entero, no a medias.",
    grupo: "avanzada", familia: "alcance", forma: "numero",
  },
  {
    id: "full_view_reach", base: "Alcance", nombre: "Alcance con visualización completa",
    explica: "Personas distintas que vieron el anuncio entero.",
    grupo: "avanzada", familia: "alcance", forma: "numero",
  },

  // ── CLICS Y CTR ──
  {
    id: "clicks", base: "Clics", nombre: "Clics (todos)",
    explica: "Todos los clics, incluidos los que no llevan a la web: me gusta, comentar, ver más, abrir el perfil.",
    grupo: "principal", familia: "clics", forma: "numero",
  },
  {
    id: "ctr", base: "CTR", nombre: "CTR (todos)",
    explica: "Porcentaje de clics sobre impresiones, contando todos los clics. Sale más alto que el CTR saliente.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "cpc", base: "Coste por clic", nombre: "CPC (todos)",
    explica: "Coste medio de un clic, contando todos los clics.",
    grupo: "principal", familia: "clics", forma: "dinero",
  },
  {
    id: "unique_clicks", base: "Clics", nombre: "Clics únicos (todos)",
    explica: "Personas distintas que hicieron algún clic, del tipo que sea. Si una hace tres clics, cuenta una.",
    grupo: "principal", familia: "clics", forma: "numero",
  },
  {
    id: "unique_ctr", base: "CTR", nombre: "CTR único (todos)",
    explica: "De cada 100 personas que vieron el anuncio, cuántas hicieron algún clic.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "cost_per_unique_click", base: "Coste por clic", nombre: "CPC único (todos)",
    explica: "Lo que cuesta que una persona distinta haga clic.",
    grupo: "principal", familia: "clics", forma: "dinero",
  },
  {
    id: "outbound_clicks", base: "Clics", nombre: "Clics salientes",
    explica: "Clics que sacaron a la persona de Facebook hacia nuestra web. Con repetidos.",
    grupo: "principal", familia: "clics", forma: "lista", porDefecto: true,
  },
  {
    id: "outbound_clicks_ctr", base: "CTR", nombre: "CTR saliente",
    explica: "Porcentaje de clics que salieron hacia nuestra web, con repetidos.",
    grupo: "principal", familia: "clics", forma: "lista",
  },
  {
    id: "cost_per_outbound_click", base: "Coste por clic", nombre: "Coste por clic saliente",
    explica: "Lo que cuesta cada salida hacia nuestra web, con repetidos.",
    grupo: "principal", familia: "clics", forma: "lista",
  },
  {
    id: "unique_outbound_clicks", base: "Clics", nombre: "Clics salientes únicos",
    explica: "Cuántas personas distintas salieron del anuncio hacia nuestra web. Es la gente real que llegó, sin repetidos.",
    grupo: "principal", familia: "clics", forma: "lista", porDefecto: true,
  },
  {
    id: "unique_outbound_clicks_ctr", base: "CTR", nombre: "CTR saliente único",
    explica: "De cada 100 personas que vieron el anuncio, cuántas salieron a nuestra web. Cuenta personas, no clics.",
    grupo: "principal", familia: "clics", forma: "lista", porDefecto: true,
  },
  {
    id: "cost_per_unique_outbound_click", base: "Coste por clic", nombre: "Coste por clic saliente único",
    explica: "Lo que cuesta traer a una persona distinta a nuestra web.",
    grupo: "principal", familia: "clics", forma: "lista", porDefecto: true,
  },
  {
    id: "inline_link_clicks", base: "Clics", nombre: "Clics en el enlace",
    explica: "Clics en el enlace del anuncio concretamente, no en el resto de elementos.",
    grupo: "principal", familia: "clics", forma: "numero",
  },
  {
    id: "inline_link_click_ctr", base: "CTR", nombre: "CTR (porcentaje de clics en el enlace)",
    explica: "Porcentaje de clics en el enlace sobre impresiones.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "cost_per_inline_link_click", base: "Coste por clic", nombre: "CPC (coste por clic en el enlace)",
    explica: "Lo que cuesta cada clic en el enlace.",
    grupo: "principal", familia: "clics", forma: "dinero",
  },
  {
    id: "unique_inline_link_clicks", base: "Clics", nombre: "Clics únicos en el enlace",
    explica: "Personas distintas que pulsaron el enlace del anuncio.",
    grupo: "principal", familia: "clics", forma: "numero",
  },
  {
    id: "unique_inline_link_click_ctr", base: "CTR", nombre: "CTR único (porcentaje de clics en el enlace)",
    explica: "De cada 100 personas que vieron el anuncio, cuántas pulsaron el enlace.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "cost_per_unique_inline_link_click", base: "Coste por clic", nombre: "Coste por clic único en el enlace",
    explica: "Lo que cuesta que una persona distinta pulse el enlace.",
    grupo: "principal", familia: "clics", forma: "dinero",
  },
  {
    id: "unique_link_clicks_ctr", base: "CTR", nombre: "CTR único del enlace",
    explica: "De cada 100 personas que vieron el anuncio, cuántas pulsaron un enlace. Cuenta personas, no pulsaciones.",
    grupo: "principal", familia: "clics", forma: "porcentaje",
  },
  {
    id: "website_ctr", base: "CTR", nombre: "CTR del sitio web",
    explica: "Porcentaje de clics que llevaron a la web, desglosado por tipo de enlace.",
    grupo: "avanzada", familia: "clics", forma: "lista",
  },

  // ── RESULTADOS ──
  // Las cuatro primeras NO son campos de la API: salen del bloque `actions`. Ver `fuente`.
  {
    id: "landing_page_views", base: "Resultados", nombre: "Visitas a la página de destino",
    explica: "Cuántas veces se cargó del todo la página a la que lleva el anuncio. Siempre es menos que los clics: parte de la gente se va antes de que cargue.",
    grupo: "principal", familia: "conversiones", forma: "numero", porDefecto: true,
    fuente: "accion", bloque: "actions", acciones: ["landing_page_view", "omni_landing_page_view"],
  },
  {
    id: "cost_per_landing_page_view", base: "Coste por resultado", nombre: "Coste por visita a la página de destino",
    explica: "Lo que cuesta que una persona llegue a cargar la página entera.",
    grupo: "principal", familia: "conversiones", forma: "dinero",
    fuente: "accion", bloque: "cost_per_action_type", acciones: ["landing_page_view", "omni_landing_page_view"],
  },
  {
    id: "leads", base: "Resultados", nombre: "Clientes potenciales",
    explica: "Cuánta gente dejó sus datos. Es el resultado que persiguen las campañas de leads.",
    grupo: "principal", familia: "conversiones", forma: "numero", porDefecto: true,
    fuente: "accion", bloque: "actions", acciones: ["lead", "onsite_web_lead", "offsite_conversion.fb_pixel_lead"],
  },
  {
    id: "cost_per_lead", base: "Coste por resultado", nombre: "Coste por cliente potencial",
    explica: "Lo que cuesta conseguir que una persona deje sus datos.",
    grupo: "principal", familia: "conversiones", forma: "dinero", porDefecto: true,
    fuente: "accion", bloque: "cost_per_action_type", acciones: ["lead", "onsite_web_lead", "offsite_conversion.fb_pixel_lead"],
  },
  {
    id: "actions", base: "Resultados", nombre: "Resultados",
    explica: "Todo lo que hizo la gente y Meta cuenta: clientes potenciales, visitas a la web, reacciones, mensajes.",
    grupo: "principal", familia: "conversiones", forma: "lista",
  },
  {
    id: "cost_per_action_type", base: "Coste por resultado", nombre: "Coste por resultado",
    explica: "Lo que cuesta cada tipo de resultado.",
    grupo: "principal", familia: "conversiones", forma: "lista",
  },
  {
    id: "conversions", base: "Resultados", nombre: "Conversiones",
    explica: "Las conversiones que Meta cuenta como tales según la configuración de la campaña.",
    grupo: "principal", familia: "conversiones", forma: "lista",
  },
  {
    id: "cost_per_conversion", base: "Coste por resultado", nombre: "Coste por conversión",
    explica: "Lo que cuesta cada conversión.",
    grupo: "principal", familia: "conversiones", forma: "lista",
  },
  {
    id: "action_values", base: "Resultados", nombre: "Valor de conversión",
    explica: "Cuánto dinero generó cada tipo de resultado. Vacío hasta que se manden compras a Meta.",
    grupo: "avanzada", familia: "conversiones", forma: "lista",
  },
  {
    id: "purchase_roas", base: "Resultados", nombre: "ROAS de la compra",
    explica: "Cuánto ingresas por cada euro gastado. Vacío hasta que se manden compras a Meta.",
    grupo: "avanzada", familia: "conversiones", forma: "lista",
  },
  {
    id: "website_purchase_roas", base: "Resultados", nombre: "ROAS de las compras en el sitio web",
    explica: "El ROAS contando solo compras en la web. Vacío hasta que se manden compras.",
    grupo: "avanzada", familia: "conversiones", forma: "lista",
  },

  // ── VÍDEO ──
  {
    id: "video_play_actions", base: "Vídeo", nombre: "Reproducciones de vídeo",
    explica: "Veces que se empezó a reproducir el vídeo.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_p25_watched_actions", base: "Vídeo", nombre: "Reproducciones de vídeo hasta el 25%",
    explica: "Cuántos vieron al menos la cuarta parte del vídeo.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_p50_watched_actions", base: "Vídeo", nombre: "Reproducciones de vídeo hasta el 50%",
    explica: "Cuántos vieron al menos la mitad. Es el corte que mejor indica si el vídeo engancha.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_p75_watched_actions", base: "Vídeo", nombre: "Reproducciones de vídeo hasta el 75%",
    explica: "Cuántos vieron al menos tres cuartas partes.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_p100_watched_actions", base: "Vídeo", nombre: "Reproducciones de vídeo hasta el 100%",
    explica: "Cuántos llegaron al final del vídeo.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_avg_time_watched_actions", base: "Vídeo", nombre: "Tiempo medio de reproducción del vídeo",
    explica: "Cuántos segundos aguanta la gente de media.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "video_thruplay_watched_actions", base: "Vídeo", nombre: "ThruPlays",
    explica: "Vieron el vídeo entero, o al menos 15 segundos si es largo. Es la métrica con la que Meta cobra el vídeo.",
    grupo: "principal", familia: "video", forma: "lista",
  },
  {
    id: "cost_per_thruplay", base: "Vídeo", nombre: "Coste por ThruPlay",
    explica: "Lo que cuesta cada reproducción que llega al final.",
    grupo: "principal", familia: "video", forma: "lista",
  },

  // ── CALIDAD ──
  {
    id: "quality_ranking", base: "Calidad", nombre: "Clasificación de calidad",
    explica: "Cómo compara Meta la calidad de tu anuncio con otros que compiten por el mismo público. Necesita volumen para dejar de decir 'sin datos'.",
    grupo: "principal", familia: "calidad", forma: "texto",
  },
  {
    id: "engagement_rate_ranking", base: "Calidad", nombre: "Clasificación de la tasa de interacción",
    explica: "Si tu anuncio genera más o menos interacción que la competencia.",
    grupo: "principal", familia: "calidad", forma: "texto",
  },
  {
    id: "conversion_rate_ranking", base: "Calidad", nombre: "Clasificación de la tasa de conversión",
    explica: "Si tu anuncio convierte más o menos que la competencia.",
    grupo: "principal", familia: "calidad", forma: "texto",
  },
  {
    id: "estimated_ad_recall_rate", base: "Calidad", nombre: "Tasa de aumento estimado del recuerdo del anuncio (%)",
    explica: "Porcentaje estimado de gente que recordaría el anuncio a los dos días. Vacío: necesita campañas de notoriedad.",
    grupo: "avanzada", familia: "calidad", forma: "numero",
  },
  {
    id: "estimated_ad_recallers", base: "Calidad", nombre: "Aumento estimado del recuerdo del anuncio (personas)",
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

/** Las que se calculan del bloque de acciones en vez de pedirse como campo. */
export const METRICAS_DE_ACCION: readonly Metrica[] = METRICAS.filter((m) => m.fuente === "accion")

/**
 * Los ids que SÍ se le pueden pedir a Meta como campo.
 *
 * Las de `fuente: "accion"` se quedan fuera a propósito: no son campos válidos y meter una
 * sola de ellas en `fields` hace que Meta devuelva error y el panel entero se quede en
 * blanco. Se calculan después, de `actions` y `cost_per_action_type`, que sí se piden.
 */
export function camposPedibles(): string[] {
  return METRICAS.filter((m) => m.fuente !== "accion").map((m) => m.id)
}

export function metricaPorId(id: string): Metrica | undefined {
  return METRICAS.find((m) => m.id === id)
}

export function metricasPorDefecto(): string[] {
  return METRICAS.filter((m) => m.porDefecto).map((m) => m.id)
}

/**
 * Las métricas agrupadas por familia de variantes, para poder enseñar de una
 * "CTR: 9 versiones distintas" con la diferencia de cada una al lado.
 */
export function porFamiliaDeVariantes(): { base: string; metricas: Metrica[] }[] {
  const mapa = new Map<string, Metrica[]>()
  for (const m of METRICAS) {
    const lista = mapa.get(m.base) ?? []
    lista.push(m)
    mapa.set(m.base, lista)
  }
  // Las familias con más variantes arriba: son las que de verdad hay que explicar.
  return [...mapa.entries()]
    .map(([base, metricas]) => ({ base, metricas }))
    .sort((a, b) => b.metricas.length - a.metricas.length)
}
