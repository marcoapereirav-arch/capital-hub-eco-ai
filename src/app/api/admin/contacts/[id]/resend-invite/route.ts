import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { sendWelcomeAlumnoHT } from "@/lib/email/senders"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/admin/contacts/[id]/resend-invite
 * Reenvía el magic link al alumno (último student_invite del contacto por email).
 * Útil cuando el alumno perdió el email o pidió reenvío.
 *
 * - Busca la invitación pendiente más reciente del contacto.
 * - Si ya fue aceptada → 409.
 * - Si no existe ninguna → 404 (probablemente nunca se registró venta).
 */
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

  const { data: contact } = await admin
    .from("contacts").select("id, email, full_name").eq("id", id).maybeSingle()
  if (!contact) return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 })

  // Buscar la invitación pendiente más reciente del contacto por email
  const { data: invite } = await admin
    .from("student_invites")
    .select("id, email, full_name, products, token, accepted_at")
    .eq("email", contact.email)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!invite) {
    return NextResponse.json(
      { error: "Este contacto no tiene invitaciones pendientes a la App" },
      { status: 404 },
    )
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
