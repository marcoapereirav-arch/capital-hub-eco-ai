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

/**
 * GET /api/admin/calendly/events?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Devuelve scheduled_events del rango + sus event_type names + count por status
 * para la UI /calendario.
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")

  const admin = getAdminClient()

  let q = admin
    .from("calendly_scheduled_events")
    .select("uri, name, start_time, end_time, status, meeting_url, event_type_uri, invitee_email, invitee_name, invitee_phone, invitee_cancellation_reason")
    .order("start_time", { ascending: false })

  if (from) q = q.gte("start_time", from)
  if (to) {
    // 'to' inclusive: añade 1 día
    const toDate = new Date(to)
    toDate.setUTCDate(toDate.getUTCDate() + 1)
    q = q.lt("start_time", toDate.toISOString().slice(0, 10))
  }

  const { data: events } = await q.limit(500)

  // Join event_type names
  const { data: eventTypes } = await admin
    .from("calendly_event_types")
    .select("uri, name, duration, color, scheduling_url")
  const etMap = new Map((eventTypes ?? []).map((et) => [et.uri, et]))

  const enriched = (events ?? []).map((e) => ({
    ...e,
    event_type_name: etMap.get(e.event_type_uri ?? "")?.name ?? null,
    event_type_duration: etMap.get(e.event_type_uri ?? "")?.duration ?? null,
    event_type_color: etMap.get(e.event_type_uri ?? "")?.color ?? null,
  }))

  // KPIs del rango
  const total = enriched.length
  const active = enriched.filter((e) => e.status === "active").length
  const canceled = enriched.filter((e) => e.status === "canceled").length
  const noShow = enriched.filter((e) => e.status === "no_show").length

  return NextResponse.json({
    events: enriched,
    kpis: { total, active, canceled, no_show: noShow },
    event_types: eventTypes ?? [],
  })
}
