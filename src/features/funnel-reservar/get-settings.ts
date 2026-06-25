import "server-only"
import { createClient } from "@supabase/supabase-js"
import { FUNNEL_RESERVAR } from "./config"

/**
 * Resuelve los ajustes del funnel de reserva (override de app_settings key 'funnel:reservar'
 * con fallback a config.ts). Editable desde el ⚙️ de /webs. Nunca rompe.
 */
export type ReservarSettings = {
  calendlyUrl: string
  videoGuid: string
  libraryId: string
  testPath: string
}

export async function getReservarSettings(): Promise<ReservarSettings> {
  const fallback: ReservarSettings = {
    calendlyUrl: FUNNEL_RESERVAR.CALENDLY_URL,
    videoGuid: FUNNEL_RESERVAR.VIDEO_GUID,
    libraryId: FUNNEL_RESERVAR.BUNNY_LIBRARY_ID,
    testPath: FUNNEL_RESERVAR.TEST_PATH,
  }
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "funnel:reservar")
      .maybeSingle()
    const v = (data?.value ?? {}) as Record<string, string | undefined>
    return {
      calendlyUrl: v.calendly_url?.trim() || fallback.calendlyUrl,
      videoGuid: v.video_guid?.trim() || fallback.videoGuid,
      libraryId: v.bunny_library_id?.trim() || fallback.libraryId,
      testPath: v.test_path?.trim() || fallback.testPath,
    }
  } catch {
    return fallback
  }
}
