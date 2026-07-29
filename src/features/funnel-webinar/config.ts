/**
 * Configuración del Funnel Webinar (webinar en directo, recurrente).
 *
 * Flujo (decidido en la reunión de marketing del 24-jul-2026):
 *   Anuncios → /webinar (página 1: mini-VSL de presentación del evento + opt-in) →
 *   /webinar/gracias → botón a WhatsApp PRIVADO de Adrián con mensaje predefinido. En
 *   cuanto el lead ENVÍA ese WhatsApp, el trabajo de este funnel se considera cumplido:
 *   a partir de ahí se nutre a la persona DENTRO del chat. El resto (grupo, sorteo, etc.)
 *   NO es parte de este funnel y NO se documenta como proceso.
 *
 * Valores centralizados (editables sin deploy desde el ⚙️ de /webs, key 'funnel:webinar'):
 *   - VIDEO_GUID: GUID de la mini-VSL en Bunny. Vacío = placeholder de marca.
 *   - WHATSAPP_NUMBER: número de Adrián (solo dígitos con prefijo, sin + ni espacios).
 *   - WHATSAPP_MESSAGE: mensaje predefinido que el lead envía al pulsar el botón. SIN fecha
 *       (la fecha vive en WEBINAR_DATE, no se escribe a mano en el mensaje). Editable: al
 *       cambiarlo en el ⚙️ se refleja al instante en el botón y en el correo.
 *   - WEBINAR_DATE: fecha REAL del webinar (ISO 'YYYY-MM-DD'). Fuente única: alimenta el
 *       tag (`whatsapp-webinar-DD_MM_YYYY`) Y la fecha que se muestra en la landing. Se
 *       cambia en UN solo sitio; como hacemos webinars de forma constante, al cambiarla el
 *       tag del siguiente webinar cambia solo.
 *   - WEBINAR_DATE_LABEL_OVERRIDE: texto opcional para la landing (ej. "8 de agosto · 19:00h").
 *       Vacío = se arma solo desde WEBINAR_DATE. NO afecta al tag.
 *   - EMAIL_WHATSAPP: si el correo de confirmación incluye o no el botón de WhatsApp.
 *   - INSTAGRAM_HANDLE: usuario IG de Adrián (sin @), para el pie/soporte.
 */
export const FUNNEL_WEBINAR = {
  VIDEO_GUID: "",
  BUNNY_LIBRARY_ID: "686883",
  WHATSAPP_NUMBER: "34611874062",
  WHATSAPP_MESSAGE: "Hola Adrián, quiero acceder al evento.",
  WEBINAR_DATE: "2026-08-08",
  WEBINAR_DATE_LABEL_OVERRIDE: "",
  EMAIL_WHATSAPP: true,
  INSTAGRAM_HANDLE: "adrianvillanuevarios",
} as const

export function instagramLink(handle: string = FUNNEL_WEBINAR.INSTAGRAM_HANDLE) {
  return `https://instagram.com/${handle}`
}

/** Embed de Bunny Stream para la mini-VSL (mismo patrón que el resto de funnels). */
export function bunnyEmbedUrl(guid: string, libraryId: string = FUNNEL_WEBINAR.BUNNY_LIBRARY_ID) {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}?autoplay=false&preload=true&responsive=true`
}

/**
 * Link a WhatsApp PRIVADO con mensaje predefinido: es el handoff de la página de gracias.
 * Al pulsarlo se abre WhatsApp con el chat de Adrián y el mensaje ya escrito; el lead solo
 * pulsa enviar. Ese envío es el punto de éxito del funnel.
 */
export function whatsappLink(
  number: string = FUNNEL_WEBINAR.WHATSAPP_NUMBER,
  message: string = FUNNEL_WEBINAR.WHATSAPP_MESSAGE,
) {
  const digits = number.replace(/\D/g, "")
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

// ── Fecha del webinar → tag + etiqueta legible ──────────────────────────────
// Parseo manual de la fecha ISO (sin `new Date`) para que NO haya saltos de día
// por zona horaria y el resultado sea 100% determinista.

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

function parseISODate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((iso ?? "").trim())
  if (!match) return null
  const y = Number(match[1]); const m = Number(match[2]); const d = Number(match[3])
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return { y, m, d }
}

/**
 * Nombre del tag que se pone al lead cuando toca WhatsApp: `whatsapp-webinar-DD_MM_YYYY`
 * con la fecha del webinar al que accedió. Ej: `whatsapp-webinar-08_08_2026`. Al cambiar
 * WEBINAR_DATE (siguiente webinar), el tag cambia solo. Si la fecha viene corrupta, usa el
 * default para no romper nunca el tag.
 */
export function webinarTagName(isoDate: string = FUNNEL_WEBINAR.WEBINAR_DATE): string {
  const p = parseISODate(isoDate) ?? parseISODate(FUNNEL_WEBINAR.WEBINAR_DATE)!
  const dd = String(p.d).padStart(2, "0")
  const mm = String(p.m).padStart(2, "0")
  return `whatsapp-webinar-${dd}_${mm}_${p.y}`
}

/** Etiqueta legible de la fecha para la landing/gracias/correo. Ej: "8 de agosto". */
export function webinarDateLabel(isoDate: string = FUNNEL_WEBINAR.WEBINAR_DATE): string {
  const p = parseISODate(isoDate)
  if (!p) return ""
  return `${p.d} de ${MESES_ES[p.m - 1] ?? ""}`.trim()
}
