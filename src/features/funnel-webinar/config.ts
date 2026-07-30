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
 *   - VIDEO_GUID: GUID del vídeo en Bunny. Vacío = placeholder de marca.
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
  VIDEO_GUID: "",
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

const DIAS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

/**
 * Día de la semana (0 = domingo) por el algoritmo de Sakamoto. Aritmética pura, sin
 * `new Date`: así el día que se imprime en el servidor y el que ve el navegador son
 * SIEMPRE el mismo, viva quien viva en la zona horaria que sea.
 */
function weekdayIndex(y: number, m: number, d: number): number {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const yy = m < 3 ? y - 1 : y
  return (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[m - 1] + d) % 7
}

/** Normaliza 'HH:MM' a { h, min }. Si viene corrupta, devuelve null. */
function parseTime(time: string): { h: number; min: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec((time ?? "").trim())
  if (!match) return null
  const h = Number(match[1])
  const min = Number(match[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return { h, min }
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

/**
 * Momento exacto del directo en milisegundos UTC, interpretando fecha y hora en la zona
 * horaria de España. Es lo que come la cuenta atrás.
 *
 * Por qué no vale `new Date("2026-08-08T10:00")`: eso usa la hora del NAVEGADOR, así que a
 * alguien en México le saldrían 7 horas de más. Aquí se pregunta a `Intl` cuánto se desvía
 * esa zona ese día concreto (verano/invierno incluidos) y se corrige.
 */
export function webinarTargetMs(
  isoDate: string = FUNNEL_WEBINAR.WEBINAR_DATE,
  time: string = FUNNEL_WEBINAR.WEBINAR_TIME,
  timeZone: string = WEBINAR_TZ,
): number | null {
  const p = parseISODate(isoDate)
  const t = parseTime(time)
  if (!p || !t) return null
  const naive = Date.UTC(p.y, p.m - 1, p.d, t.h, t.min, 0)
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(naive)).map((x) => [x.type, x.value]),
    ) as Record<string, string>
    const asUTC = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
    )
    return naive - (asUTC - naive)
  } catch {
    // Si el navegador no conoce la zona, se queda con la lectura directa antes que romper.
    return naive
  }
}
