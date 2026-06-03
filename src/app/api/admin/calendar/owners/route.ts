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

const UpdateSchema = z.object({
  id: z.string(),
  display_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  meeting_url: z.string().url().nullable().optional(),
  slot_minutes: z.number().int().min(5).max(240).optional(),
  buffer_minutes: z.number().int().min(0).max(120).optional(),
  active: z.boolean().optional(),
})

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data } = await admin
    .from("calendar_owners")
    .select("id, display_name, email, timezone, slot_minutes, buffer_minutes, meeting_url, active, google_oauth_email, google_oauth_connected_at")
    .order("display_name")
  return NextResponse.json({ owners: data ?? [] })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = UpdateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { id, ...patch } = parsed.data
  const admin = getAdminClient()
  const { error } = await admin
    .from("calendar_owners")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
