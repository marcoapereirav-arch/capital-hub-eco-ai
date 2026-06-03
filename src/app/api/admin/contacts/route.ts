import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const CreateSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional(),
  company: z.string().max(200).optional(),
  stage: z.string().max(50).optional(),
  source: z.string().max(60).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const params = new URL(req.url).searchParams
  const q = params.get("q")?.toLowerCase()
  const stage = params.get("stage")
  const limit = Math.min(500, Math.max(1, parseInt(params.get("limit") ?? "200", 10)))

  const admin = getAdminClient()
  let query = admin
    .from("contacts")
    .select("id, full_name, email, phone, stage, products, total_revenue, total_cash_collected, source, tags, last_call_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (stage) query = query.eq("stage", stage)
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = CreateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const data = parsed.data
  const admin = getAdminClient()
  const { data: inserted, error } = await admin
    .from("contacts")
    .insert({
      full_name: data.full_name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() ?? null,
      company: data.company?.trim() ?? null,
      stage: data.stage ?? "new",
      source: data.source ?? "manual",
      tags: data.tags ?? [],
      notes: data.notes ?? null,
    })
    .select("id")
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 })
}
