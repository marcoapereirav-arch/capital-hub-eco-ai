import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { notifyMarcoErrors } from "@/lib/email/senders"
import type { ErrorAlertItem } from "@/lib/email/templates/internal-error-alert"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cron Supabase pg_cron cada 30 min: detecta fallos en email_logs y
 * meta_events_log desde la última corrida → envía resumen a Marco si hay algo.
 *
 * Trackea last_run en calls_availability.error_alerts_last_run_at para no
 * re-alertar los mismos fallos.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()

  const { data: cfg } = await supabase
    .from("calls_availability")
    .select("error_alerts_last_run_at")
    .eq("id", 1)
    .single()

  const lastRun = cfg?.error_alerts_last_run_at
    ? new Date(cfg.error_alerts_last_run_at)
    : new Date(Date.now() - 60 * 60 * 1000) // fallback: 1h
  const now = new Date()
  const windowMinutes = Math.max(1, Math.round((now.getTime() - lastRun.getTime()) / 60000))

  const [emailRes, capiRes] = await Promise.all([
    supabase
      .from("email_logs")
      .select("template, to_email, error, sent_at")
      .eq("status", "failed")
      .gt("sent_at", lastRun.toISOString())
      .order("sent_at", { ascending: false }),
    supabase
      .from("meta_events_log")
      .select("event_name, error, created_at, source")
      .eq("status", "failed")
      .gt("created_at", lastRun.toISOString())
      .order("created_at", { ascending: false }),
  ])

  const emailFails = emailRes.data?.length ?? 0
  const capiFails = capiRes.data?.length ?? 0
  const total = emailFails + capiFails

  // Siempre actualiza last_run aunque no haya errores (avanza la ventana)
  await supabase
    .from("calls_availability")
    .update({ error_alerts_last_run_at: now.toISOString() })
    .eq("id", 1)

  if (total === 0) {
    return NextResponse.json({ ok: true, fails: 0, windowMinutes })
  }

  const items: ErrorAlertItem[] = [
    ...(emailRes.data ?? []).map((r) => ({
      source: "email" as const,
      template_or_event: r.template ?? "(unknown)",
      error: r.error ?? "(no error msg)",
      occurred_at: r.sent_at ?? "",
      to_or_meta: r.to_email,
    })),
    ...(capiRes.data ?? []).map((r) => ({
      source: "capi" as const,
      template_or_event: r.event_name ?? "(unknown)",
      error: r.error ?? "(no error msg)",
      occurred_at: r.created_at ?? "",
      to_or_meta: r.source ?? null,
    })),
  ]

  const sendRes = await notifyMarcoErrors({
    windowMinutes,
    emailFails,
    capiFails,
    items,
  })

  return NextResponse.json({
    ok: sendRes.ok,
    sent: total,
    emailFails,
    capiFails,
    windowMinutes,
    error: sendRes.error,
  })
}
