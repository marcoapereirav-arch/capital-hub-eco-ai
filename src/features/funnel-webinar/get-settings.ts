import "server-only"
import { createClient } from "@supabase/supabase-js"
import { FUNNEL_WEBINAR, webinarDateTimeLabel } from "./config"

/**
 * Resuelve los ajustes editables del funnel Webinar.
 * Lee el override de app_settings (key 'funnel:webinar', editable desde el popup ⚙️
 * de /webs) y si un campo está vacío usa el default de config.ts.
 * Si la BD falla, devuelve los defaults → la landing NUNCA se rompe.
 */
export type WebinarSettings = {
  videoGuid: string
  bunnyLibraryId: string
  whatsappNumber: string
  whatsappMessage: string
  /** Fecha real de la clase (ISO 'YYYY-MM-DD'). Fuente única para el tag, la fecha y el contador. */
  webinarDate: string
  /** Hora real de la clase ('HH:MM', hora de España). Alimenta la fecha visible y el contador. */
  webinarTime: string
  /** Etiqueta ya resuelta (override o derivada). Ej: "Sábado 8 de agosto a las 10:00h". */
  dateLabel: string
  /** Si el correo de confirmación incluye el botón de WhatsApp. */
  emailWhatsappEnabled: boolean
  instagram: string
}

export async function getWebinarSettings(): Promise<WebinarSettings> {
  const fallback: WebinarSettings = {
    videoGuid: FUNNEL_WEBINAR.VIDEO_GUID,
    bunnyLibraryId: FUNNEL_WEBINAR.BUNNY_LIBRARY_ID,
    whatsappNumber: FUNNEL_WEBINAR.WHATSAPP_NUMBER,
    whatsappMessage: FUNNEL_WEBINAR.WHATSAPP_MESSAGE,
    webinarDate: FUNNEL_WEBINAR.WEBINAR_DATE,
    webinarTime: FUNNEL_WEBINAR.WEBINAR_TIME,
    dateLabel: webinarDateTimeLabel(FUNNEL_WEBINAR.WEBINAR_DATE, FUNNEL_WEBINAR.WEBINAR_TIME),
    emailWhatsappEnabled: FUNNEL_WEBINAR.EMAIL_WHATSAPP,
    instagram: FUNNEL_WEBINAR.INSTAGRAM_HANDLE,
  }
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "funnel:webinar")
      .maybeSingle()
    const v = (data?.value ?? {}) as Record<string, string | undefined>

    const webinarDate = v.webinar_date?.trim() || fallback.webinarDate
    const webinarTime = v.webinar_time?.trim() || fallback.webinarTime
    // La etiqueta visible: si hay override manual úsalo; si no, se arma sola desde fecha + hora.
    const overrideLabel = v.date_label?.trim()
    const dateLabel =
      overrideLabel || webinarDateTimeLabel(webinarDate, webinarTime) || fallback.dateLabel
    // Interruptor del correo: por defecto ON. Solo se apaga con "0" explícito.
    const emailWhatsappEnabled = (v.email_whatsapp?.trim() ?? "") !== "0"

    return {
      // video_guid vacío es válido: significa "aún sin vídeo" → placeholder.
      videoGuid: v.video_guid?.trim() ?? fallback.videoGuid,
      bunnyLibraryId: v.bunny_library_id?.trim() || fallback.bunnyLibraryId,
      whatsappNumber: v.whatsapp_number?.trim() || fallback.whatsappNumber,
      whatsappMessage: v.whatsapp_message?.trim() || fallback.whatsappMessage,
      webinarDate,
      webinarTime,
      dateLabel,
      emailWhatsappEnabled,
      instagram: v.instagram?.trim() || fallback.instagram,
    }
  } catch {
    return fallback
  }
}
