import { NextResponse } from "next/server"
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

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Counts por ventana
  const [{ count: total24h }, { count: failed24h }, { count: total7d }, { count: failed7d }, { count: total30d }, { count: failed30d }, { count: opened }, { count: clicked }] = await Promise.all([
    admin.from("email_logs").select("*", { count: "exact", head: true }).gte("sent_at", last24h.toISOString()),
    admin.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("sent_at", last24h.toISOString()),
    admin.from("email_logs").select("*", { count: "exact", head: true }).gte("sent_at", last7d.toISOString()),
    admin.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("sent_at", last7d.toISOString()),
    admin.from("email_logs").select("*", { count: "exact", head: true }).gte("sent_at", last30d.toISOString()),
    admin.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("sent_at", last30d.toISOString()),
    admin.from("email_logs").select("*", { count: "exact", head: true }).not("opened_at", "is", null).gte("sent_at", last30d.toISOString()),
    admin.from("email_logs").select("*", { count: "exact", head: true }).not("clicked_at", "is", null).gte("sent_at", last30d.toISOString()),
  ])

  // Top templates 7d
  const { data: topTemplatesRaw } = await admin
    .from("email_logs")
    .select("template, status")
    .gte("sent_at", last7d.toISOString())

  const templateCounts = new Map<string, { total: number; failed: number }>()
  for (const r of topTemplatesRaw ?? []) {
    const cur = templateCounts.get(r.template) ?? { total: 0, failed: 0 }
    cur.total++
    if (r.status === "failed") cur.failed++
    templateCounts.set(r.template, cur)
  }
  const topTemplates = Array.from(templateCounts.entries())
    .map(([template, c]) => ({ template, ...c }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return NextResponse.json({
    last24h: { total: total24h ?? 0, failed: failed24h ?? 0 },
    last7d: { total: total7d ?? 0, failed: failed7d ?? 0 },
    last30d: { total: total30d ?? 0, failed: failed30d ?? 0, opened: opened ?? 0, clicked: clicked ?? 0 },
    topTemplates,
  })
}
