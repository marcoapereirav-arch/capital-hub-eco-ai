import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendAgendaReminder2h } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cron Vercel cada 30 min: recordatorio 2h antes de la llamada.
 * Busca en:
 *   - calls (calendar propio) con slot_start en [+1h45, +2h15] y reminder_2h_sent_at NULL
 *   - calendly_scheduled_events activos con start_time en la misma ventana y reminder_2h_sent_at NULL
 * Envia y marca el flag.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  const now = new Date()
  const winStart = new Date(now.getTime() + 1 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
  const winEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()

  const results: { source: string; id: string; ok: boolean; error?: string }[] = []

  // 1) Calendar propio (tabla calls)
  const { data: calls } = await supabase
    .from("calls")
    .select("id, lead_id, full_name, email, slot_start, meeting_url, owner_id")
    .eq("status", "booked")
    .is("reminder_2h_sent_at", null)
    .gte("slot_start", winStart)
    .lt("slot_start", winEnd)

  for (const call of calls ?? []) {
    if (!call.meeting_url) {
      await supabase.from("calls").update({ reminder_2h_sent_at: now.toISOString() }).eq("id", call.id)
      results.push({ source: "calls", id: call.id, ok: false, error: "no meeting_url" })
      continue
    }
    try {
      const r = await sendAgendaReminder2h({
        fullName: call.full_name,
        email: call.email,
        slotStartIso: call.slot_start,
        meetingUrl: call.meeting_url,
        callId: call.id,
        leadId: call.lead_id ?? undefined,
      })
      if (r.ok) await supabase.from("calls").update({ reminder_2h_sent_at: now.toISOString() }).eq("id", call.id)
      results.push({ source: "calls", id: call.id, ok: r.ok, error: r.error })
    } catch (e) {
      results.push({ source: "calls", id: call.id, ok: false, error: e instanceof Error ? e.message : "unknown" })
    }
  }

  // 2) Calendly scheduled events
  const { data: events } = await supabase
    .from("calendly_scheduled_events")
    .select("uri, invitee_name, invitee_email, start_time, end_time, meeting_url, status")
    .eq("status", "active")
    .is("reminder_2h_sent_at", null)
    .gte("start_time", winStart)
    .lt("start_time", winEnd)

  for (const ev of events ?? []) {
    if (!ev.meeting_url) {
      await supabase.from("calendly_scheduled_events").update({ reminder_2h_sent_at: now.toISOString() }).eq("uri", ev.uri)
      results.push({ source: "calendly", id: ev.uri, ok: false, error: "no meeting_url" })
      continue
    }
    try {
      const durMin = ev.start_time && ev.end_time
        ? Math.round((new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime()) / 60000)
        : undefined
      const r = await sendAgendaReminder2h({
        fullName: ev.invitee_name ?? "",
        email: ev.invitee_email,
        slotStartIso: ev.start_time,
        meetingUrl: ev.meeting_url,
        durationMinutes: durMin,
      })
      if (r.ok) await supabase.from("calendly_scheduled_events").update({ reminder_2h_sent_at: now.toISOString() }).eq("uri", ev.uri)
      results.push({ source: "calendly", id: ev.uri, ok: r.ok, error: r.error })
    } catch (e) {
      results.push({ source: "calendly", id: ev.uri, ok: false, error: e instanceof Error ? e.message : "unknown" })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, window: [winStart, winEnd], results })
}
