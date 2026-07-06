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
  whatsappGroup: string
  dateLabel: string
  reservarUrl: string
  instagram: string
}

export async function getWebinarSettings(): Promise<WebinarSettings> {
  const fallback: WebinarSettings = {
    whatsappGroup: FUNNEL_WEBINAR.WHATSAPP_GROUP_URL,
    dateLabel: FUNNEL_WEBINAR.WEBINAR_DATE_LABEL,
    reservarUrl: FUNNEL_WEBINAR.RESERVAR_URL,
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
      whatsappGroup: v.whatsapp_group?.trim() || fallback.whatsappGroup,
      dateLabel: v.date_label?.trim() || fallback.dateLabel,
      reservarUrl: v.reservar_url?.trim() || fallback.reservarUrl,
      instagram: v.instagram?.trim() || fallback.instagram,
    }
  } catch {
    return fallback
  }
}
