import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendAgendaReminder24h, sendAgendaReminder1h } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type Admin = ReturnType<typeof getAdminClient>

/**
 * Cron Vercel (cada 15 min): recordatorios de las llamadas agendadas por Calendly
 * (funnel de reserva de sesión). Decisión Marco 2026-07-28: además de la confirmación,
 * mandamos NUESTROS recordatorios con el link de la reunión para bajar los no-show.
 *
 * Cadencia: 24h antes + 1h antes.
 *
 * Sin tocar el esquema: la idempotencia se resuelve mirando email_logs (call_id = uri
 * del evento Calendly + template). Si ya se mandó ese recordatorio para esa reserva,
 * no se repite. Ventanas anchas para que un cron cada 15 min lo pille exactamente una vez.
 */
async function alreadySent(admin: Admin, uri: string, template: string): Promise<boolean> {
  const { data } = await admin
    .from("email_logs")
    .select("id")
    .eq("call_id", uri)
    .eq("template", template)
    .eq("status", "sent")
    .limit(1)
    .maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getAdminClient()
  const now = Date.now()
  const in25h = new Date(now + 25 * 60 * 60 * 1000)

  // Reservas activas de aquí a 25h (cubre las dos ventanas: 24h y 1h).
  const { data: events, error } = await admin
    .from("calendly_scheduled_events")
    .select("uri, start_time, status, invitee_email, invitee_name, meeting_url")
    .neq("status", "canceled")
    .neq("status", "no_show")
    .gte("start_time", new Date(now).toISOString())
    .lt("start_time", in25h.toISOString())

  if (error) {
    console.error("[cron/calendly-reminders] query error", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }
  if (!events || events.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const results: { uri: string; kind: string; ok: boolean; error?: string }[] = []

  for (const ev of events) {
    if (!ev.invitee_email || !ev.meeting_url) continue
    const startMs = new Date(ev.start_time).getTime()
    const hoursAway = (startMs - now) / (60 * 60 * 1000)

    // Ventana 24h: entre 23h y 25h antes.
    const due24h = hoursAway >= 23 && hoursAway < 25
    // Ventana 1h: entre 0.5h y 1.5h antes.
    const due1h = hoursAway >= 0.5 && hoursAway < 1.5

    const send = async (
      kind: "24h" | "1h",
      template: string,
      fn: typeof sendAgendaReminder24h,
    ) => {
      if (await alreadySent(admin, ev.uri, template)) return
      try {
        const r = await fn({
          fullName: ev.invitee_name || ev.invitee_email!,
          email: ev.invitee_email!,
          slotStartIso: ev.start_time,
          meetingUrl: ev.meeting_url!,
          callId: ev.uri,
        })
        results.push({ uri: ev.uri, kind, ok: r.ok, error: r.error })
      } catch (e) {
        results.push({ uri: ev.uri, kind, ok: false, error: e instanceof Error ? e.message : "unknown" })
      }
    }

    if (due24h) await send("24h", "agenda_reminder_24h", sendAgendaReminder24h)
    if (due1h) await send("1h", "agenda_reminder_1h", sendAgendaReminder1h)
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
