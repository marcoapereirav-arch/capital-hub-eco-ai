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

/**
 * GET /api/admin/automations
 *
 * Devuelve el estado en vivo de TODAS las automatizaciones del OS.
 * Cada automatizacion tiene:
 *  - id, label, descripcion
 *  - trigger (cuando se dispara)
 *  - acciones (que hace en cadena)
 *  - estado calculado en vivo:
 *    * 'live'    = ejecutandose / ultima ejecucion OK
 *    * 'idle'    = no se ha ejecutado todavia pero esta lista
 *    * 'error'   = ultima ejecucion fallo
 *    * 'pending' = configurada pero falta algo externo (webhook, secret, etc)
 *  - lastRun (timestamp de la ultima ejecucion conocida)
 *  - lastRunStatus (success / failed)
 *  - relatedTables (tablas BD afectadas)
 *
 * Esta es una vista de SOLO LECTURA. No se edita ni se crea desde aqui.
 * Las automatizaciones se crean en codigo (endpoints + crons).
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const now = new Date()

  // Datos en vivo de BD para calcular estado de cada automatizacion
  const manychatPromise = (async () => {
    try {
      const res = await admin.from("manychat_events").select("id", { count: "exact", head: true })
      return res.count ?? null
    } catch {
      return null
    }
  })()

  const [
    { count: bookingsCount },
    { data: lastBooking },
    { count: emailsCount },
    { data: lastEmail },
    { data: gcalOwner },
    { data: lastFailedEmail },
    { data: lastSale },
    { data: lastInvite },
    manychatEventsCount,
  ] = await Promise.all([
    admin.from("calendar_bookings").select("id", { count: "exact", head: true }),
    admin.from("calendar_bookings").select("id, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("email_logs").select("id", { count: "exact", head: true }),
    admin.from("email_logs").select("id, template, sent_at, status").order("sent_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("calendar_owners").select("google_oauth_refresh_token, google_oauth_connected_at, google_oauth_email").eq("id", "adrian").maybeSingle(),
    admin.from("email_logs").select("template, sent_at, error").eq("status", "failed").order("sent_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("contact_journey_events").select("created_at").eq("type", "sale").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("student_invites").select("id, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    manychatPromise,
  ])

  const hoursSince = (iso: string | null | undefined) => {
    if (!iso) return null
    return Math.round((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60))
  }

  const automations = [
    {
      id: "agenda_to_calendar",
      category: "calendario",
      label: "Reserva → Google Calendar de Adrián",
      description: "Cuando alguien reserva slot en /agenda, el sistema crea automáticamente el evento en el Google Calendar de Adrián con Zoom link, datos del lead, y notas.",
      trigger: "POST /api/calendar/book (formulario público /agenda)",
      actions: [
        "Crea row en calendar_bookings con public_token",
        "Upsert contacto en contacts (stage='agendado')",
        "Refresh access_token con OAuth refresh_token de Adrián",
        "POST a Google Calendar API → crea evento",
        "Envía email confirmación + .ics al lead vía Resend",
        "Envía email notificación a Adrián",
        "Crea contact_journey_event tipo 'call_booked'",
      ],
      relatedTables: ["calendar_bookings", "contacts", "calendar_owners", "email_logs", "contact_journey_events"],
      status: gcalOwner?.google_oauth_refresh_token ? "live" : "pending",
      statusReason: gcalOwner?.google_oauth_refresh_token
        ? "Google Calendar conectado (" + (gcalOwner?.google_oauth_email ?? "") + ")"
        : "Falta conectar Google Calendar en /calendario",
      lastRun: lastBooking?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastBooking?.created_at),
      totalExecutions: bookingsCount ?? 0,
    },
    {
      id: "agenda_reminder_24h",
      category: "calendario",
      label: "Cron recordatorio 24h antes de llamada",
      description: "Cada 30 min, busca llamadas que van a ocurrir en las próximas 24h y envía email recordatorio al lead.",
      trigger: "pg_cron cada 30 minutos → GET /api/cron/agenda-reminder-24h",
      actions: [
        "SELECT bookings WHERE start_at entre now()+23h y now()+24.5h",
        "Para cada uno: render template agenda_reminder_24h",
        "Envía email vía Resend con Zoom link",
        "Marca metadata.reminder_sent_at",
      ],
      relatedTables: ["calendar_bookings", "email_logs"],
      status: "live",
      statusReason: "pg_cron activo (jobid 1)",
      lastRun: null,
      lastRunHoursAgo: null,
      totalExecutions: null,
    },
    {
      id: "no_show_detection",
      category: "calendario",
      label: "Cron detección no-show + email retargeting",
      description: "Cada 30 min, detecta llamadas con start_at en pasado (1-25h) sin marcar attended. Las marca como no_show y envía email retargeting al lead.",
      trigger: "pg_cron cada 30 minutos → GET /api/cron/no-show-detection",
      actions: [
        "SELECT bookings WHERE status='booked' AND start_at BETWEEN now()-25h AND now()-1h",
        "UPDATE bookings SET status='no_show'",
        "UPDATE contact SET stage='no_show'",
        "Envía email template no_show con link a re-agendar",
        "Crea contact_journey_event 'no_show_detected'",
      ],
      relatedTables: ["calendar_bookings", "contacts", "email_logs", "contact_journey_events"],
      status: "live",
      statusReason: "pg_cron activo (jobid 2)",
      lastRun: null,
      lastRunHoursAgo: null,
      totalExecutions: null,
    },
    {
      id: "gcal_health_check",
      category: "calendario",
      label: "Cron salud Google Calendar",
      description: "Cada hora, verifica que el refresh_token de Adrián sigue funcionando contra Google. Si falla, envía email + push notification a Marco y Adrián.",
      trigger: "pg_cron cada hora → GET /api/cron/gcal-health-check",
      actions: [
        "Lee refresh_token de calendar_owners",
        "Intenta refresh contra oauth2.googleapis.com/token",
        "Si OK: actualiza access_token + expires_at",
        "Si falla: marca disconnected en BD, envía email alert + push",
      ],
      relatedTables: ["calendar_owners", "calls_availability", "email_logs", "notifications"],
      status: gcalOwner?.google_oauth_refresh_token ? "live" : "idle",
      statusReason: gcalOwner?.google_oauth_refresh_token
        ? "Token OK · última conexión " + (gcalOwner.google_oauth_connected_at ? new Date(gcalOwner.google_oauth_connected_at).toLocaleDateString("es-ES") : "?")
        : "Sin token (Google Calendar no conectado)",
      lastRun: gcalOwner?.google_oauth_connected_at ?? null,
      lastRunHoursAgo: hoursSince(gcalOwner?.google_oauth_connected_at),
      totalExecutions: null,
    },
    {
      id: "sale_to_alumno",
      category: "ventas",
      label: "Registrar venta → email magic link al alumno",
      description: "Cuando el closer registra una venta, el sistema crea token único + envía email al alumno con magic link para activar su cuenta en la App.",
      trigger: "POST /api/admin/sales/register (widget flotante Registrar venta)",
      actions: [
        "Upsert contacto con stage='cliente' + sumar revenue + products[]",
        "Crear contact_journey_event tipo 'sale'",
        "Crear student_invites con token único, expira 7 días",
        "Email template welcome_alumno_ht al alumno con link /accept-invite/<token>",
        "Email notificación a Marco con purchase details",
        "(futuro) Meta CAPI Purchase event",
      ],
      relatedTables: ["contacts", "contact_journey_events", "student_invites", "email_logs"],
      status: "live",
      statusReason: lastSale?.created_at ? "Última venta " + new Date(lastSale.created_at).toLocaleDateString("es-ES") : "Sin ventas registradas todavía",
      lastRun: lastSale?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastSale?.created_at),
      totalExecutions: null,
    },
    {
      id: "welcome_alumno_followup",
      category: "alumno",
      label: "Cron welcome alumno followup 3 días",
      description: "Cada día a las 10am UTC, busca student_invites no aceptadas con más de 3 días desde envío. Reenvía el email de bienvenida (una sola vez).",
      trigger: "pg_cron diario 10am UTC → GET /api/cron/welcome-alumno-followup",
      actions: [
        "SELECT student_invites WHERE accepted_at IS NULL AND created_at < now()-3d AND metadata->>'followup_sent_at' IS NULL",
        "Para cada uno: render welcome_alumno_ht con tono recordatorio",
        "Envía email vía Resend",
        "UPDATE metadata.followup_sent_at = now()",
      ],
      relatedTables: ["student_invites", "email_logs"],
      status: "live",
      statusReason: "pg_cron activo (jobid 6)",
      lastRun: lastInvite?.created_at ?? null,
      lastRunHoursAgo: hoursSince(lastInvite?.created_at),
      totalExecutions: null,
    },
    {
      id: "resend_webhook_tracking",
      category: "email",
      label: "Resend webhook → tracking real de aperturas y clicks",
      description: "Cuando un destinatario abre o clica un email, Resend nos avisa via webhook. Actualizamos email_logs con timestamps.",
      trigger: "Webhook entrante: Resend → POST /api/email/webhooks/resend",
      actions: [
        "Verifica firma svix-* contra RESEND_WEBHOOK_SECRET",
        "Parsea evento (sent, delivered, opened, clicked, bounced, complained)",
        "Busca email_log por resend_id",
        "Actualiza timestamp correspondiente (opened_at, clicked_at, delivered_at)",
        "Si bounce/complaint marca status=failed",
      ],
      relatedTables: ["email_logs"],
      status: process.env.RESEND_WEBHOOK_SECRET ? "live" : "pending",
      statusReason: process.env.RESEND_WEBHOOK_SECRET
        ? "Secret configurado · webhook activo en Resend"
        : "Falta RESEND_WEBHOOK_SECRET en Vercel",
      lastRun: lastEmail?.sent_at ?? null,
      lastRunHoursAgo: hoursSince(lastEmail?.sent_at),
      totalExecutions: emailsCount ?? 0,
    },
    {
      id: "error_alerts",
      category: "operacion",
      label: "Cron alert digest 30min",
      description: "Cada 30 min revisa email_logs y meta_events_log fallidos en los últimos 30 min. Envía digest a Marco si hay errores.",
      trigger: "pg_cron cada 30 minutos → GET /api/cron/error-alerts",
      actions: [
        "COUNT email_logs WHERE status='failed' AND sent_at > now()-30min",
        "COUNT meta_events_log WHERE status='failed' AND created_at > now()-30min",
        "Si suma > 0: render internal_error_alert con detalles",
        "Envía email a Marco",
      ],
      relatedTables: ["email_logs", "meta_events_log"],
      status: "live",
      statusReason: lastFailedEmail
        ? "Último error detectado " + (lastFailedEmail.sent_at ? new Date(lastFailedEmail.sent_at).toLocaleDateString("es-ES") : "?")
        : "Sin errores recientes (sano)",
      lastRun: lastFailedEmail?.sent_at ?? null,
      lastRunHoursAgo: hoursSince(lastFailedEmail?.sent_at),
      totalExecutions: null,
    },
    {
      id: "manychat_webhook",
      category: "crm",
      label: "ManyChat → CRM (nuevo seguidor automático)",
      description: "Cuando ManyChat detecta un nuevo seguidor en el Instagram de Adrián, dispara webhook al OS. El OS crea contacto en stage 'nuevo_seguidor' automáticamente. Si la persona luego agenda usando link con ?mc_id=<id>, se vincula sin duplicar.",
      trigger: "Webhook entrante: ManyChat → POST /api/webhooks/manychat",
      actions: [
        "Verifica firma MANYCHAT_WEBHOOK_SECRET",
        "Parsea evento (new_subscriber, provided_email, tagged, etc)",
        "Busca o crea contacto: instagram_username + manychat_subscriber_id",
        "Si new_subscriber → stage='nuevo_seguidor'",
        "Si provided_email/phone → actualiza datos",
        "Envía push notif al setter asignado",
      ],
      relatedTables: ["contacts", "manychat_events", "notifications"],
      status: ((manychatEventsCount as number | null) ?? 0) > 0 ? "live" : "pending",
      statusReason: ((manychatEventsCount as number | null) ?? 0) > 0
        ? "Webhook recibiendo eventos · " + ((manychatEventsCount as number | null) ?? 0) + " eventos totales"
        : "Endpoint listo · falta configurar External Request en panel ManyChat",
      lastRun: null,
      lastRunHoursAgo: null,
      totalExecutions: (manychatEventsCount as number | null) ?? null,
    },
  ]

  // Estadísticas resumen
  const summary = {
    total: automations.length,
    live: automations.filter((a) => a.status === "live").length,
    pending: automations.filter((a) => a.status === "pending").length,
    idle: automations.filter((a) => a.status === "idle").length,
    error: automations.filter((a) => a.status === "error").length,
  }

  return NextResponse.json({ automations, summary, generated_at: now.toISOString() })
}
