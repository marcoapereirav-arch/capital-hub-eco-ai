import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * GET /api/admin/automations
 *
 * Vista en VIVO con datos REALES (sin fantasmas).
 *
 * Status calculado:
 *   - 'live'    = ejecutándose ahora mismo (cron corrió en últimas 24h o
 *                 webhook recibió evento real en últimos 7d)
 *   - 'idle'    = registrada y configurada pero sin ejecuciones recientes
 *   - 'pending' = falta paso externo (token, panel ManyChat, OAuth, etc)
 *   - 'error'   = última ejecución conocida falló
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const now = new Date()

  // 1. CRON JOBS reales — query directa via Management API si SUPABASE_ACCESS_TOKEN disponible.
  // Si no, los crons quedan como 'idle' (registrados pero sin stats).
  const cronData: Record<string, { runs: number; lastRun: string | null }> = {}
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    try {
      const projectRef = process.env.SUPABASE_PROJECT_REF ?? "aglyoyqtzozdnusltjxe"
      const sql = `SELECT j.jobname, COUNT(d.runid)::int as runs, MAX(d.start_time)::text as last_run
                   FROM cron.job j
                   LEFT JOIN cron.job_run_details d
                     ON d.jobid = j.jobid AND d.start_time > now() - interval '24 hours'
                   GROUP BY j.jobname;`
      const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      })
      if (resp.ok) {
        const rows = (await resp.json()) as Array<{ jobname: string; runs: number; last_run: string | null }>
        for (const r of rows) {
          cronData[r.jobname] = { runs: r.runs, lastRun: r.last_run }
        }
      }
    } catch {
      // ignore, fallback
    }
  }

  // 2. Datos en vivo de tablas reales (paralelos)
  const [
    { count: bookingsCount },
    { data: lastBooking },
    { count: emailsCount },
    { data: lastEmail },
    { data: gcalOwner },
    { data: lastFailedEmail },
    { data: lastSale },
    { count: manychatCount },
    { data: lastManychatEvent },
    { count: metaCount },
    { data: lastMetaEvent },
  ] = await Promise.all([
    admin.from("calendar_bookings").select("id", { count: "exact", head: true }),
    admin.from("calendar_bookings").select("id, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("email_logs").select("id", { count: "exact", head: true }),
    admin.from("email_logs").select("id, template, sent_at, status").order("sent_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("calendar_owners").select("google_oauth_refresh_token, google_oauth_connected_at, google_oauth_email").eq("id", "adrian").maybeSingle(),
    admin.from("email_logs").select("template, sent_at, error").eq("status", "failed").order("sent_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("contact_journey_events").select("created_at").eq("type", "sale").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("manychat_events").select("id", { count: "exact", head: true }),
    admin.from("manychat_events").select("created_at, event_type").order("id", { ascending: false }).limit(1).maybeSingle(),
    admin.from("meta_events_log").select("id", { count: "exact", head: true }),
    admin.from("meta_events_log").select("created_at, status").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ])

  const hoursSince = (iso: string | null | undefined) => {
    if (!iso) return null
    return Math.round((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60))
  }

  function cronStatus(jobname: string): { status: "live" | "idle" | "pending"; reason: string; lastRun: string | null; runs: number | null } {
    const data = cronData[jobname]
    if (!data) return { status: "idle", reason: "Cron registrado pero sin stats disponibles", lastRun: null, runs: null }
    if (data.runs > 0 && data.lastRun) {
      return { status: "live", reason: `pg_cron activo · ${data.runs} ejecuciones últimas 24h`, lastRun: data.lastRun, runs: data.runs }
    }
    return { status: "idle", reason: "Cron registrado, sin ejecuciones recientes", lastRun: null, runs: 0 }
  }

  const reminderStats = cronStatus("mifge_agenda_reminder_24h")
  const trialEndsStats = cronStatus("mifge_trial_ends_48h")
  const noShowStats = cronStatus("mifge_no_show_detection")
  const errorAlertsStats = cronStatus("mifge_error_alerts")
  const gcalHealthStats = cronStatus("gcal_health_check")
  const welcomeFollowupStats = cronStatus("welcome_alumno_followup")

  // ManyChat: si solo hay 0-1 eventos en BD = NO está realmente activo (1 era test)
  const manychatActive = (manychatCount ?? 0) > 1
  // Resend: cuenta como "live" si hay emails enviados
  const resendActive = (emailsCount ?? 0) > 0

  // Stats del funnel Test Personalidad (opt-in)
  const { count: tpOptinCount } = await admin
    .from("contact_journey_events")
    .select("*", { count: "exact", head: true })
    .eq("type", "optin_test_personalidad")
  const { data: lastTpOptin } = await admin
    .from("contact_journey_events")
    .select("created_at")
    .eq("type", "optin_test_personalidad")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Stats Calendly
  const { count: calendlyCount } = await admin
    .from("calendly_scheduled_events")
    .select("*", { count: "exact", head: true })
  const { data: lastCalendly } = await admin
    .from("calendly_scheduled_events")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const automations = [
    {
      id: "agenda_to_calendar",
      category: "calendario",
      label: "Reserva → Google Calendar de Adrián",
      description: "Lead reserva slot en /agenda → el sistema crea evento en Google Calendar de Adrián con Zoom, datos del lead y notas. Mueve stage a 'agendado'.",
      trigger: "POST /api/calendar/book (form público /agenda)",
      actions: [
        "Crea row calendar_bookings + public_token",
        "Upsert contact stage='agendado'",
        "Refresh access_token con OAuth de Adrián",
        "POST Google Calendar API → crea evento",
        "Email confirmación al lead + email notif a Adrián vía Resend",
        "Inserta contact_journey_event 'call_booked'",
      ],
      relatedTables: ["calendar_bookings", "contacts", "calendar_owners", "email_logs", "contact_journey_events"],
      status: gcalOwner?.google_oauth_refresh_token ? "live" : "pending",
      statusReason: gcalOwner?.google_oauth_refresh_token
        ? `Google Calendar conectado (${gcalOwner.google_oauth_email ?? ""})`
        : "Falta conectar Google Calendar en /calendario",
      lastRun: lastBooking?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastBooking?.created_at),
      totalExecutions: bookingsCount ?? 0,
    },
    {
      id: "agenda_reminder_24h",
      category: "calendario",
      label: "Cron recordatorio 24h antes de llamada",
      description: "Cada 30 min, busca llamadas en próximas 24h y envía email recordatorio al lead.",
      trigger: "pg_cron */30min → GET /api/cron/agenda-reminder-24h",
      actions: [
        "SELECT bookings WHERE start_at en próximas 24h",
        "Render template agenda_reminder_24h",
        "Envía email vía Resend con Zoom link",
        "Marca metadata.reminder_sent_at",
      ],
      relatedTables: ["calendar_bookings", "email_logs"],
      status: reminderStats.status,
      statusReason: reminderStats.reason,
      lastRun: reminderStats.lastRun,
      lastRunHoursAgo: hoursSince(reminderStats.lastRun),
      totalExecutions: reminderStats.runs,
    },
    {
      id: "trial_ends_48h",
      category: "ventas",
      label: "Cron trial_ends_48h (MIFGE legacy)",
      description: "Cada hora, busca usuarios cuyo trial termina en 48h y envía email recordatorio antes de cobrar.",
      trigger: "pg_cron 0 * * * * → GET /api/cron/trial-ends-48h",
      actions: [
        "SELECT users cuyo trial termina entre +47h y +48h",
        "Envía email aviso antes del cobro",
      ],
      relatedTables: ["users", "email_logs"],
      status: trialEndsStats.status,
      statusReason: trialEndsStats.reason,
      lastRun: trialEndsStats.lastRun,
      lastRunHoursAgo: hoursSince(trialEndsStats.lastRun),
      totalExecutions: trialEndsStats.runs,
    },
    {
      id: "no_show_detection",
      category: "calendario",
      label: "Cron detección no-show + email retargeting",
      description: "Cada 30 min, detecta llamadas pasadas (1-25h) sin attended. Marca no_show + email re-agenda al lead.",
      trigger: "pg_cron */30min → GET /api/cron/no-show-detection",
      actions: [
        "SELECT bookings status='booked' AND start_at hace 1-25h",
        "UPDATE bookings status='no_show' + contact stage='no_show'",
        "Envía email template no_show con link re-agendar",
        "Inserta contact_journey_event 'no_show_detected'",
      ],
      relatedTables: ["calendar_bookings", "contacts", "email_logs", "contact_journey_events"],
      status: noShowStats.status,
      statusReason: noShowStats.reason,
      lastRun: noShowStats.lastRun,
      lastRunHoursAgo: hoursSince(noShowStats.lastRun),
      totalExecutions: noShowStats.runs,
    },
    {
      id: "gcal_health_check",
      category: "calendario",
      label: "Cron salud Google Calendar",
      description: "Cada hora, verifica que el refresh_token de Adrián sigue vivo. Si falla, alerta a Marco y Adrián.",
      trigger: "pg_cron 0 * * * * → GET /api/cron/gcal-health-check",
      actions: [
        "Lee refresh_token de calendar_owners",
        "Intenta refresh contra oauth2.googleapis.com/token",
        "Si OK: actualiza access_token",
        "Si falla: marca disconnected + email alert + push",
      ],
      relatedTables: ["calendar_owners", "email_logs", "notifications"],
      status: gcalHealthStats.status,
      statusReason: gcalOwner?.google_oauth_refresh_token
        ? `${gcalHealthStats.reason} · Token OK`
        : "OAuth no conectado",
      lastRun: gcalHealthStats.lastRun,
      lastRunHoursAgo: hoursSince(gcalHealthStats.lastRun),
      totalExecutions: gcalHealthStats.runs,
    },
    {
      id: "error_alerts_digest",
      category: "sistema",
      label: "Cron alert digest 30min",
      description: "Cada 30 min, recopila errores críticos del OS (emails fallidos, webhooks rotos, crons que petaron) y envía digest a Marco.",
      trigger: "pg_cron */30min → GET /api/cron/error-alerts",
      actions: [
        "SELECT email_logs WHERE status='failed' últimos 30min",
        "Si hay errores: render digest + envía a Marco",
      ],
      relatedTables: ["email_logs", "notifications"],
      status: errorAlertsStats.status,
      statusReason: errorAlertsStats.reason,
      lastRun: lastFailedEmail?.sent_at ?? errorAlertsStats.lastRun,
      lastRunHoursAgo: hoursSince(lastFailedEmail?.sent_at ?? errorAlertsStats.lastRun),
      totalExecutions: errorAlertsStats.runs,
    },
    {
      id: "register_sale",
      category: "ventas",
      label: "Registrar venta → email magic link al alumno",
      description: "El closer registra una venta desde el widget flotante. El sistema crea token + envía email con magic link para activar la App.",
      trigger: "POST /api/admin/sales/register (widget Registrar venta)",
      actions: [
        "Upsert contact stage='alumno' + suma revenue + products[]",
        "Crea contact_journey_event 'sale'",
        "Crea student_invite con token único (expira 7d)",
        "Email welcome_alumno_ht al alumno con magic link",
      ],
      relatedTables: ["contacts", "student_invites", "contact_journey_events", "email_logs"],
      status: lastSale ? "live" : "idle",
      statusReason: lastSale
        ? "Última venta hace " + (hoursSince(lastSale.created_at) ?? "?") + "h"
        : "Endpoint listo · sin ventas todavía",
      lastRun: lastSale?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastSale?.created_at),
      totalExecutions: null,
    },
    {
      id: "welcome_alumno_followup",
      category: "alumno",
      label: "Cron welcome alumno followup 3 días",
      description: "Diario 10am UTC, busca alumnos que aceptaron invitación hace 3 días y aún no entraron a la App. Envía email recordatorio.",
      trigger: "pg_cron 0 10 * * * → GET /api/cron/welcome-alumno-followup",
      actions: [
        "SELECT student_invites accepted hace 3d sin actividad",
        "Envía email followup",
      ],
      relatedTables: ["student_invites", "email_logs"],
      status: welcomeFollowupStats.status,
      statusReason: welcomeFollowupStats.reason,
      lastRun: welcomeFollowupStats.lastRun,
      lastRunHoursAgo: hoursSince(welcomeFollowupStats.lastRun),
      totalExecutions: welcomeFollowupStats.runs,
    },
    {
      id: "resend_webhook_tracking",
      category: "email",
      label: "Resend webhook → tracking aperturas y clicks",
      description: "Cuando un destinatario abre o clica un email, Resend nos avisa via webhook. Actualizamos email_logs con timestamps.",
      trigger: "Webhook entrante: Resend → POST /api/email/webhooks/resend",
      actions: [
        "Verifica firma Svix",
        "UPDATE email_logs.opened_at / clicked_at por message_id",
      ],
      relatedTables: ["email_logs"],
      status: resendActive ? "live" : "idle",
      statusReason: resendActive
        ? `Resend activo · ${emailsCount} emails enviados · último: ${lastEmail?.template ?? "?"}`
        : "Resend configurado · sin emails todavía",
      lastRun: lastEmail?.sent_at ?? null,
      lastRunHoursAgo: hoursSince(lastEmail?.sent_at),
      totalExecutions: emailsCount ?? 0,
    },
    {
      id: "meta_capi_tracking",
      category: "ads",
      label: "Meta Pixel + CAPI → tracking conversiones",
      description: "Eventos de conversión (Lead, Purchase, etc) se envían a Meta vía Pixel (browser) + CAPI (server). Audit trail en meta_events_log.",
      trigger: "Múltiples endpoints internos disparan CAPI",
      actions: [
        "Lead clica CTA → fbq() + fetch /api/meta/capi",
        "Venta registrada → CAPI Purchase event",
        "Log de cada evento en meta_events_log con status",
      ],
      relatedTables: ["meta_events_log"],
      status: (metaCount ?? 0) > 0 ? "live" : "idle",
      statusReason: (metaCount ?? 0) > 0
        ? `CAPI activo · ${metaCount} eventos · último: ${lastMetaEvent?.status ?? "?"}`
        : "Pixel configurado · sin eventos todavía",
      lastRun: lastMetaEvent?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastMetaEvent?.created_at),
      totalExecutions: metaCount ?? 0,
    },
    {
      id: "manychat_webhook",
      category: "crm",
      label: "ManyChat → CRM (auto-crear lead + auto-stage)",
      description:
        "Flow IG: cuando alguien interactúa (comment/story reply/DM keyword), ManyChat dispara webhook al OS → crea contacto stage='lead'. Cuando el lead responde al welcome del bot → mueve a 'conversación'.",
      trigger: "Webhook entrante: ManyChat → POST /api/webhooks/manychat",
      actions: [
        "Verifica firma MANYCHAT_WEBHOOK_SECRET",
        "Routing por event_type (new_subscriber, user_replied_to_welcome, etc)",
        "Crea contacto / mueve stage / asigna tag origen / inserta journey event",
      ],
      relatedTables: ["contacts", "manychat_events", "manychat_subscribers_cache", "contact_journey_events", "contact_tags"],
      status: manychatActive ? "live" : "pending",
      statusReason: manychatActive
        ? `Webhook recibiendo · ${manychatCount} eventos · último ${lastManychatEvent?.event_type ?? "?"}`
        : "Endpoint listo · FALTA configurar External Request en panel ManyChat (tarea Marco/Adrián)",
      lastRun: lastManychatEvent?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastManychatEvent?.created_at),
      totalExecutions: manychatCount ?? 0,
    },
    {
      id: "test_personalidad_optin",
      category: "crm",
      label: "Funnel Test Personalidad → CRM + atribución + CAPI",
      description:
        "Lead hace opt-in en /test-personalidad → crea/actualiza contacto stage='lead', pipeline 'Test Personalidad', tags origen + fuente (afiliado), evento Meta CAPI, y si ya estaba avanzado avisa al equipo sin degradar su stage.",
      trigger: "POST /api/optin/test-personalidad (form público)",
      actions: [
        "Upsert contacto por email (stage='lead' si es nuevo, sin degradar si ya avanzado)",
        "Asigna pipeline 'Test Personalidad' + tag origen:test_personalidad",
        "Atribución: affiliate_slug = utm_source (first-touch) + tag fuente:<slug>",
        "Dispara Meta Pixel + CAPI (test_personalidad_lead + Lead)",
        "Contacto recurrente ya avanzado → notifica a super_admins (no degrada)",
        "Inserta contact_journey_event 'optin_test_personalidad'",
      ],
      relatedTables: ["contacts", "contact_tags", "tags", "contact_journey_events", "meta_events_log", "affiliates", "notifications"],
      status: (tpOptinCount ?? 0) > 0 ? "live" : "idle",
      statusReason:
        (tpOptinCount ?? 0) > 0
          ? `Recibiendo opt-ins · ${tpOptinCount} eventos`
          : "Funnel publicado · sin opt-ins reales todavía",
      lastRun: lastTpOptin?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastTpOptin?.created_at),
      totalExecutions: tpOptinCount ?? 0,
    },
    {
      id: "calendly_webhook",
      category: "calendario",
      label: "Calendly → CRM (agenda/cancela/no-show → pipeline)",
      description:
        "Webhook de Calendly (evento online-coffee de Adrián) con verificación HMAC. Registra en calendly_scheduled_events Y mueve la película del contacto en el pipeline: agenda → agendado (crea el contacto si agendó sin pasar por el test), cancela → seguimiento, no-show → no_show. Con guarda no-retroceso (nunca degrada a un alumno).",
      trigger: "Webhook entrante: Calendly → POST /api/webhooks/calendly",
      actions: [
        "Verifica firma HMAC (calendly_config.webhook_signing_key)",
        "Upsert calendly_scheduled_events (created/canceled/no_show)",
        "Matchea contacto por email → mueve stage con guarda no-retroceso",
        "invitee.created sin contacto → crea contacto stage=agendado (pipeline Test Personalidad)",
        "Inserta contact_journey_event (call_booked/call_cancelled/call_no_show)",
      ],
      relatedTables: ["calendly_scheduled_events", "calendly_config", "contacts", "contact_journey_events", "pipelines"],
      status: (calendlyCount ?? 0) > 0 ? "live" : "idle",
      statusReason: (calendlyCount ?? 0) > 0
        ? `Webhook activo (HMAC) · ${calendlyCount} reservas registradas · mueve pipeline`
        : "Webhook activo (HMAC) · sin reservas todavía",
      lastRun: lastCalendly?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastCalendly?.created_at),
      totalExecutions: calendlyCount ?? 0,
    },
  ]

  const summary = {
    total: automations.length,
    live: automations.filter((a) => a.status === "live").length,
    pending: automations.filter((a) => a.status === "pending").length,
    idle: automations.filter((a) => a.status === "idle").length,
    error: automations.filter((a) => a.status === "error").length,
  }

  return NextResponse.json({ automations, summary, generated_at: now.toISOString() })
}
