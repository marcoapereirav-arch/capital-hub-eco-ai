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
 * GET /api/mifge/calls/cancel/<token>
 * Endpoint público (sin auth) accedido desde el link del email .ics o de
 * confirmación. El token único de cada call autentica la operación.
 *
 * Marca status=cancelled + redirige a /mifge/agenda con mensaje.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  if (!token || token.length < 16) {
    return NextResponse.redirect(new URL("/mifge/agenda?error=token_invalid", "https://ecoai.capitalhubapp.com"))
  }

  const supabase = getAdminClient()
  const { data: call } = await supabase
    .from("calls")
    .select("id, status, slot_start")
    .eq("public_token", token)
    .maybeSingle()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ecoai.capitalhubapp.com"

  if (!call) {
    return NextResponse.redirect(`${baseUrl}/mifge/agenda?error=not_found`)
  }
  if (call.status === "cancelled") {
    return NextResponse.redirect(`${baseUrl}/mifge/agenda?cancelled=already`)
  }
  if (new Date(call.slot_start) < new Date()) {
    return NextResponse.redirect(`${baseUrl}/mifge/agenda?error=already_past`)
  }

  await supabase.from("calls").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", call.id)

  return NextResponse.redirect(`${baseUrl}/mifge/agenda?cancelled=ok`)
}
