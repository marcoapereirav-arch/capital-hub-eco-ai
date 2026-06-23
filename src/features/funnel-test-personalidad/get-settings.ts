import "server-only"
import { createClient } from "@supabase/supabase-js"
import { FUNNEL_TEST_PERSONALIDAD } from "./config"

/**
 * Resuelve los ajustes editables del funnel Test Personalidad.
 * Lee el override de app_settings (key 'funnel:test-personalidad', editable desde
 * el popup ⚙️ de /webs) y si un campo está vacío usa el default de config.ts.
 * Si la BD falla, devuelve los defaults → la landing NUNCA se rompe.
 */
export type TestPersonalidadSettings = {
  testUrl: string
  whatsapp: string
  instagram: string
}

export async function getTestPersonalidadSettings(): Promise<TestPersonalidadSettings> {
  const fallback: TestPersonalidadSettings = {
    testUrl: FUNNEL_TEST_PERSONALIDAD.TEST_URL,
    whatsapp: FUNNEL_TEST_PERSONALIDAD.WHATSAPP_NUMBER,
    instagram: FUNNEL_TEST_PERSONALIDAD.INSTAGRAM_HANDLE,
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
    return {
      testUrl: v.test_url?.trim() || fallback.testUrl,
      whatsapp: v.whatsapp?.trim() || fallback.whatsapp,
      instagram: v.instagram?.trim() || fallback.instagram,
    }
  } catch {
    return fallback
  }
}
