import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const createSchema = z.object({
  email: z.string().email().max(180).trim().toLowerCase(),
  full_name: z.string().min(2).max(120).trim(),
  products: z.array(z.string()).optional().default([]),
})

/** GET /api/admin/invites — lista todas las invitaciones (super_admin). */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await admin
    .from("student_invites")
    .select("id, email, full_name, products, accepted_at, expires_at, invited_by_name, created_at")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invites: data ?? [] })
}

/** POST /api/admin/invites — crear invitación manual (super_admin). */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).maybeSingle()
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await admin
    .from("student_invites")
    .insert({
      email: parsed.data.email,
      full_name: parsed.data.full_name,
      products: parsed.data.products ?? [],
      token,
      expires_at: expiresAt,
      invited_by: user.id,
      invited_by_name: profile.full_name ?? user.email,
    })
    .select("id, email, full_name, token")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe una invitación con ese email" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
