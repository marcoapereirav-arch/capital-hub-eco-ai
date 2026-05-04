import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { loadGoogleConnection, getGoogleOAuthEnv } from "@/lib/google/calendar-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/admin/google-calendar/status
 * Devuelve el estado de conexión Google Calendar del panel admin.
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const envOk = getGoogleOAuthEnv() !== null
  const conn = await loadGoogleConnection()
  const connected = !!conn?.refresh_token

  return NextResponse.json({
    envConfigured: envOk,
    connected,
    email: conn?.email ?? null,
    connectedAt: conn?.connected_at ?? null,
    calendarId: conn?.calendar_id ?? "primary",
  })
}
