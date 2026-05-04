import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendCapiEvent, type CapiEventName } from "@/lib/meta/capi-client"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ALLOWED_EVENTS: CapiEventName[] = [
  "mifge_lead",
  "mifge_free_trial_started",
  "mifge_order_bump",
  "mifge_call_booked",
  "mifge_anual_purchased",
  "mifge_monthly_purchased",
  "mifge_call_attended",
]

const ManualSchema = z.object({
  event_name: z.string().refine((v): v is CapiEventName => ALLOWED_EVENTS.includes(v as CapiEventName)),
  email: z.string().email(),
  value: z.number().optional(),
  currency: z.string().max(8).optional(),
  content_name: z.string().max(120).optional(),
})

/**
 * POST /api/meta/capi/manual
 * Dispara un evento CAPI manualmente desde el panel /ads (Tab Tracker → Crear evento manual).
 * Solo accesible por usuarios autenticados del OS.
 */
export async function POST(req: NextRequest) {
  // Auth: solo usuarios autenticados del OS pueden disparar manualmente
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = ManualSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const result = await sendCapiEvent({
    eventName: data.event_name as CapiEventName,
    userData: { email: data.email },
    customData: {
      value: data.value,
      currency: data.currency ?? "EUR",
      contentName: data.content_name,
    },
    triggeredBy: `manual_panel_user_${user.id}`,
    source: "manual",
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
