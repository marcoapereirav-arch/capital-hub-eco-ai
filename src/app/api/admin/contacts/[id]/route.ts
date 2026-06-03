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

const PatchSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(40).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  stage: z.string().max(50).optional(),
  source: z.string().max(60).nullable().optional(),
  products: z.array(z.string()).optional(),
  total_revenue: z.number().nonnegative().optional(),
  total_cash_collected: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  owner_assignee: z.string().nullable().optional(),
})

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const admin = getAdminClient()
  const [{ data: contact }, { data: events }, { data: bookings }] = await Promise.all([
    admin.from("contacts").select("*").eq("id", id).maybeSingle(),
    admin.from("contact_journey_events").select("*").eq("contact_id", id).order("created_at", { ascending: false }).limit(100),
    admin.from("calendar_bookings").select("id, start_at, end_at, status, meeting_url, public_token").eq("contact_id", id).order("start_at", { ascending: false }).limit(30),
  ])

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ contact, events: events ?? [], bookings: bookings ?? [] })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const parsed = PatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const admin = getAdminClient()
  const before = await admin.from("contacts").select("stage").eq("id", id).maybeSingle()

  const { error } = await admin
    .from("contacts")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si cambió el stage, registrar en journey
  if (parsed.data.stage && parsed.data.stage !== before.data?.stage) {
    await admin.from("contact_journey_events").insert({
      contact_id: id,
      type: "stage_change",
      title: `Cambio de pipeline: ${before.data?.stage ?? "(none)"} → ${parsed.data.stage}`,
      data: { from: before.data?.stage ?? null, to: parsed.data.stage },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const admin = getAdminClient()
  const { error } = await admin.from("contacts").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
