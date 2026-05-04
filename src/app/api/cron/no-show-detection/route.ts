import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendNoShow } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cron Supabase pg_cron cada 30 min: detecta no-shows.
 * Busca calls con:
 *  - status='booked'
 *  - slot_end ya pasó hace >= 1h y <= 25h (ventana de detección)
 * Las marca status='no_show' + envía email reagendar.
 *
 * Nota: este es un detector "ciego" — asume no-show si nadie marcó attended
 * en la ventana. Cuando integremos Fathom, marcaremos attended automático
 * si hay grabación, y este cron solo procesará las que NO tengan grabación.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  const now = new Date()
  const windowEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000) // hace 1h
  const windowStart = new Date(now.getTime() - 25 * 60 * 60 * 1000) // hace 25h

  const { data: calls, error } = await supabase
    .from("calls")
    .select("id, lead_id, full_name, email")
    .eq("status", "booked")
    .gte("slot_end", windowStart.toISOString())
    .lt("slot_end", windowEnd.toISOString())

  if (error) {
    console.error("[cron/no-show-detection] query error", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  if (!calls || calls.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const results: { call_id: string; ok: boolean; error?: string }[] = []
  for (const call of calls) {
    try {
      // Marcar status=no_show
      await supabase.from("calls").update({ status: "no_show" }).eq("id", call.id)
      // Email no-show
      const r = await sendNoShow({
        fullName: call.full_name,
        email: call.email,
        callId: call.id,
        leadId: call.lead_id ?? undefined,
      })
      results.push({ call_id: call.id, ok: r.ok, error: r.error })
    } catch (e) {
      results.push({ call_id: call.id, ok: false, error: e instanceof Error ? e.message : "unknown" })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
