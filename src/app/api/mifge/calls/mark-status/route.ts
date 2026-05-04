import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { sendPostCallFollowup } from "@/lib/email/senders"
import { sendCapiEvent } from "@/lib/meta/capi-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const Schema = z.object({
  call_id: z.string().uuid(),
  status: z.enum(["booked", "attended", "no_show", "cancelled", "rescheduled"]),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/mifge/calls/mark-status
 * Endpoint admin (auth required) para marcar el estado de una call desde el
 * panel /webs > Llamadas. Si se marca como "attended":
 *  - Envía email post-call followup al cliente con resumen + push al anual
 *  - Dispara CAPI mifge_call_attended (atribución para Meta)
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
  const { call_id, status } = parsed.data

  const admin = getAdminClient()

  // Cargar la call ANTES para detectar transición y disparar emails/CAPI si attended
  const { data: callBefore } = await admin
    .from("calls")
    .select("id, lead_id, full_name, email, phone, status")
    .eq("id", call_id)
    .single()

  if (!callBefore) return NextResponse.json({ error: "Call not found" }, { status: 404 })

  const { error: updateError } = await admin.from("calls").update({ status }).eq("id", call_id)
  if (updateError) return NextResponse.json({ error: "Update failed" }, { status: 500 })

  // Side-effects al transicionar a attended (solo si antes NO era attended)
  if (status === "attended" && callBefore.status !== "attended") {
    sendPostCallFollowup({
      fullName: callBefore.full_name,
      email: callBefore.email,
      callId: call_id,
      leadId: callBefore.lead_id ?? undefined,
    }).catch((e) => console.error("[mark-status] post-call email", e))

    sendCapiEvent({
      eventName: "mifge_call_attended",
      userData: { email: callBefore.email, phone: callBefore.phone },
      customData: { value: 0, currency: "EUR", contentName: "Llamada atendida" },
      leadId: callBefore.lead_id ?? undefined,
      triggeredBy: "manual_panel_mark_attended",
    }).catch(() => {})

    // Marcar converted_post_call=true en lead (atribución post-llamada)
    if (callBefore.lead_id) {
      await admin.from("mifge_leads").update({ converted_post_call: true }).eq("id", callBefore.lead_id)
    }
  }

  return NextResponse.json({ ok: true })
}
