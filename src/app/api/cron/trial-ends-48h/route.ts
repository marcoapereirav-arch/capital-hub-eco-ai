import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTrialEnds48h } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cron Vercel: corre cada 1h.
 * Busca leads en pipeline_stage='free_trial' que llevan entre 12 y 12.04 días desde
 * created_at (ventana 1h) y trial_ends_email_sent_at NULL.
 * Por cada uno: envía email "trial termina en 48h" + marca sent_at = now().
 *
 * 12 días desde activación = 48h antes del cobro automático del día 14.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()
  const now = new Date()
  // Ventana: leads cuyo trial empezó hace 12-12.04 días (48h ± 30min antes de día 14 cobro)
  const windowEnd = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000) // -12d
  const windowStart = new Date(windowEnd.getTime() - 60 * 60 * 1000) // -1h adicional

  const { data: leads, error } = await supabase
    .from("mifge_leads")
    .select("id, email, full_name")
    .eq("pipeline_stage", "free_trial")
    .is("trial_ends_email_sent_at", null)
    .gte("created_at", windowStart.toISOString())
    .lt("created_at", windowEnd.toISOString())

  if (error) {
    console.error("[cron/trial-ends-48h] query error", error)
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      window: [windowStart.toISOString(), windowEnd.toISOString()],
    })
  }

  const results: { lead_id: string; ok: boolean; error?: string }[] = []
  for (const lead of leads) {
    try {
      const r = await sendTrialEnds48h({
        fullName: lead.full_name,
        email: lead.email,
        leadId: lead.id,
      })
      if (r.ok) {
        await supabase
          .from("mifge_leads")
          .update({ trial_ends_email_sent_at: now.toISOString() })
          .eq("id", lead.id)
      }
      results.push({ lead_id: lead.id, ok: r.ok, error: r.error })
    } catch (e) {
      results.push({ lead_id: lead.id, ok: false, error: e instanceof Error ? e.message : "unknown" })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
