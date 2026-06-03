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

const Rule = z.object({
  owner_id: z.string(),
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
})

// GET /api/admin/calendar/availability-rules?owner=adrian
export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const owner = new URL(req.url).searchParams.get("owner") ?? "adrian"
  const admin = getAdminClient()
  const { data } = await admin
    .from("calendar_availability_rules")
    .select("id, owner_id, weekday, start_time, end_time")
    .eq("owner_id", owner)
    .order("weekday")
    .order("start_time")
  return NextResponse.json({ rules: data ?? [] })
}

// POST /api/admin/calendar/availability-rules — crea
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = Rule.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const admin = getAdminClient()
  const { data, error } = await admin
    .from("calendar_availability_rules")
    .insert(parsed.data)
    .select("id")
    .single()
  if (error) return NextResponse.json({ error: "Insert failed" }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

// DELETE /api/admin/calendar/availability-rules?id=...
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const admin = getAdminClient()
  const { error } = await admin.from("calendar_availability_rules").delete().eq("id", id)
  if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
