import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { notifyGCalDisconnected } from "@/lib/email/senders"
import { TEST_AGENT_EMAIL } from "@/lib/notifications/recipients"

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

  // Captura el estado actual ANTES de borrar para enviarlo en la alerta
  const { data: prev } = await admin
    .from("calendar_owners")
    .select("google_oauth_email, google_oauth_connected_at")
    .eq("id", "adrian")
    .maybeSingle()

  const clear = {
    google_oauth_email: null,
    google_oauth_refresh_token: null,
    google_oauth_access_token: null,
    google_oauth_expires_at: null,
    google_oauth_connected_at: null,
  }
  const [{ error: legacyErr }, { error: ownersErr }] = await Promise.all([
    admin.from("calls_availability").update(clear).eq("id", 1),
    admin.from("calendar_owners").update({ ...clear, updated_at: new Date().toISOString() }).eq("id", "adrian"),
  ])

  if (legacyErr || ownersErr) {
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 })
  }

  // Alerta a Marco + Adrián + push notif al OS
  notifyGCalDisconnected({
    reason: "manually_disconnected",
    lastConnectedAt: prev?.google_oauth_connected_at ?? null,
    ownerEmail: prev?.google_oauth_email ?? null,
  }).catch((e) => console.error("[disconnect] notify failed", e))

  // Push notification interna
  const { data: superAdmins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .eq("active", true)
    .neq("email", TEST_AGENT_EMAIL)
  if (superAdmins?.length) {
    try {
      await admin.from("notifications").insert(
        superAdmins.map((u) => ({
          user_id: u.id,
          title: "⚠️ Google Calendar desconectado",
          body: "Calendar desconectado manualmente. Adrián tiene que reconectar en /calendario.",
          type: "gcal_disconnected",
          data: { reason: "manually_disconnected" },
        }))
      )
    } catch {
      // no bloquea el response
    }
  }

  return NextResponse.json({ ok: true })
}
