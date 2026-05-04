import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendAgendaReminder24h } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cron Vercel: corre cada 30 min.
 * Busca calls con slot_start entre 23h y 25h en el futuro y reminder_sent_at NULL.
 * Por cada una: envía agenda_reminder_24h y marca reminder_sent_at = now().
 *
 * La ventana 23-25h cubre el caso de cron retraso o ejecución cada 30min — un slot
 * que cae en 24h se pillará exactamente una vez en alguna de las 2 ejecuciones cercanas.
 */
export async function GET(req: NextRequest) {
  // Vercel cron envía Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000) // +23h
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000) // +25h

  const { data: calls, error } = await supabase
    .from("calls")
    .select("id, lead_id, full_name, email, slot_start, meeting_url")
    .eq("status", "booked")
    .is("reminder_sent_at", null)
    .gte("slot_start", windowStart.toISOString())
    .lt("slot_start", windowEnd.toISOString())

  if (error) {
    console.error("[cron/agenda-reminder-24h] query error", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  if (!calls || calls.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, window: [windowStart.toISOString(), windowEnd.toISOString()] })
  }

  const results: { call_id: string; ok: boolean; error?: string }[] = []
  for (const call of calls) {
    if (!call.meeting_url) {
      // Si no hay meeting_url no podemos mandar recordatorio útil; lo saltamos pero marcamos sent
      // para no reintentarlo eternamente.
      await supabase.from("calls").update({ reminder_sent_at: now.toISOString() }).eq("id", call.id)
      results.push({ call_id: call.id, ok: false, error: "no meeting_url" })
      continue
    }
    try {
      const r = await sendAgendaReminder24h({
        fullName: call.full_name,
        email: call.email,
        slotStartIso: call.slot_start,
        meetingUrl: call.meeting_url,
        callId: call.id,
        leadId: call.lead_id ?? undefined,
      })
      if (r.ok) {
        await supabase.from("calls").update({ reminder_sent_at: now.toISOString() }).eq("id", call.id)
      }
      results.push({ call_id: call.id, ok: r.ok, error: r.error })
    } catch (e) {
      results.push({ call_id: call.id, ok: false, error: e instanceof Error ? e.message : "unknown" })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
