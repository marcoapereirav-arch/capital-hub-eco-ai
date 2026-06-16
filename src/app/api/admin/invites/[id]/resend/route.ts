import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { sendWelcomeAlumnoHT } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** POST /api/admin/invites/[id]/resend — reenvía magic link al alumno. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).maybeSingle()
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: invite, error } = await admin
    .from("student_invites")
    .select("id, email, full_name, products, token, accepted_at")
    .eq("id", id)
    .maybeSingle()

  if (error || !invite) return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  if (invite.accepted_at) {
    return NextResponse.json({ error: "Esta invitación ya fue aceptada — no se puede reenviar" }, { status: 409 })
  }

  const appUrl = process.env.APP_CAPITAL_HUB_URL?.replace("/functions/v1", "") ?? "https://app.capitalhubapp.com"
  const inviteUrl = `${appUrl}/accept/${invite.token}`

  await sendWelcomeAlumnoHT({
    fullName: invite.full_name,
    email: invite.email,
    product: (invite.products as string[] | null)?.[0] ?? "Capital Hub",
    inviteUrl,
    closerName: profile.full_name ?? "Adrián",
  })

  return NextResponse.json({ ok: true, sent_to: invite.email })
}
