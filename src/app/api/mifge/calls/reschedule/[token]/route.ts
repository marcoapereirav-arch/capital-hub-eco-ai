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
 * GET /api/mifge/calls/reschedule/<token>
 * Cancela la call existente y redirige al usuario al agenda con flag para
 * que reserve un nuevo slot (mismo email/lead, nuevo registro).
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ecoai.capitalhubapp.com"

  if (!token || token.length < 16) {
    return NextResponse.redirect(`${baseUrl}/mifge/agenda?error=token_invalid`)
  }

  const supabase = getAdminClient()
  const { data: call } = await supabase
    .from("calls")
    .select("id, status, slot_start, email, full_name, phone, lead_id")
    .eq("public_token", token)
    .maybeSingle()

  if (!call) {
    return NextResponse.redirect(`${baseUrl}/mifge/agenda?error=not_found`)
  }
  if (new Date(call.slot_start) < new Date()) {
    return NextResponse.redirect(`${baseUrl}/mifge/agenda?error=already_past`)
  }

  if (call.status !== "cancelled") {
    await supabase
      .from("calls")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", call.id)
  }

  const params = new URLSearchParams({
    rescheduled: "1",
    email: call.email ?? "",
    name: call.full_name ?? "",
  })
  return NextResponse.redirect(`${baseUrl}/mifge/agenda?${params.toString()}`)
}
