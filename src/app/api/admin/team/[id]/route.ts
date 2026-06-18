import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ROLES = ["super_admin", "marketing", "closer", "setter", "formador"] as const
const FORMACIONES = ["ia-integrator", "media-buyer-digital", "comercial-closing"] as const

const PatchSchema = z.object({
  role: z.enum(ROLES).optional(),
  full_name: z.string().min(2).max(120).optional(),
  active: z.boolean().optional(),
  formacion_asignada: z.enum(FORMACIONES).nullable().optional(),
})

/** OS role → App role (ADMIN/USER). Replicado en /team route POST. */
function osRoleToAppRole(osRole: typeof ROLES[number]): "ADMIN" | "USER" {
  if (osRole === "super_admin" || osRole === "formador") return "ADMIN"
  return "USER"
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function ensureSuperAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, code: 401, msg: "Unauthorized" }
  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!caller || caller.role !== "super_admin") {
    return { ok: false as const, code: 403, msg: "Forbidden" }
  }
  return { ok: true as const, callerId: user.id }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await ensureSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.msg }, { status: auth.code })

  const { id } = await ctx.params
  const parsed = PatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const admin = getAdminClient()
  const data = parsed.data

  // 1. Update profile OS
  const { error } = await admin
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2. Si cambió role: propagar a user_metadata.role + public.users.role
  // Esto mantiene el SSO funcional al cambiar el rol de un miembro existente.
  if (data.role) {
    const appRole = osRoleToAppRole(data.role)
    // Lee user_metadata actual para no perder otros campos (full_name, formacion_asignada)
    const { data: authUser } = await admin.auth.admin.getUserById(id)
    const currentMeta = (authUser.user?.user_metadata ?? {}) as Record<string, unknown>
    await admin.auth.admin.updateUserById(id, {
      user_metadata: {
        ...currentMeta,
        role: appRole,
        ...(data.full_name ? { full_name: data.full_name } : {}),
      },
    }).then(() => null, () => null)

    // public.users (tabla App): role + opcionalmente formacion_asignada
    const usersUpdate: Record<string, unknown> = { role: appRole }
    if (data.formacion_asignada !== undefined) {
      usersUpdate.formacion_asignada = data.role === "formador" ? data.formacion_asignada : null
    }
    await admin
      .from("users")
      .update(usersUpdate)
      .eq("auth_user_id", id)
      .then(() => null, () => null)
  }

  // 3. Si solo cambió formacion_asignada (sin role): propagar a public.users
  if (data.role === undefined && data.formacion_asignada !== undefined) {
    await admin
      .from("users")
      .update({ formacion_asignada: data.formacion_asignada })
      .eq("auth_user_id", id)
      .then(() => null, () => null)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await ensureSuperAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.msg }, { status: auth.code })

  const { id } = await ctx.params
  if (id === auth.callerId) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 })
  }
  const admin = getAdminClient()
  // Soft delete: marca active=false en profiles. NO borramos del auth para no perder histórico.
  const { error } = await admin
    .from("profiles")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
