import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { exchangeCodeForTokens, decodeIdTokenEmail } from "@/lib/google/calendar-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * GET /api/admin/google-calendar/callback?code=...
 * Recibe el code de Google → intercambia por refresh_token + access_token →
 * persiste en calls_availability → redirige al panel.
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ecoai.capitalhubapp.com"
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${baseUrl}/webs?gcal_error=${encodeURIComponent(error)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/webs?gcal_error=no_code`)
  }

  const tokens = await exchangeCodeForTokens(code)
  if (!tokens) {
    return NextResponse.redirect(`${baseUrl}/webs?gcal_error=exchange_failed`)
  }

  const email = tokens.id_token ? decodeIdTokenEmail(tokens.id_token) : null
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const supabase = getAdminClient()
  const update: Record<string, unknown> = {
    google_oauth_email: email,
    google_oauth_access_token: tokens.access_token,
    google_oauth_expires_at: expiresAt,
    google_oauth_connected_at: new Date().toISOString(),
  }
  // refresh_token sólo viene en la 1ª conexión (con prompt=consent también re-emite)
  if (tokens.refresh_token) {
    update.google_oauth_refresh_token = tokens.refresh_token
  }

  const { error: updateError } = await supabase
    .from("calls_availability")
    .update(update)
    .eq("id", 1)

  if (updateError) {
    console.error("[google-calendar/callback] persist failed", updateError)
    return NextResponse.redirect(`${baseUrl}/webs?gcal_error=persist_failed`)
  }

  return NextResponse.redirect(`${baseUrl}/webs?gcal_connected=1`)
}
