import "server-only"
import { createClient } from "@supabase/supabase-js"
import { FUNNEL_TEST_PERSONALIDAD } from "./config"

/**
 * Resuelve los ajustes editables del funnel Test Personalidad.
 * Lee el override de app_settings (key 'funnel:test-personalidad', editable desde
 * el popup del engranaje de /webs) y si un campo esta vacio usa el default de config.ts.
 * Si la BD falla, devuelve los defaults, asi la landing NUNCA se rompe.
 */
export type TestPersonalidadSettings = {
  testUrl: string
  whatsapp: string
  instagram: string
  /** GUID del VSL en Bunny. Vacio = la gracias oculta el reproductor y no se rompe. */
  videoGuid: string
  bunnyLibraryId: string
  calendlyUrl: string
  /** Minutos de espera hasta que llega el email con el acceso al test. */
  emailDelayMinutes: number
}

export async function getTestPersonalidadSettings(): Promise<TestPersonalidadSettings> {
  const fallback: TestPersonalidadSettings = {
    testUrl: FUNNEL_TEST_PERSONALIDAD.TEST_URL,
    whatsapp: FUNNEL_TEST_PERSONALIDAD.WHATSAPP_NUMBER,
    instagram: FUNNEL_TEST_PERSONALIDAD.INSTAGRAM_HANDLE,
    videoGuid: FUNNEL_TEST_PERSONALIDAD.VIDEO_GUID,
    bunnyLibraryId: FUNNEL_TEST_PERSONALIDAD.BUNNY_LIBRARY_ID,
    calendlyUrl: FUNNEL_TEST_PERSONALIDAD.CALENDLY_URL,
    emailDelayMinutes: FUNNEL_TEST_PERSONALIDAD.EMAIL_DELAY_MINUTES,
  }
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "funnel:test-personalidad")
      .maybeSingle()
    const v = (data?.value ?? {}) as Record<string, string | undefined>
    const delay = Number.parseInt(v.email_delay_minutes ?? "", 10)
    return {
      testUrl: v.test_url?.trim() || fallback.testUrl,
      whatsapp: v.whatsapp?.trim() || fallback.whatsapp,
      instagram: v.instagram?.trim() || fallback.instagram,
      videoGuid: v.video_guid?.trim() || fallback.videoGuid,
      bunnyLibraryId: v.bunny_library_id?.trim() || fallback.bunnyLibraryId,
      calendlyUrl: v.calendly_url?.trim() || fallback.calendlyUrl,
      emailDelayMinutes:
        Number.isFinite(delay) && delay > 0 && delay <= 720 ? delay : fallback.emailDelayMinutes,
    }
  } catch {
    return fallback
  }
}
