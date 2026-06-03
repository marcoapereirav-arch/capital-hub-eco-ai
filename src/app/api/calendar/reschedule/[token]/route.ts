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

/**
 * GET /api/calendar/reschedule/[token]
 * Cancela la booking actual y redirige al cliente al /agenda con email y nombre
 * prefilled para que reserve un nuevo slot.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ecoai.capitalhubapp.com"

  if (!token || token.length < 16) {
    return NextResponse.redirect(`${baseUrl}/agenda?error=token_invalid`)
  }

  const supabase = getAdminClient()
  const { data: booking } = await supabase
    .from("calendar_bookings")
    .select("id, status, start_at, attendee_email, attendee_name")
    .eq("public_token", token)
    .maybeSingle()

  if (!booking) return NextResponse.redirect(`${baseUrl}/agenda?error=not_found`)
  if (new Date(booking.start_at) < new Date()) return NextResponse.redirect(`${baseUrl}/agenda?error=already_past`)

  if (booking.status !== "cancelled") {
    await supabase
      .from("calendar_bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", booking.id)
  }

  const params = new URLSearchParams({
    rescheduled: "1",
    email: booking.attendee_email,
    name: booking.attendee_name,
  })
  return NextResponse.redirect(`${baseUrl}/agenda?${params.toString()}`)
}
