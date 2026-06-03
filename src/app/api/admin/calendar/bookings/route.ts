import { NextRequest, NextResponse } from "next/server"
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

// GET /api/admin/calendar/bookings?owner=adrian&limit=200
export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const params = new URL(req.url).searchParams
  const owner = params.get("owner") ?? "adrian"
  const limit = Math.min(500, Math.max(1, parseInt(params.get("limit") ?? "200", 10)))

  const admin = getAdminClient()
  const { data } = await admin
    .from("calendar_bookings")
    .select("id, start_at, end_at, attendee_name, attendee_email, attendee_phone, notes, meeting_url, status, public_token, gcal_event_id, created_at")
    .eq("owner_id", owner)
    .order("start_at", { ascending: true })
    .limit(limit)
  return NextResponse.json({ bookings: data ?? [] })
}
