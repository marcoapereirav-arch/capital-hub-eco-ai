import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { render } from "@react-email/render"
import { WelcomeAlumnoHTEmail } from "@/lib/email/templates/welcome-alumno-ht"
import { TeamInviteEmail } from "@/lib/email/templates/team-invite"
import { InternalPurchaseAlert } from "@/lib/email/templates/internal-purchase-alert"
import { InternalBookingAlert } from "@/lib/email/templates/internal-booking-alert"
import { InternalGCalAlert } from "@/lib/email/templates/internal-gcal-alert"
import { AgendaConfirmedEmail } from "@/lib/email/templates/agenda-confirmed"
import { AgendaReminder24hEmail } from "@/lib/email/templates/agenda-reminder-24h"
import { AgendaReminder2hEmail } from "@/lib/email/templates/agenda-reminder-2h"
import { AgendaReminder30minEmail } from "@/lib/email/templates/agenda-reminder-30min"
import { NoShowEmail } from "@/lib/email/templates/no-show"
import { PasswordChangedEmail } from "@/lib/email/templates/password-changed"
import { WebinarOptinEmail } from "@/lib/email/templates/webinar-optin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Catalogo activo de plantillas editables.
 *
 * Marco 2026-06-20: FUERA bump_confirmed, post_call_followup, beta_retargeting_*,
 * welcome_trial, welcome_anual, trial_ends_48h, payment_failed, internal_error_alert.
 * Total: 11 plantillas activas (de las 21 que habia antes).
 */
type Template = {
  key: string
  label: string
  description: string
  category: string
  group: "captacion" | "venta" | "pre_llamada" | "post_llamada" | "equipo_os" | "alertas_sistema"
  trigger: string
  frequency: "alta" | "media" | "baja"
  variables: string[]
  defaultSubject: string
  renderDefault: () => Promise<string>
}

const TEMPLATES: Template[] = [
  {
    key: "optin_webinar",
    label: "Opt-in Webinar (link WhatsApp)",
    description: "Email que recibe el lead al reservar plaza en /webinar. Incluye el botón al grupo de WhatsApp donde se suelta el link del Zoom.",
    category: "lifecycle",
    group: "captacion",
    trigger: "Cada vez que alguien reserva plaza en la landing del webinar (/webinar). Solo se envía si el grupo de WhatsApp está configurado en /webs.",
    frequency: "alta",
    variables: ["firstName", "whatsappUrl", "dateLabel"],
    defaultSubject: "Tu plaza en el webinar está reservada — entra al grupo",
    renderDefault: () => render(WebinarOptinEmail({
      firstName: "{{firstName}}",
      whatsappUrl: "{{whatsappUrl}}",
      dateLabel: "{{dateLabel}}",
    })),
  },
  {
    key: "welcome_alumno_ht",
    label: "Bienvenida alumno (post venta)",
    description: "Email que recibe el alumno tras cerrar la venta. Incluye magic link de acceso a la App.",
    category: "lifecycle",
    group: "venta",
    trigger: "Cada vez que el closer registra una venta en el OS (boton verde 'Registrar venta').",
    frequency: "alta",
    variables: ["firstName", "fullName", "product", "inviteUrl", "closerName"],
    defaultSubject: "{{firstName}}, entras hoy a Capital Hub",
    renderDefault: () => render(WelcomeAlumnoHTEmail({
      fullName: "{{fullName}}",
      product: "{{product}}",
      inviteUrl: "{{inviteUrl}}",
      closerName: "{{closerName}}",
    })),
  },
  {
    key: "internal_purchase_alert_marco",
    label: "Notif venta interna (Marco)",
    description: "Notif a Marco cada vez que entra una venta en el OS.",
    category: "internal",
    group: "venta",
    trigger: "Cada vez que se registra una venta. Email simultaneo al de bienvenida del alumno.",
    frequency: "alta",
    variables: ["fullName", "email", "amount", "currency", "productName", "eventLabel"],
    defaultSubject: "{{amount}}EUR. {{eventLabel}}: {{fullName}}",
    renderDefault: () => render(InternalPurchaseAlert({
      eventLabel: "{{eventLabel}}",
      fullName: "{{fullName}}",
      email: "{{email}}",
      amount: 0,
      currency: "{{currency}}",
      productName: "{{productName}}",
    })),
  },
  {
    key: "internal_purchase_alert_adrian",
    label: "Notif venta interna (Adrian)",
    description: "Misma notif a Adrian. Se envia a la vez para ambos founders.",
    category: "internal",
    group: "venta",
    trigger: "Igual que la de Marco. Adrian recibe email simultaneo. Visibilidad dual founders.",
    frequency: "alta",
    variables: ["fullName", "email", "amount", "currency", "productName", "eventLabel"],
    defaultSubject: "{{amount}}EUR. {{eventLabel}}: {{fullName}}",
    renderDefault: () => render(InternalPurchaseAlert({
      eventLabel: "{{eventLabel}}",
      fullName: "{{fullName}}",
      email: "{{email}}",
      amount: 0,
      currency: "{{currency}}",
      productName: "{{productName}}",
    })),
  },
  {
    key: "internal_booking_alert",
    label: "Notif booking interno (Adrian)",
    description: "Notif a Adrian cada vez que se reserva llamada (Calendly o calendar propio).",
    category: "internal",
    group: "pre_llamada",
    trigger: "Cuando un lead reserva llamada (Calendly o /agenda). Avisa al host + super_admins.",
    frequency: "alta",
    variables: ["fullName", "email", "phone", "slotStartIso", "notes"],
    defaultSubject: "Nueva llamada agendada: {{fullName}}",
    renderDefault: () => render(InternalBookingAlert({
      fullName: "{{fullName}}",
      email: "{{email}}",
      phone: "{{phone}}",
      slotStartIso: new Date().toISOString(),
      notes: "{{notes}}",
    })),
  },
  {
    key: "agenda_confirmed",
    label: "Reserva confirmada (lead)",
    description: "Confirmacion al lead que reservo llamada. Incluye datos cita + cancel/reschedule.",
    category: "calendar",
    group: "pre_llamada",
    trigger: "Inmediatamente despues de que el lead pulsa 'Reservar' en /agenda o agenda en Calendly.",
    frequency: "alta",
    variables: ["fullName", "slotStartIso", "meetingUrl", "cancelUrl", "rescheduleUrl"],
    defaultSubject: "Confirmada tu llamada",
    renderDefault: () => render(AgendaConfirmedEmail({
      fullName: "{{fullName}}",
      slotStartIso: new Date().toISOString(),
      meetingUrl: "{{meetingUrl}}",
      cancelUrl: "{{cancelUrl}}",
      rescheduleUrl: "{{rescheduleUrl}}",
    })),
  },
  {
    key: "agenda_reminder_24h",
    label: "Recordatorio 24h antes de llamada",
    description: "Cron envia 24h antes de la llamada agendada.",
    category: "calendar",
    group: "pre_llamada",
    trigger: "Cron horario detecta reservas que empiezan en proximas 24h sin reminder enviado.",
    frequency: "alta",
    variables: ["fullName", "slotStartIso", "meetingUrl"],
    defaultSubject: "Manana hablamos",
    renderDefault: () => render(AgendaReminder24hEmail({
      fullName: "{{fullName}}",
      slotStartIso: new Date().toISOString(),
      meetingUrl: "{{meetingUrl}}",
    })),
  },
  {
    key: "agenda_reminder_2h",
    label: "Recordatorio 2h antes de llamada",
    description: "Cron envia 2h antes de la llamada agendada.",
    category: "calendar",
    group: "pre_llamada",
    trigger: "Cron horario detecta reservas que empiezan en proximas 2h sin reminder 2h enviado.",
    frequency: "alta",
    variables: ["fullName", "slotStartIso", "meetingUrl", "durationMinutes"],
    defaultSubject: "En 2 horas hablamos",
    renderDefault: () => render(AgendaReminder2hEmail({
      fullName: "{{fullName}}",
      slotStartIso: new Date().toISOString(),
      meetingUrl: "{{meetingUrl}}",
    })),
  },
  {
    key: "agenda_reminder_30min",
    label: "Recordatorio 30min antes de llamada",
    description: "Cron envia 30min antes de la llamada agendada.",
    category: "calendar",
    group: "pre_llamada",
    trigger: "Cron cada 5 min detecta reservas que empiezan en proximos 30min sin reminder 30min enviado.",
    frequency: "alta",
    variables: ["fullName", "slotStartIso", "meetingUrl"],
    defaultSubject: "Empezamos en 30 minutos",
    renderDefault: () => render(AgendaReminder30minEmail({
      fullName: "{{fullName}}",
      slotStartIso: new Date().toISOString(),
      meetingUrl: "{{meetingUrl}}",
    })),
  },
  {
    key: "no_show",
    label: "No show (no aparecio)",
    description: "Recovery cuando el lead no aparecio a la llamada. Le ofrece reagendar.",
    category: "calendar",
    group: "post_llamada",
    trigger: "Cuando el host marca el evento como no_show (en Calendly o /agenda). Lead recibe link para reagendar en 1 click.",
    frequency: "media",
    variables: ["fullName", "agendaUrl"],
    defaultSubject: "Te esperabamos. Reagenda en 1 click",
    renderDefault: () => render(NoShowEmail({
      fullName: "{{fullName}}",
      agendaUrl: "{{agendaUrl}}",
    })),
  },
  {
    key: "team_invite",
    label: "Invitacion equipo (OS)",
    description: "Email al nuevo miembro del equipo para configurar su contrasena.",
    category: "auth",
    group: "equipo_os",
    trigger: "Cuando un super_admin invita a alguien nuevo desde /team con el boton 'Invitar miembro'.",
    frequency: "baja",
    variables: ["fullName", "invitedByName", "role", "acceptUrl"],
    defaultSubject: "{{invitedByName}} te invita al OS de Capital Hub",
    renderDefault: () => render(TeamInviteEmail({
      fullName: "{{fullName}}",
      invitedByName: "{{invitedByName}}",
      role: "{{role}}",
      acceptUrl: "{{acceptUrl}}",
      expiresIn: "7 dias",
    })),
  },
  {
    key: "password_changed",
    label: "Contrasena cambiada (notif seguridad)",
    description: "Aviso al usuario tras cambiar su contrasena.",
    category: "auth",
    group: "equipo_os",
    trigger: "Cuando un miembro del equipo cambia su contrasena en /settings. Notif de seguridad.",
    frequency: "baja",
    variables: ["fullName", "changedAtFormatted"],
    defaultSubject: "Tu contrasena ha cambiado",
    renderDefault: () => render(PasswordChangedEmail({
      fullName: "{{fullName}}",
      changedAtFormatted: "{{changedAtFormatted}}",
    })),
  },
  {
    key: "internal_gcal_alert_marco",
    label: "Sistema: Google Calendar caido (Marco)",
    description: "Aviso a Marco cuando Google Calendar se desconecta.",
    category: "internal",
    group: "alertas_sistema",
    trigger: "Cron health-check detecta token Google Calendar invalido o desconectado. Manda alerta inmediata a Marco.",
    frequency: "baja",
    variables: ["reason"],
    defaultSubject: "Google Calendar desconectado del OS",
    renderDefault: () => render(InternalGCalAlert({
      reason: "{{reason}}",
      detail: "",
      lastConnectedAt: null,
      ownerEmail: null,
    })),
  },
  {
    key: "internal_gcal_alert_adrian",
    label: "Sistema: Google Calendar caido (Adrian)",
    description: "Aviso a Adrian cuando su Calendar se desconecta.",
    category: "internal",
    group: "alertas_sistema",
    trigger: "Cron health-check detecta token Google Calendar invalido de Adrian. Manda alerta inmediata a Adrian.",
    frequency: "baja",
    variables: ["reason"],
    defaultSubject: "Tu Google Calendar se desconecto del OS",
    renderDefault: () => render(InternalGCalAlert({
      reason: "{{reason}}",
      detail: "",
      lastConnectedAt: null,
      ownerEmail: null,
    })),
  },
]

export const GROUP_META: Record<Template["group"], { label: string; icon: string; color: string; description: string; order: number }> = {
  captacion: { label: "Captación (funnels)", icon: "🎣", color: "border-green-500/40 text-green-400 bg-green-500/[0.04]", description: "Emails de los funnels de captación (opt-in webinar, etc.).", order: 0 },
  venta: { label: "Venta cerrada", icon: "💰", color: "border-green-500/40 text-green-400 bg-green-500/[0.04]", description: "Lo que dispara cada venta nueva. Copy critico.", order: 1 },
  pre_llamada: { label: "Pre-llamada (reservas)", icon: "📅", color: "border-amber-500/40 text-amber-400 bg-amber-500/[0.04]", description: "Cuando un lead agenda llamada (Calendly o calendar propio).", order: 2 },
  post_llamada: { label: "Post-llamada", icon: "📞", color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/[0.04]", description: "Recovery tras la llamada (no show).", order: 3 },
  equipo_os: { label: "Equipo OS", icon: "👥", color: "border-purple-500/40 text-purple-400 bg-purple-500/[0.04]", description: "Auth interna del equipo (invites + password).", order: 4 },
  alertas_sistema: { label: "Alertas Sistema", icon: "🛡", color: "border-red-500/40 text-red-400 bg-red-500/[0.04]", description: "Notif tecnicas internas (errores, Gcal caido).", order: 5 },
}

/**
 * GET /api/admin/email-templates
 * Devuelve las plantillas activas con su override actual.
 * Marca cada plantilla con `paused: true/false` desde la BD para que el editor
 * permita pausar el envio sin eliminar el override.
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: overrides } = await admin
    .from("email_template_overrides")
    .select("template_key, subject, html_body, updated_at, paused")

  const overrideMap = new Map((overrides ?? []).map((o) => [o.template_key as string, o]))

  const result = await Promise.all(TEMPLATES.map(async (t) => {
    const override = overrideMap.get(t.key) as { subject: string; html_body: string; updated_at: string; paused?: boolean } | undefined
    const defaultHtml = await t.renderDefault()
    return {
      key: t.key,
      label: t.label,
      description: t.description,
      category: t.category,
      group: t.group,
      group_label: GROUP_META[t.group].label,
      group_color: GROUP_META[t.group].color,
      group_order: GROUP_META[t.group].order,
      trigger: t.trigger,
      frequency: t.frequency,
      variables: t.variables,
      defaultSubject: t.defaultSubject,
      defaultHtml,
      currentSubject: override?.subject ?? t.defaultSubject,
      currentHtml: override?.html_body ?? defaultHtml,
      hasOverride: !!override,
      paused: override?.paused ?? false,
      updatedAt: override?.updated_at ?? null,
    }
  }))

  return NextResponse.json({ templates: result })
}

/**
 * PUT body: { template_key, subject?, html_body?, paused? }
 * Permite guardar override de texto y/o cambiar el flag paused independientemente.
 */
export async function PUT(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    template_key?: string
    subject?: string
    html_body?: string
    paused?: boolean
  }
  if (!body.template_key) return NextResponse.json({ error: "template_key obligatorio" }, { status: 400 })
  if (!TEMPLATES.find((t) => t.key === body.template_key)) {
    return NextResponse.json({ error: "Template no reconocido" }, { status: 400 })
  }

  const admin = getAdminClient()
  // Upsert: si solo viene paused, mantenemos el texto que ya hubiera; si solo viene texto, mantiene paused.
  const { data: current } = await admin
    .from("email_template_overrides")
    .select("subject, html_body, paused")
    .eq("template_key", body.template_key)
    .maybeSingle()

  const subject = body.subject ?? current?.subject ?? ""
  const html_body = body.html_body ?? current?.html_body ?? ""
  const paused = body.paused !== undefined ? body.paused : (current?.paused ?? false)

  // Si esta el flag paused activo y NO hay texto custom, igual creamos la row con default vacios.
  const { error } = await admin
    .from("email_template_overrides")
    .upsert({
      template_key: body.template_key,
      subject,
      html_body,
      paused,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "template_key" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/admin/email-templates?key=...
 * Borra el override completo. La plantilla vuelve al default del codigo (siempre activa).
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const key = new URL(req.url).searchParams.get("key")
  if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 })

  const admin = getAdminClient()
  const { error } = await admin
    .from("email_template_overrides")
    .delete()
    .eq("template_key", key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
