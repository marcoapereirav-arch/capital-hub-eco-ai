import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ROLES = ["super_admin", "marketing", "closer", "setter", "formador"] as const

const PatchSchema = z.object({
  role: z.enum(ROLES).optional(),
  full_name: z.string().min(2).max(120).optional(),
  active: z.boolean().optional(),
})

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
  const { error } = await admin
    .from("profiles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
