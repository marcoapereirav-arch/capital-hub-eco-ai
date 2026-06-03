import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { rateLimit, getClientIp } from "@/lib/rate-limit/supabase-rate-limit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const BookSchema = z.object({
  owner_id: z.string().min(1).default("adrian"),
  slot_start: z.string().datetime(),
  attendee_name: z.string().min(2).max(120),
  attendee_email: z.string().email().max(255),
  attendee_phone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
})

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/calendar/book
 * Reserva un slot. El unique index (owner, start_at) where status=booked
 * previene double-booking a nivel BD (race-safe).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = await rateLimit({ key: `cal_book:${ip}`, limit: 5, windowSeconds: 60 })
    if (!rl.allowed) return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 })

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

    // Carga owner para slot_minutes + meeting_url
    const { data: owner } = await supabase
      .from("calendar_owners")
      .select("slot_minutes, meeting_url, display_name, email")
      .eq("id", data.owner_id)
      .single()
    if (!owner) return NextResponse.json({ error: "Owner no encontrado" }, { status: 404 })

    const startAt = new Date(data.slot_start)
    if (startAt < new Date()) {
      return NextResponse.json({ error: "El slot ya ha pasado" }, { status: 400 })
    }
    const endAt = new Date(startAt.getTime() + (owner.slot_minutes ?? 30) * 60_000)

    const { data: inserted, error } = await supabase
      .from("calendar_bookings")
      .insert({
        owner_id: data.owner_id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        attendee_name: data.attendee_name.trim(),
        attendee_email: data.attendee_email.toLowerCase().trim(),
        attendee_phone: data.attendee_phone?.trim() ?? null,
        notes: data.notes ?? null,
        meeting_url: owner.meeting_url,
        status: "booked",
        source: "public_form",
      })
      .select("id, public_token, start_at, end_at, meeting_url")
      .single()

    if (error) {
      // 23505 = unique violation → double booking race
      const msg = (error as { code?: string }).code === "23505"
        ? "Ese slot ya no está disponible"
        : "No se pudo reservar"
      console.error("[calendar/book]", error)
      return NextResponse.json({ error: msg }, { status: 409 })
    }

    // TODO Wave 2/3: enviar email confirmación + .ics + crear evento Google Calendar
    return NextResponse.json({ ok: true, booking: inserted }, { status: 201 })
  } catch (e) {
    console.error("[calendar/book] fatal", e)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
