import "server-only"
import { createClient } from "@supabase/supabase-js"
import { FUNNEL_WEBINAR } from "./config"

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
  dateLabel: string
  instagram: string
}

export async function getWebinarSettings(): Promise<WebinarSettings> {
  const fallback: WebinarSettings = {
    videoGuid: FUNNEL_WEBINAR.VIDEO_GUID,
    bunnyLibraryId: FUNNEL_WEBINAR.BUNNY_LIBRARY_ID,
    whatsappNumber: FUNNEL_WEBINAR.WHATSAPP_NUMBER,
    whatsappMessage: FUNNEL_WEBINAR.WHATSAPP_MESSAGE,
    dateLabel: FUNNEL_WEBINAR.WEBINAR_DATE_LABEL,
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
    return {
      // video_guid vacío es válido: significa "aún sin vídeo" → placeholder.
      videoGuid: v.video_guid?.trim() ?? fallback.videoGuid,
      bunnyLibraryId: v.bunny_library_id?.trim() || fallback.bunnyLibraryId,
      whatsappNumber: v.whatsapp_number?.trim() || fallback.whatsappNumber,
      whatsappMessage: v.whatsapp_message?.trim() || fallback.whatsappMessage,
      dateLabel: v.date_label?.trim() || fallback.dateLabel,
      instagram: v.instagram?.trim() || fallback.instagram,
    }
  } catch {
    return fallback
  }
}
