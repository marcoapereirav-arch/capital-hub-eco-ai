import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"
import { requestEmailChange } from "@/features/auth/services/email-change"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/admin/team/[id]/email — un super_admin pide cambiar el email de un
 * miembro. NO se cambia directo: dispara el flujo seguro (confirmación al email
 * NUEVO), igual que el cambio de email del propio perfil.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!caller || caller.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as { newEmail?: string }

  const admin = createServiceRoleClient()
  const { data: member } = await admin.from("profiles").select("email").eq("id", id).maybeSingle()
  if (!member) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 })

  const r = await requestEmailChange(id, (member as { email: string }).email, body.newEmail ?? "")
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ok: true, sent: true, newEmail: r.newEmail })
}
