import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { rateLimit, getClientIp } from "@/lib/rate-limit/supabase-rate-limit"
import { sendAgendaConfirmed, notifyAdrianBooking } from "@/lib/email/senders"

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

    // Crear/asociar contacto en BD (estilo GHL): si existe por email, actualiza last_call_at;
    // si no, lo crea con stage=booked y vincula la booking
    try {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", data.attendee_email.toLowerCase().trim())
        .maybeSingle()

      let contactId = existingContact?.id
      if (!contactId) {
        const { data: created } = await supabase
          .from("contacts")
          .insert({
            full_name: data.attendee_name.trim(),
            email: data.attendee_email.toLowerCase().trim(),
            phone: data.attendee_phone?.trim() ?? null,
            stage: "booked",
            source: "agenda_publica",
            notes: data.notes ?? null,
          })
          .select("id")
          .single()
        contactId = created?.id
      } else {
        await supabase
          .from("contacts")
          .update({
            stage: "booked",
            last_call_at: startAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", contactId)
      }

      if (contactId) {
        await supabase
          .from("calendar_bookings")
          .update({ contact_id: contactId })
          .eq("id", inserted.id)

        // Log journey event
        await supabase.from("contact_journey_events").insert({
          contact_id: contactId,
          type: "call_booked",
          title: `Llamada agendada con ${owner.display_name}`,
          description: data.notes ?? null,
          data: {
            booking_id: inserted.id,
            slot_start: inserted.start_at,
            owner_id: data.owner_id,
          },
        })
      }
    } catch (e) {
      console.error("[calendar/book] contact sync error (no bloquea)", e)
    }

    // Email confirmación al lead + notif Adrián (NO bloquea response al lead)
    const ownerEmailEnv = process.env.INTERNAL_NOTIF_EMAIL_ADRIAN ?? owner.email
    sendAgendaConfirmed({
      fullName: data.attendee_name,
      email: data.attendee_email,
      slotStartIso: inserted.start_at,
      slotEndIso: inserted.end_at,
      meetingUrl: inserted.meeting_url,
      callId: inserted.id,
      publicToken: inserted.public_token,
      cancelUrlPath: "/api/calendar/cancel",
      reschedulePath: "/api/calendar/reschedule",
    }).catch((e) => console.error("[calendar/book] email confirm error", e))

    // Google Calendar: si owner conectado, crea evento con Zoom URL embebida
    try {
      const { createCalendarEventWithExternalUrl } = await import("@/lib/google/calendar-client")
      const ev = await createCalendarEventWithExternalUrl({
        title: `Capital Hub · ${data.attendee_name}`,
        description: `Llamada agendada via /agenda.\n\nLead: ${data.attendee_email}${data.attendee_phone ? `\nTel: ${data.attendee_phone}` : ""}${data.notes ? `\n\nNotas: ${data.notes}` : ""}`,
        startIso: startAt.toISOString(),
        endIso: endAt.toISOString(),
        attendeeEmail: data.attendee_email,
        attendeeName: data.attendee_name,
        meetingUrl: owner.meeting_url ?? "",
      })
      if (ev) {
        await supabase.from("calendar_bookings").update({ gcal_event_id: ev.eventId }).eq("id", inserted.id)
      }
    } catch (e) {
      console.error("[calendar/book] gcal create skipped/error", e)
    }

    notifyAdrianBooking({
      fullName: data.attendee_name,
      email: data.attendee_email,
      phone: data.attendee_phone,
      slotStartIso: inserted.start_at,
      notes: data.notes,
      callId: inserted.id,
    }).catch((e) => console.error("[calendar/book] notif Adrian error", e))

    return NextResponse.json({ ok: true, booking: inserted }, { status: 201 })
  } catch (e) {
    console.error("[calendar/book] fatal", e)
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 })
  }
}
