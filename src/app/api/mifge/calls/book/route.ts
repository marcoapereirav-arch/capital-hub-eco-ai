import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"

const BookSchema = z.object({
  lead_id: z.string().uuid().optional(),
  email: z.string().email("Email inválido").max(255),
  full_name: z.string().min(2).max(120),
  phone: z.string().max(30).optional(),
  slot_start: z.string().datetime({ message: "slot_start debe ser ISO 8601" }),
  notes: z.string().max(2000).optional(),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/mifge/calls/book
 * Reserva un slot. Calcula slot_end con la duración configurada.
 * Anti-double-booking: comprueba que el slot exacto no esté ya tomado.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = BookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const data = parsed.data
    const supabase = getAdminClient()

    const { data: configRow, error: configError } = await supabase
      .from("calls_availability")
      .select("slot_minutes, default_meeting_url")
      .eq("id", 1)
      .single()
    if (configError || !configRow) {
      return NextResponse.json({ error: "Configuración no disponible" }, { status: 500 })
    }

    const slotStart = new Date(data.slot_start)
    if (isNaN(slotStart.getTime())) {
      return NextResponse.json({ error: "slot_start inválido" }, { status: 400 })
    }
    if (slotStart < new Date()) {
      return NextResponse.json({ error: "El slot ya ha pasado" }, { status: 400 })
    }
    const slotEnd = new Date(slotStart.getTime() + configRow.slot_minutes * 60_000)

    // Anti double-booking: comprueba colisión exacta
    const { data: existing, error: existingError } = await supabase
      .from("calls")
      .select("id")
      .eq("status", "booked")
      .eq("slot_start", slotStart.toISOString())
      .limit(1)
    if (existingError) {
      return NextResponse.json({ error: "Error verificando disponibilidad" }, { status: 500 })
    }
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Ese slot ya no está disponible" }, { status: 409 })
    }

    const { data: inserted, error: insertError } = await supabase
      .from("calls")
      .insert({
        lead_id: data.lead_id ?? null,
        email: data.email.toLowerCase().trim(),
        full_name: data.full_name.trim(),
        phone: data.phone?.trim() ?? null,
        slot_start: slotStart.toISOString(),
        slot_end: slotEnd.toISOString(),
        notes: data.notes ?? null,
        meeting_url: configRow.default_meeting_url ?? null,
        status: "booked",
        source: "mifge_agenda",
      })
      .select("id, slot_start, slot_end, meeting_url")
      .single()

    if (insertError) {
      console.error("[mifge/calls/book] insert error", insertError)
      return NextResponse.json({ error: "No se pudo reservar el slot" }, { status: 500 })
    }

    // TODO (MIFGE 10 — Resend): disparar email de confirmación de agenda
    // TODO (MIFGE 11 — Meta CAPI): disparar evento mifge_call_booked

    return NextResponse.json({ ok: true, call: inserted }, { status: 201 })
  } catch (e) {
    console.error("[mifge/calls/book]", e)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
