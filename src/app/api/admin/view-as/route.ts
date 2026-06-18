import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { VIEW_AS_COOKIE_NAME } from "@/lib/auth/role-access"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const bodySchema = z.object({
  role: z.enum(["marketing", "formador", "closer", "setter"]).nullable(),
})

/**
 * POST /api/admin/view-as
 * Setea (o limpia con role=null) la cookie view_as_role para que el admin
 * vea la UI con los permisos del rol elegido.
 * Solo super_admin/admin pueden invocar.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle()
  const role = profile?.role
  if (role !== "super_admin" && role !== "admin") {
    return NextResponse.json({ error: "Solo super_admin/admin puede impersonar roles" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.format() }, { status: 400 })
  }

  const cookieStore = await cookies()
  if (parsed.data.role === null) {
    cookieStore.delete(VIEW_AS_COOKIE_NAME)
    return NextResponse.json({ ok: true, viewAs: null })
  }

  cookieStore.set(VIEW_AS_COOKIE_NAME, parsed.data.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  })
  return NextResponse.json({ ok: true, viewAs: parsed.data.role })
}
