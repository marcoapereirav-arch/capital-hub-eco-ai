/**
 * Configuración del Funnel Webinar (lanzamiento del 8 de agosto, webinar en directo).
 *
 * Flujo (decidido en la reunión de marketing del 24-jul-2026):
 *   Anuncios → /webinar (página 1: mini-VSL de presentación del evento + opt-in) →
 *   /webinar/gracias → botón a WhatsApp PRIVADO de Adrián con mensaje predefinido
 *   ("quiero acceder al evento"). En cuanto el lead ENVÍA ese WhatsApp, el trabajo de
 *   este funnel se considera cumplido: a partir de ahí Adrián / el equipo hacen el
 *   setting manual (su propia automatización, FUERA de este funnel).
 *
 * Valores centralizados (editables sin deploy desde el ⚙️ de /webs, key 'funnel:webinar'):
 *   - VIDEO_GUID: GUID de la mini-VSL en Bunny. Vacío = el hueco se pinta con un
 *       placeholder de marca; en cuanto se pega el GUID, el vídeo aparece sin tocar código.
 *   - WHATSAPP_NUMBER: número de Adrián (solo dígitos con prefijo, sin + ni espacios).
 *   - WHATSAPP_MESSAGE: mensaje predefinido que el lead envía al pulsar el botón de la gracias.
 *   - WEBINAR_DATE_LABEL: fecha/hora que se muestra en la landing.
 *   - INSTAGRAM_HANDLE: usuario IG de Adrián (sin @), para el pie/soporte.
 */
export const FUNNEL_WEBINAR = {
  VIDEO_GUID: "",
  BUNNY_LIBRARY_ID: "686883",
  WHATSAPP_NUMBER: "34611874062",
  WHATSAPP_MESSAGE: "Hola Adrián, quiero acceder al evento del 8 de agosto.",
  WEBINAR_DATE_LABEL: "8 de agosto · en directo",
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
