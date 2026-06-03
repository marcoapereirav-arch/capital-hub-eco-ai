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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ecoai.capitalhubapp.com"
  if (!token || token.length < 16) {
    return NextResponse.redirect(`${baseUrl}/agenda?error=token_invalid`)
  }
  const supabase = getAdminClient()
  const { data: booking } = await supabase
    .from("calendar_bookings")
    .select("id, status, start_at")
    .eq("public_token", token)
    .maybeSingle()
  if (!booking) return NextResponse.redirect(`${baseUrl}/agenda?error=not_found`)
  if (booking.status === "cancelled") return NextResponse.redirect(`${baseUrl}/agenda?cancelled=already`)
  if (new Date(booking.start_at) < new Date()) return NextResponse.redirect(`${baseUrl}/agenda?error=already_past`)

  await supabase
    .from("calendar_bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id)

  return NextResponse.redirect(`${baseUrl}/agenda?cancelled=ok`)
}
