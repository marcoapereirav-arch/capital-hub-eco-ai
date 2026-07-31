/**
 * Catálogo único de funnels y los eventos que debe disparar cada uno.
 *
 * Fuente de verdad compartida: la usa el servidor para saber de qué funnel viene un
 * evento, y la pantalla de Ads para saber qué DEBERÍA estar llegando y pintar la luz
 * verde o roja. Si un funnel nuevo no se añade aquí, no aparece en la revisión.
 *
 * Los eventos están fijados en el SOP marketing/09-eventos-meta-catalogo.
 */

/**
 * `automatico` es PageView: lo dispara el píxel solo al cargar cualquier página, y NO pasa
 * por nuestro servidor, así que nunca aparece en el registro de envíos. Eso no significa
 * que no funcione: significa que no lo mandamos nosotros. Se marca aparte para que en
 * pantalla no salga como "sin estrenar", que sería mentira.
 */
export type FunnelEventSpec = {
  /** Nombre exacto que se manda a Meta. */
  name: string
  /** Qué acción del usuario lo dispara, en lenguaje normal. */
  when: string
  /** Estándar de Meta (optimiza campañas), nuestro (audiencias finas) o automático del píxel. */
  kind: "estandar" | "nuestro" | "automatico"
}

export type FunnelSpec = {
  slug: string
  label: string
  /** Prefijo de ruta pública por el que se reconoce el funnel en la URL del evento. */
  path: string
  /** Evento hacia el que debe optimizar la campaña de Facebook Ads. */
  optimizeFor: string | null
  events: FunnelEventSpec[]
}

export const FUNNEL_CATALOG: readonly FunnelSpec[] = [
  {
    slug: "webinar",
    label: "Clase en directo",
    path: "/webinar",
    optimizeFor: "Lead",
    events: [
      { name: "PageView", when: "Entró a cualquier página del funnel", kind: "automatico" },
      { name: "ViewContent", when: "Vio la landing de la clase", kind: "estandar" },
      { name: "Lead", when: "Dejó sus datos", kind: "estandar" },
      { name: "webinar_lead", when: "Dejó sus datos", kind: "nuestro" },
      { name: "Contact", when: "Tocó el botón de WhatsApp", kind: "estandar" },
    ],
  },
  {
    slug: "reservar",
    label: "Reserva de sesión",
    path: "/reservar",
    optimizeFor: "Schedule",
    events: [
      { name: "PageView", when: "Entró a cualquier página del funnel", kind: "automatico" },
      { name: "ViewContent", when: "Vio la página de reserva", kind: "estandar" },
      { name: "Schedule", when: "Reservó la llamada", kind: "estandar" },
      { name: "agenda_reserva", when: "Reservó la llamada", kind: "nuestro" },
    ],
  },
  {
    slug: "test-personalidad",
    label: "Test de personalidad",
    path: "/test-personalidad",
    optimizeFor: "Lead",
    events: [
      { name: "PageView", when: "Entró a cualquier página del funnel", kind: "automatico" },
      { name: "Lead", when: "Dejó sus datos", kind: "estandar" },
      { name: "test_personalidad_lead", when: "Dejó sus datos", kind: "nuestro" },
      { name: "test_personalidad_cualificado", when: "Abrió el test desde el email", kind: "nuestro" },
    ],
  },
  {
    slug: "mifge",
    label: "MIFGE (histórico)",
    path: "/mifge",
    optimizeFor: null,
    events: [{ name: "mifge_lead", when: "Dejó sus datos", kind: "nuestro" }],
  },
  {
    slug: "lt8",
    label: "LT8 (histórico)",
    path: "/lt8",
    optimizeFor: null,
    events: [],
  },
] as const

/** Todos los nombres de evento que el sistema espera ver de algún funnel. */
export function allExpectedEventNames(): string[] {
  return [...new Set(FUNNEL_CATALOG.flatMap((f) => f.events.map((e) => e.name)))]
}

export function funnelBySlug(slug: string): FunnelSpec | undefined {
  return FUNNEL_CATALOG.find((f) => f.slug === slug)
}
