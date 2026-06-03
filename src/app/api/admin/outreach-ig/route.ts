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
  ig_username: z.string().min(1).max(120),
  ig_url: z.string().url().optional(),
  full_name: z.string().max(200).optional(),
  notes_assigned: z.string().optional(),
  closer_assigned: z.string().max(60).optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const params = new URL(req.url).searchParams
  const status = params.get("status")
  const closer = params.get("closer")
  const limit = Math.min(500, Math.max(1, parseInt(params.get("limit") ?? "200", 10)))

  const admin = getAdminClient()
  let q = admin
    .from("outreach_ig_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (status) q = q.eq("status", status)
  if (closer) q = q.eq("closer_assigned", closer)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data ?? [] })
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
  const { error } = await admin.from("outreach_ig_leads").insert({
    ig_username: data.ig_username.trim().toLowerCase().replace(/^@/, ""),
    ig_url: data.ig_url ?? null,
    full_name: data.full_name ?? null,
    notes_assigned: data.notes_assigned ?? null,
    closer_assigned: data.closer_assigned ?? null,
  })
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Ese username ya está en la bandeja" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
