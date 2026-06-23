import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { invalidateCapiModeCache } from "@/lib/meta/capi-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Claves permitidas en app_settings (whitelist). 'funnel:<slug>' es dinámico.
function isAllowedKey(key: string): boolean {
  if (key === "meta_capi_mode") return true
  if (key.startsWith("funnel:")) return true
  return false
}

/**
 * GET /api/admin/settings/[key] — lee el valor (jsonb) de app_settings.
 * Autenticado (UI admin). El landing público lee directo por service role, no por aquí.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params
  if (!isAllowedKey(key)) return NextResponse.json({ error: "Clave no permitida" }, { status: 400 })

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle()
  return NextResponse.json({ key, value: data?.value ?? {} })
}

/**
 * PUT /api/admin/settings/[key] — upsert del valor (jsonb). Solo super_admin.
 * Body: { value: object }
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params
  if (!isAllowedKey(key)) return NextResponse.json({ error: "Clave no permitida" }, { status: 400 })

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Solo super_admin puede editar ajustes" }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as { value?: unknown }
  if (typeof body.value !== "object" || body.value === null || Array.isArray(body.value)) {
    return NextResponse.json({ error: "value debe ser un objeto" }, { status: 400 })
  }

  const { error } = await admin
    .from("app_settings")
    .upsert({ key, value: body.value, updated_at: new Date().toISOString() }, { onConflict: "key" })
  if (error) {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 })
  }

  if (key === "meta_capi_mode") invalidateCapiModeCache()
  return NextResponse.json({ ok: true, key, value: body.value })
}
