import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/admin/google-calendar/disconnect
 * Borra los tokens de Google del singleton calls_availability.
 */
export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { error } = await admin
    .from("calls_availability")
    .update({
      google_oauth_email: null,
      google_oauth_refresh_token: null,
      google_oauth_access_token: null,
      google_oauth_expires_at: null,
      google_oauth_connected_at: null,
    })
    .eq("id", 1)

  if (error) {
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
