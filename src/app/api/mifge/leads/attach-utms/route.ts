import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const Schema = z.object({
  email: z.string().email(),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(120).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  first_landing_url: z.string().max(500).optional(),
  first_referrer: z.string().max(500).optional(),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/mifge/leads/attach-utms
 * Browser → server: cuando el cliente está en una página post-checkout (gracias,
 * upsell-anual, agenda, llamada-confirmada) que ya conoce su email, llama a
 * este endpoint con las UTMs del localStorage para asociarlas al lead en BD.
 *
 * Idempotente: si el lead ya tiene UTMs, NO sobrescribe (first-touch attribution).
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const { email, ...utms } = parsed.data
  const cleanUtms = Object.fromEntries(Object.entries(utms).filter(([, v]) => v != null))
  if (Object.keys(cleanUtms).length === 0) {
    return NextResponse.json({ ok: true, skipped: "no utms" })
  }

  const supabase = getAdminClient()
  const { data: lead } = await supabase
    .from("mifge_leads")
    .select("id, utm_source, utm_campaign")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle()

  if (!lead) {
    return NextResponse.json({ ok: true, skipped: "lead not found yet (likely race with webhook)" })
  }

  // First-touch: no sobrescribir si ya hay
  if (lead.utm_source || lead.utm_campaign) {
    return NextResponse.json({ ok: true, skipped: "lead already has utms" })
  }

  const { error } = await supabase.from("mifge_leads").update(cleanUtms).eq("id", lead.id)
  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
  return NextResponse.json({ ok: true, lead_id: lead.id })
}
