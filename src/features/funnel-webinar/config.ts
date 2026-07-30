import {
  MESES_ES, DIAS_ES, parseISODate, parseTime, weekdayIndex, zonedDateTimeToMs,
} from "@/features/public-pages/kit/tiempo"

/**
 * Configuración del Funnel de la Clase gratuita en directo.
 *
 * (El slug interno sigue siendo `webinar` en rutas, tags, pipeline y app_settings: eso NO
 * se toca para no romper los datos ya guardados. De cara al lead, en pantalla, siempre se
 * dice "Clase gratuita en directo", nunca "webinar".)
 *
 * Flujo (decidido en la reunión de marketing del 24-jul-2026):
 *   Anuncios → /webinar (página 1: titular + contador + opt-in EMBEBIDO; el vídeo va
 *   debajo, ya no en la primera pantalla) → /webinar/gracias → botón a WhatsApp PRIVADO
 *   de Adrián con mensaje predefinido. En cuanto el lead ENVÍA ese WhatsApp, el trabajo de
 *   este funnel se considera cumplido: a partir de ahí se nutre a la persona DENTRO del
 *   chat. El resto (grupo, sorteo, etc.) NO es parte de este funnel y NO se documenta.
 *
 * Valores centralizados (editables sin deploy desde el ⚙️ de /webs, key 'funnel:webinar'):
 *   - VIDEO_GUID: GUID en Bunny del vídeo de la página de GRACIAS (post-registro).
 *       Vacío = placeholder de marca. En la landing NO va ningún vídeo.
 *   - WHATSAPP_NUMBER: número de Adrián (solo dígitos con prefijo, sin + ni espacios).
 *   - WHATSAPP_MESSAGE: mensaje predefinido que el lead envía al pulsar el botón. SIN fecha
 *       (la fecha vive en WEBINAR_DATE, no se escribe a mano en el mensaje). Editable: al
 *       cambiarlo en el ⚙️ se refleja al instante en el botón y en el correo.
 *   - WEBINAR_DATE: fecha REAL de la clase (ISO 'YYYY-MM-DD'). Fuente única: alimenta el
 *       tag (`whatsapp-webinar-DD_MM_YYYY`), la fecha visible en la landing Y el contador.
 *       Se cambia en UN solo sitio; al cambiarla, todo lo demás cambia solo.
 *   - WEBINAR_TIME: hora REAL de la clase ('HH:MM', hora de España). Alimenta la fecha
 *       visible y la cuenta atrás. NO afecta al tag.
 *   - WEBINAR_DATE_LABEL_OVERRIDE: texto opcional para la landing (ej. "Sábado 8 de agosto
 *       a las 10:00h"). Vacío = se arma solo desde WEBINAR_DATE + WEBINAR_TIME.
 *   - EMAIL_WHATSAPP: si el correo de confirmación incluye o no el botón de WhatsApp.
 *   - INSTAGRAM_HANDLE: usuario IG de Adrián (sin @), para el pie/soporte.
 */
export const FUNNEL_WEBINAR = {
  VIDEO_GUID: "e7b88399-9cf9-4184-a7b4-5e8bcc9ade31",
  BUNNY_LIBRARY_ID: "686883",
  WHATSAPP_NUMBER: "34611874062",
  WHATSAPP_MESSAGE: "Hola Adrián, quiero acceder al evento.",
  WEBINAR_DATE: "2026-08-08",
  WEBINAR_TIME: "10:00",
  WEBINAR_DATE_LABEL_OVERRIDE: "",
  EMAIL_WHATSAPP: true,
  INSTAGRAM_HANDLE: "adrianvillanuevarios",
} as const

/** Zona horaria de referencia del directo (audiencia española). */
export const WEBINAR_TZ = "Europe/Madrid"

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

// ── Fecha de la clase → tag + etiqueta legible + cuenta atrás ───────────────
// La aritmética vive en el kit común de páginas públicas (features/public-pages/kit),
// para que landing y gracias usen exactamente la misma. Aquí solo se aplica al funnel.

/**
 * Nombre del tag que se pone al lead cuando toca WhatsApp: `whatsapp-webinar-DD_MM_YYYY`
 * con la fecha de la clase a la que accedió. Ej: `whatsapp-webinar-08_08_2026`. Al cambiar
 * WEBINAR_DATE (siguiente clase), el tag cambia solo. Si la fecha viene corrupta, usa el
 * default para no romper nunca el tag.
 */
export function webinarTagName(isoDate: string = FUNNEL_WEBINAR.WEBINAR_DATE): string {
  const p = parseISODate(isoDate) ?? parseISODate(FUNNEL_WEBINAR.WEBINAR_DATE)!
  const dd = String(p.d).padStart(2, "0")
  const mm = String(p.m).padStart(2, "0")
  return `whatsapp-webinar-${dd}_${mm}_${p.y}`
}

/** Etiqueta corta de la fecha. Ej: "8 de agosto". */
export function webinarDateLabel(isoDate: string = FUNNEL_WEBINAR.WEBINAR_DATE): string {
  const p = parseISODate(isoDate)
  if (!p) return ""
  return `${p.d} de ${MESES_ES[p.m - 1] ?? ""}`.trim()
}

/**
 * Etiqueta completa que se ve en la landing y en la gracias.
 * Ej: "Sábado 8 de agosto a las 10:00h". Si falta la hora, cae a "Sábado 8 de agosto".
 */
export function webinarDateTimeLabel(
  isoDate: string = FUNNEL_WEBINAR.WEBINAR_DATE,
  time: string = FUNNEL_WEBINAR.WEBINAR_TIME,
): string {
  const p = parseISODate(isoDate)
  if (!p) return ""
  const dia = DIAS_ES[weekdayIndex(p.y, p.m, p.d)] ?? ""
  const diaCap = dia ? dia[0].toUpperCase() + dia.slice(1) : ""
  const fecha = `${diaCap} ${p.d} de ${MESES_ES[p.m - 1] ?? ""}`.trim()
  const t = parseTime(time)
  if (!t) return fecha
  return `${fecha} a las ${String(t.h).padStart(2, "0")}:${String(t.min).padStart(2, "0")}h`
}

/** Momento exacto de la clase en milisegundos UTC, leyendo fecha y hora en España. */
export function webinarTargetMs(
  isoDate: string = FUNNEL_WEBINAR.WEBINAR_DATE,
  time: string = FUNNEL_WEBINAR.WEBINAR_TIME,
): number | null {
  return zonedDateTimeToMs(isoDate, time, WEBINAR_TZ)
}
