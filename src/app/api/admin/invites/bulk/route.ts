import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const bulkSchema = z.object({
  rows: z
    .array(
      z.object({
        email: z.string().email().max(180).trim().toLowerCase(),
        full_name: z.string().min(1).max(120).trim(),
        product: z.string().max(60).optional(),
      }),
    )
    .min(1)
    .max(500),
})

/**
 * POST /api/admin/invites/bulk — crea N invitaciones de un CSV parseado en el cliente.
 *
 * Devuelve resumen: creadas + omitidas (ya existian) + errores.
 */
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
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "CSV inválido", details: parsed.error.format() }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  let created = 0
  let skipped = 0
  const errors: { email: string; error: string }[] = []

  for (const row of parsed.data.rows) {
    const token = randomBytes(32).toString("hex")
    const { error } = await admin.from("student_invites").insert({
      email: row.email,
      full_name: row.full_name,
      products: row.product ? [row.product] : [],
      token,
      expires_at: expiresAt,
      invited_by: user.id,
      invited_by_name: profile.full_name ?? user.email,
    })
    if (error) {
      if (error.code === "23505") {
        skipped++
      } else {
        errors.push({ email: row.email, error: error.message })
      }
    } else {
      created++
    }
  }

  return NextResponse.json({
    ok: true,
    total: parsed.data.rows.length,
    created,
    skipped,
    errors,
  })
}
