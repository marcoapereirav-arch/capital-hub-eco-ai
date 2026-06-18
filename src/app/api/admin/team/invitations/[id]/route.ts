import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * DELETE /api/admin/team/invitations/[id]
 * Cancela una invitación pendiente.
 * Si la invitación tiene user_id (user creado en auth pero NO aceptado todavía),
 * borra también de auth.users + profiles para liberar el email para reintento.
 * Solo super_admin.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (!caller || caller.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden — solo super_admin" }, { status: 403 })
  }

  const { id } = await ctx.params
  const admin = getAdminClient()

  // Obtener la invitación
  const { data: invite } = await admin
    .from("team_invitations")
    .select("id, user_id, accepted_at, email")
    .eq("id", id)
    .maybeSingle()

  if (!invite) return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  if (invite.accepted_at) {
    return NextResponse.json({ error: "No se puede cancelar: ya fue aceptada" }, { status: 409 })
  }

  // Borrar la invitación
  const { error: delErr } = await admin.from("team_invitations").delete().eq("id", id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Si tiene user_id (cuenta auth creada pero no activada), borrar también auth + profile
  // para que el email quede libre para reinvitar.
  if (invite.user_id) {
    await admin.from("profiles").delete().eq("id", invite.user_id).then(() => null, () => null)
    await admin.auth.admin.deleteUser(invite.user_id).then(() => null, () => null)
  }

  return NextResponse.json({ ok: true })
}
