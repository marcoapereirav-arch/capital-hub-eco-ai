import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { getGoogleOAuthEnv, GOOGLE_OAUTH_SCOPES } from "@/lib/google/calendar-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/admin/google-calendar/connect
 * Inicia el flow OAuth: redirige a Google consent screen.
 * Requiere usuario autenticado (panel admin).
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const env = getGoogleOAuthEnv()
  if (!env) {
    return NextResponse.json(
      { error: "Google OAuth no configurado. Faltan GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI" },
      { status: 500 }
    )
  }

  const params = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES,
    access_type: "offline",
    prompt: "consent", // fuerza emisión de refresh_token también si ya conectó antes
    include_granted_scopes: "true",
  })
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
