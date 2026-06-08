import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { notifyGCalDisconnected } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"

/**
 * Cron pg_cron cada hora. Verifica que el refresh_token de Adrián sigue
 * funcionando. Si falla, envía email + push notification a Marco y Adrián.
 *
 * Lógica:
 * 1. Si NO hay refresh_token en BD → desconectado, no alertar (no estaba conectado)
 * 2. Si HAY refresh_token → intentar refresh. Si OK actualiza access_token + expires_at.
 *    Si falla → marca desconectado en BD + dispara alertas
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()

  // Carga estado actual desde calendar_owners (fuente de verdad nueva)
  const { data: owner } = await supabase
    .from("calendar_owners")
    .select("id, google_oauth_email, google_oauth_refresh_token, google_oauth_connected_at")
    .eq("id", "adrian")
    .maybeSingle()

  if (!owner || !owner.google_oauth_refresh_token) {
    return NextResponse.json({ ok: true, reason: "not_connected_yet", skipped: true })
  }

  // Intenta refresh para verificar health
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "OAuth env not configured" }, { status: 500 })
  }

  let refreshOk = false
  let errBody = ""
  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: owner.google_oauth_refresh_token,
        grant_type: "refresh_token",
      }),
    })
    refreshOk = res.ok
    if (!res.ok) errBody = await res.text().catch(() => "")
    else {
      // Actualiza access_token + expiry en ambas tablas
      const data = (await res.json()) as { access_token: string; expires_in: number }
      const newExpires = new Date(Date.now() + data.expires_in * 1000).toISOString()
      await Promise.all([
        supabase
          .from("calendar_owners")
          .update({ google_oauth_access_token: data.access_token, google_oauth_expires_at: newExpires, updated_at: new Date().toISOString() })
          .eq("id", "adrian"),
        supabase
          .from("calls_availability")
          .update({ google_oauth_access_token: data.access_token, google_oauth_expires_at: newExpires })
          .eq("id", 1),
      ])
    }
  } catch (e) {
    refreshOk = false
    errBody = e instanceof Error ? e.message : "unknown"
  }

  if (refreshOk) {
    return NextResponse.json({ ok: true, refresh: "ok" })
  }

  // FALLO: marcar desconectado en BD + dispara alerts + push notif al OS
  const clear = {
    google_oauth_email: null,
    google_oauth_refresh_token: null,
    google_oauth_access_token: null,
    google_oauth_expires_at: null,
    google_oauth_connected_at: null,
  }
  await Promise.all([
    supabase.from("calls_availability").update(clear).eq("id", 1),
    supabase.from("calendar_owners").update({ ...clear, updated_at: new Date().toISOString() }).eq("id", "adrian"),
  ])

  // Determina razón humana
  let reason = "refresh_failed"
  if (errBody.includes("invalid_grant")) reason = "token_revoked"
  else if (errBody.includes("expired") || errBody.includes("Testing")) reason = "expired_testing_mode"

  // Email a Marco + Adrián
  await notifyGCalDisconnected({
    reason,
    detail: errBody.slice(0, 200),
    lastConnectedAt: owner.google_oauth_connected_at,
    ownerEmail: owner.google_oauth_email,
  }).catch((e) => console.error("[gcal-health-check] email failed", e))

  // Push notification interna a Marco + Adrián (1 fila por user)
  const { data: superAdmins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .eq("active", true)
  if (superAdmins && superAdmins.length > 0) {
    try {
      await supabase.from("notifications").insert(
        superAdmins.map((u) => ({
          user_id: u.id,
          title: "⚠️ Google Calendar desconectado",
          body: `Adrián tiene que reconectar en /calendario. Razón: ${reason}`,
          type: "gcal_disconnected",
          data: { reason, detail: errBody.slice(0, 200), owner_email: owner.google_oauth_email },
        }))
      )
    } catch (e) {
      console.error("[gcal-health-check] push notif failed", e)
    }
  }

  return NextResponse.json({
    ok: false,
    reason,
    detail: errBody.slice(0, 200),
    alerted: true,
  })
}
