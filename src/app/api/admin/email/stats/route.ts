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
 * GET /api/admin/email/stats?from=2026-01-01&to=2026-12-31
 *
 * Devuelve estadísticas de emails para el rango {from, to}.
 * Si no se pasa from/to, default es últimos 7 días.
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const fromParam = url.searchParams.get("from")
  const toParam = url.searchParams.get("to")

  const now = new Date()
  const from = fromParam ? new Date(fromParam) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const to = toParam ? new Date(toParam) : now

  const admin = getAdminClient()
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  // Métricas dentro del rango
  const [
    { count: total },
    { count: failed },
    { count: opened },
    { count: clicked },
    { count: delivered },
    { count: bounced },
  ] = await Promise.all([
    admin.from("email_logs").select("*", { count: "exact", head: true }).gte("sent_at", fromIso).lte("sent_at", toIso),
    admin.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("sent_at", fromIso).lte("sent_at", toIso),
    admin.from("email_logs").select("*", { count: "exact", head: true }).not("opened_at", "is", null).gte("sent_at", fromIso).lte("sent_at", toIso),
    admin.from("email_logs").select("*", { count: "exact", head: true }).not("clicked_at", "is", null).gte("sent_at", fromIso).lte("sent_at", toIso),
    admin.from("email_logs").select("*", { count: "exact", head: true }).not("delivered_at", "is", null).gte("sent_at", fromIso).lte("sent_at", toIso),
    admin.from("email_logs").select("*", { count: "exact", head: true }).ilike("error", "%bounce%").gte("sent_at", fromIso).lte("sent_at", toIso),
  ])

  // Top templates en el rango
  const { data: topRaw } = await admin
    .from("email_logs")
    .select("template, status, opened_at, clicked_at")
    .gte("sent_at", fromIso)
    .lte("sent_at", toIso)

  const templateCounts = new Map<string, { total: number; failed: number; opened: number; clicked: number }>()
  for (const r of topRaw ?? []) {
    const cur = templateCounts.get(r.template) ?? { total: 0, failed: 0, opened: 0, clicked: 0 }
    cur.total++
    if (r.status === "failed") cur.failed++
    if (r.opened_at) cur.opened++
    if (r.clicked_at) cur.clicked++
    templateCounts.set(r.template, cur)
  }
  const topTemplates = Array.from(templateCounts.entries())
    .map(([template, c]) => ({ template, ...c }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Rates calculados
  const openRate = total ? Math.round(((opened ?? 0) / total) * 100) : 0
  const clickRate = total ? Math.round(((clicked ?? 0) / total) * 100) : 0
  const deliveryRate = total ? Math.round(((delivered ?? 0) / total) * 100) : 0
  const bounceRate = total ? Math.round(((bounced ?? 0) / total) * 100) : 0
  const failureRate = total ? Math.round(((failed ?? 0) / total) * 100) : 0

  return NextResponse.json({
    range: { from: fromIso, to: toIso },
    metrics: {
      total: total ?? 0,
      delivered: delivered ?? 0,
      opened: opened ?? 0,
      clicked: clicked ?? 0,
      bounced: bounced ?? 0,
      failed: failed ?? 0,
      deliveryRate,
      openRate,
      clickRate,
      bounceRate,
      failureRate,
    },
    topTemplates,
  })
}
