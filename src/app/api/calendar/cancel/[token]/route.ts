import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://os.capitalhubapp.com"
  if (!token || token.length < 16) {
    return NextResponse.redirect(`${baseUrl}/agenda?error=token_invalid`)
  }
  const supabase = getAdminClient()
  const { data: booking } = await supabase
    .from("calendar_bookings")
    .select("id, status, start_at, gcal_event_id, contact_id")
    .eq("public_token", token)
    .maybeSingle()
  if (!booking) return NextResponse.redirect(`${baseUrl}/agenda?error=not_found`)
  if (booking.status === "cancelled") return NextResponse.redirect(`${baseUrl}/agenda?cancelled=already`)
  if (new Date(booking.start_at) < new Date()) return NextResponse.redirect(`${baseUrl}/agenda?error=already_past`)

  await supabase
    .from("calendar_bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id)

  // Delete Google Calendar event si existe
  if (booking.gcal_event_id) {
    try {
      const { getValidAccessToken, loadGoogleConnection } = await import("@/lib/google/calendar-client")
      const accessToken = await getValidAccessToken()
      const conn = await loadGoogleConnection()
      if (accessToken && conn) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendar_id)}/events/${booking.gcal_event_id}?sendUpdates=all`,
          { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
        )
      }
    } catch (e) {
      console.error("[calendar/cancel] gcal delete failed", e)
    }
  }

  // Log journey event
  if (booking.contact_id) {
    await supabase.from("contact_journey_events").insert({
      contact_id: booking.contact_id,
      type: "call_cancelled",
      title: "Llamada cancelada por el lead",
      data: { booking_id: booking.id },
    })
    // Stage al cancelar (SOP 13): si estaba en 'agendado', pasa a 'seguimiento'
    // para decidir qué hacer (re-agendar o perdido). Nunca degradar a un alumno.
    const { data: c } = await supabase
      .from("contacts")
      .select("stage")
      .eq("id", booking.contact_id)
      .maybeSingle()
    if (c?.stage === "agendado") {
      await supabase
        .from("contacts")
        .update({ stage: "seguimiento", updated_at: new Date().toISOString() })
        .eq("id", booking.contact_id)
    }
  }

  return NextResponse.redirect(`${baseUrl}/agenda?cancelled=ok`)
}
