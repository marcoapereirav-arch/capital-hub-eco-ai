/**
 * Catálogo COMPLETO de eventos de Meta, con la decisión de Capital Hub sobre cada uno.
 *
 * Meta define 17 eventos estándar más `PageView`, que va aparte porque lo dispara el píxel
 * solo al instalarse. Aquí están los 18, ninguno escondido, cada uno con qué significa para
 * Meta, qué decidimos nosotros y por qué.
 *
 * Está pensado para que lo lea un profesional de marketing y entienda la estrategia entera
 * sin preguntar nada. Fuente de las definiciones: documentación oficial de Meta Pixel
 * (verificada 2026-07-31). Fuente de las decisiones: SOP marketing/09.
 */

export type UsoEvento = "usamos" | "reservado" | "descartado"

export type EventoMeta = {
  /** Nombre exacto que entiende Meta. */
  name: string
  /** Qué significa para Meta, en su definición. */
  significa: string
  uso: UsoEvento
  /** Qué hacemos nosotros con él, y por qué. */
  decision: string
  /** Solo para los que usamos: dónde salta exactamente. */
  donde?: string
  /** Solo para los que usamos: para qué sirve en la estrategia. */
  paraQue?: string
}

export const EVENTOS_META: readonly EventoMeta[] = [
  // ── LOS QUE USAMOS ──
  {
    name: "PageView",
    significa: "Alguien cargó una página donde está instalado el píxel.",
    uso: "usamos",
    donde: "Todas las páginas públicas. Lo dispara el píxel solo, no hay que programarlo.",
    paraQue:
      "Es la base del retargeting: el público más amplio posible. No indica intención, solo presencia. Sirve para construir la audiencia de la que luego se sacan las buenas.",
    decision:
      "Activo en todas las páginas. Es gratis en esfuerzo y sin él no existe ninguna audiencia de retargeting.",
  },
  {
    name: "ViewContent",
    significa: "Alguien vio una página relevante, como una ficha de producto o una landing.",
    uso: "usamos",
    donde: "Landing de la clase en directo y página de reserva de sesión.",
    paraQue:
      "Separa a quien vio LA OFERTA de quien solo pasó por la web. Es la audiencia de retargeting que de verdad convierte, y la base para públicos similares de calidad.",
    decision:
      "Lo disparamos a mano solo donde está la oferta. Sin esta separación, las audiencias mezclan a quien leyó el aviso legal con quien vio la landing, y el algoritmo aprende de la persona equivocada.",
  },
  {
    name: "Lead",
    significa: "Alguien completó un registro de interés y pasa a ser cliente potencial.",
    uso: "usamos",
    donde: "Al enviar el formulario de la clase en directo y el del test de personalidad.",
    paraQue:
      "Es el objetivo de conversión de las campañas de captación. Meta tiene un modelo entrenado con este evento a escala global, así que la campaña sale de la fase de aprendizaje mucho antes que con un evento inventado.",
    decision:
      "Objetivo de optimización del funnel de la clase en directo. Una acción, un solo evento estándar.",
  },
  {
    name: "Schedule",
    significa: "Alguien reservó una cita con el negocio.",
    uso: "usamos",
    donde: "En el instante en que Calendly confirma día y hora, antes de la página de gracias.",
    paraQue:
      "Es el objetivo de conversión de la campaña de agenda. Al ser un evento más abajo del embudo que Lead, la campaña optimiza hacia gente que de verdad se sienta, no solo hacia quien deja el correo.",
    decision:
      "Objetivo de optimización del funnel de reserva. No depende del webhook de Calendly: se engancha al aviso que Calendly manda a la propia página.",
  },
  {
    name: "Contact",
    significa: "Alguien inició contacto con el negocio por teléfono, correo, chat o SMS.",
    uso: "usamos",
    donde: "Al pulsar el botón de WhatsApp en la página de gracias de la clase.",
    paraQue:
      "Es la señal de intención más alta que podemos capturar sin entrar en la conversación. Sirve para crear públicos similares de altísima calidad y para medir qué creativo trae gente que de verdad escribe.",
    decision:
      "Activo. No vemos la conversación, pero sí el momento exacto en que la persona decide escribir, que es lo que importa para optimizar.",
  },

  // ── RESERVADOS ──
  {
    name: "InitiateCheckout",
    significa: "Alguien entró en el proceso de pago.",
    uso: "reservado",
    decision:
      "Preparado en el código pero sin disparar. Hoy el cobro no ocurre dentro del OS. En cuanto haya checkout propio, se enciende sin tocar nada más.",
  },
  {
    name: "Purchase",
    significa: "Alguien completó una compra.",
    uso: "reservado",
    decision:
      "Preparado pero sin disparar, por el mismo motivo. Es el evento que permitirá optimizar por retorno real y no por volumen de leads. Es el salto más importante que le queda a este sistema.",
  },

  // ── DESCARTADOS ──
  {
    name: "CompleteRegistration",
    significa: "Alguien envió un formulario de alta o suscripción completo.",
    uso: "descartado",
    decision:
      "NO se usa en el opt-in, y esto es deliberado. En la clase en directo no se crea ninguna cuenta: se dejan unos datos. Eso es Lead. Disparar los dos por la misma acción duplicaría las conversiones, dejaría el coste por lead a la mitad del real y partiría en dos el aprendizaje del algoritmo. Su sitio natural es el alta del alumno en la App, cuando se conecte.",
  },
  {
    name: "StartTrial",
    significa: "Alguien empezó una prueba gratuita.",
    uso: "descartado",
    decision: "No hay prueba gratuita en la oferta actual. Se usó en el funnel MIFGE, hoy retirado.",
  },
  {
    name: "Subscribe",
    significa: "Alguien empezó una suscripción de pago.",
    uso: "descartado",
    decision:
      "Hoy la venta es high ticket de pago único. Cuando existan suscripciones, este evento entra junto con Purchase.",
  },
  {
    name: "SubmitApplication",
    significa: "Alguien envió una solicitud a un producto, servicio o programa.",
    uso: "descartado",
    decision:
      "Encajaría si hubiera un formulario de admisión con criterios de entrada. Hoy la cualificación ocurre en la llamada, no en la web, así que no hay momento que medir.",
  },
  {
    name: "AddToCart",
    significa: "Alguien añadió un producto al carrito.",
    uso: "descartado",
    decision: "No hay carrito. Es de comercio electrónico.",
  },
  {
    name: "AddToWishlist",
    significa: "Alguien añadió un producto a favoritos.",
    uso: "descartado",
    decision: "No hay favoritos. Es de comercio electrónico.",
  },
  {
    name: "AddPaymentInfo",
    significa: "Alguien introdujo sus datos de pago durante el checkout.",
    uso: "descartado",
    decision: "No hay checkout propio todavía. Entraría con Purchase si algún día hace falta ese detalle.",
  },
  {
    name: "CustomizeProduct",
    significa: "Alguien personalizó un producto, por ejemplo eligiendo color.",
    uso: "descartado",
    decision: "No aplica a formación.",
  },
  {
    name: "Search",
    significa: "Alguien hizo una búsqueda dentro del sitio.",
    uso: "descartado",
    decision: "Las landings no tienen buscador.",
  },
  {
    name: "FindLocation",
    significa: "Alguien buscó una tienda física.",
    uso: "descartado",
    decision: "El negocio es cien por cien digital.",
  },
  {
    name: "Donate",
    significa: "Alguien hizo una donación.",
    uso: "descartado",
    decision: "No aplica.",
  },
] as const

export const USO_META: Record<UsoEvento, { label: string; explica: string }> = {
  usamos: {
    label: "En uso",
    explica: "Disparándose ahora mismo en producción, por píxel y por API.",
  },
  reservado: {
    label: "Reservado",
    explica: "Escrito en el código pero apagado. Se enciende cuando exista el momento que mide.",
  },
  descartado: {
    label: "Descartado",
    explica: "No encaja con este negocio. Aquí está el motivo de cada uno.",
  },
}
