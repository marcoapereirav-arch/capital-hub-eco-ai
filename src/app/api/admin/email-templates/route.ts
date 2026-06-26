import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { render } from "@react-email/render"
import { WelcomeAlumnoHTEmail } from "@/lib/email/templates/welcome-alumno-ht"
import { TeamInviteEmail } from "@/lib/email/templates/team-invite"
import { InternalPurchaseAlert } from "@/lib/email/templates/internal-purchase-alert"
import { InternalBookingAlert } from "@/lib/email/templates/internal-booking-alert"
import { InternalErrorAlert } from "@/lib/email/templates/internal-error-alert"
import { InternalGCalAlert } from "@/lib/email/templates/internal-gcal-alert"
import { WelcomeTrialEmail } from "@/lib/email/templates/welcome-trial"
import { WelcomeAnualEmail } from "@/lib/email/templates/welcome-anual"
import { AgendaConfirmedEmail } from "@/lib/email/templates/agenda-confirmed"
import { AgendaReminder24hEmail } from "@/lib/email/templates/agenda-reminder-24h"
import { NoShowEmail } from "@/lib/email/templates/no-show"
import { PostCallFollowupEmail } from "@/lib/email/templates/post-call-followup"
import { TrialEnds48hEmail } from "@/lib/email/templates/trial-ends-48h"
import { PaymentFailedEmail } from "@/lib/email/templates/payment-failed"
import { BumpConfirmedEmail } from "@/lib/email/templates/bump-confirmed"
import { BetaRetargetingEmail } from "@/lib/email/templates/beta-retargeting"
import { PasswordChangedEmail } from "@/lib/email/templates/password-changed"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Catálogo de TODOS los templates editables desde /email-marketing → Plantillas.
 *
 * Cada entry usa SUS Props reales del componente React. Las {{variables}}
 * son lo que el sender sustituye al enviar. El render demo se hace con datos
 * ejemplo (string '{{x}}' o valor demo).
 */
type Template = {
  key: string
  label: string
  description: string
  /** Categoría legacy — mantenida por compat con stats existing */
  category: string
  /** Grupo visual editable. 7 grupos coherentes con el negocio. */
  group: "venta" | "pre_llamada" | "post_llamada" | "equipo_os" | "lifecycle_legacy" | "winback" | "alertas_sistema"
  /** Descripción CLARA del trigger: cuándo se dispara este email. */
  trigger: string
  /** Frecuencia esperada — para que Marco priorice qué editar */
  frequency: "alta" | "media" | "baja"
  variables: string[]
  defaultSubject: string
  renderDefault: () => Promise<string>
}

const TEMPLATES: Template[] = [
  {
    key: "welcome_alumno_ht",
    label: "Bienvenida alumno (post venta)",
    description: "El email que recibe el alumno tras cerrar la venta. Incluye el magic link de acceso a la App.",
    category: "lifecycle",
    group: "venta",
    trigger: "Cada vez que el closer registra una venta en el OS (botón verde 'Registrar venta').",
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
    key: "team_invite",
    label: "Invitación equipo (OS)",
    description: "Email al nuevo miembro del equipo (super_admin/closer/setter/marketing/formador) para configurar su contraseña.",
    category: "auth",
    group: "equipo_os",
    trigger: "Cuando un super_admin invita a alguien nuevo desde /team con el botón 'Invitar miembro'.",
    frequency: "baja",
    variables: ["fullName", "invitedByName", "role", "acceptUrl"],
    defaultSubject: "{{invitedByName}} te invita al OS de Capital Hub",
    renderDefault: () => render(TeamInviteEmail({
      fullName: "{{fullName}}",
      invitedByName: "{{invitedByName}}",
      role: "{{role}}",
      acceptUrl: "{{acceptUrl}}",
      expiresIn: "7 días",
    })),
  },
  {
    key: "internal_purchase_alert_marco",
    label: "Notif venta interna (Marco)",
    description: "Notif a Marco cada vez que entra una venta en el OS.",
    category: "internal",
    group: "venta",
    trigger: "Cada vez que se registra una venta — Marco recibe email simultáneo a la bienvenida del alumno.",
    frequency: "alta",
    variables: ["fullName", "email", "amount", "currency", "productName", "eventLabel"],
    defaultSubject: "{{amount}}€ · {{eventLabel}} — {{fullName}}",
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
    label: "Notif venta interna (Adrián)",
    description: "Misma notif a Adrián. Se envía a la vez para ambos founders.",
    category: "internal",
    group: "venta",
    trigger: "Igual que la de Marco — Adrián recibe email simultáneo. Visibilidad dual founders.",
    frequency: "alta",
    variables: ["fullName", "email", "amount", "currency", "productName", "eventLabel"],
    defaultSubject: "{{amount}}€ · {{eventLabel}} — {{fullName}}",
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
    label: "Notif booking interno (Adrián)",
    description: "Notif a Adrián cada vez que se reserva llamada en /agenda.",
    category: "internal",
    group: "pre_llamada",
    trigger: "Cuando un lead reserva una llamada en /agenda (calendar propio) o en Calendly. Avisa al host + super_admins.",
    frequency: "alta",
    variables: ["fullName", "email", "phone", "slotStartIso", "notes"],
    defaultSubject: "Nueva llamada agendada — {{fullName}}",
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
    description: "Confirmación al lead que reservó llamada — incluye datos cita + cancel/reschedule.",
    category: "calendar",
    group: "pre_llamada",
    trigger: "Inmediatamente después de que el lead pulsa 'Reservar' en /agenda (calendar propio).",
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
    description: "Cron envía 24h antes de la llamada agendada.",
    category: "calendar",
    group: "pre_llamada",
    trigger: "Cron horario que detecta reservas que empiezan en las próximas 24h y aún no recibieron el reminder.",
    frequency: "alta",
    variables: ["fullName", "slotStartIso", "meetingUrl"],
    defaultSubject: "Mañana hablamos",
    renderDefault: () => render(AgendaReminder24hEmail({
      fullName: "{{fullName}}",
      slotStartIso: new Date().toISOString(),
      meetingUrl: "{{meetingUrl}}",
    })),
  },
  {
    key: "no_show",
    label: "No show (no apareció)",
    description: "Recovery cuando el lead no apareció a la llamada.",
    category: "calendar",
    group: "post_llamada",
    trigger: "Cuando el host marca el evento como 'no_show' (en Calendly o calendar propio). Webhook invitee_no_show.created.",
    frequency: "media",
    variables: ["fullName", "agendaUrl"],
    defaultSubject: "Te esperamos — reagenda en 1 click",
    renderDefault: () => render(NoShowEmail({
      fullName: "{{fullName}}",
      agendaUrl: "{{agendaUrl}}",
    })),
  },
  {
    key: "post_call_followup",
    label: "Post-call followup",
    description: "Resumen + push upsell tras marcar la llamada como attended.",
    category: "calendar",
    group: "post_llamada",
    trigger: "Cuando el host marca la llamada como 'attended' (lead vino al Zoom). Manual desde el CRM.",
    frequency: "media",
    variables: ["fullName", "upgradeUrl", "appUrl"],
    defaultSubject: "Resumen de nuestra llamada",
    renderDefault: () => render(PostCallFollowupEmail({
      fullName: "{{fullName}}",
      upgradeUrl: "{{upgradeUrl}}",
      appUrl: "{{appUrl}}",
    })),
  },
  {
    key: "welcome_trial",
    label: "Welcome trial (MIFGE legacy)",
    description: "Empieza trial 14d. Push a agendar llamada de diagnóstico.",
    category: "lifecycle",
    group: "lifecycle_legacy",
    trigger: "MIFGE legacy: cuando un cliente empieza su prueba gratuita de 14 días. No se usa en flow Capital Hub actual.",
    frequency: "baja",
    variables: ["fullName", "appUrl", "agendaUrl"],
    defaultSubject: "Bienvenido — tu trial empieza ahora",
    renderDefault: () => render(WelcomeTrialEmail({
      fullName: "{{fullName}}",
      appUrl: "{{appUrl}}",
      agendaUrl: "{{agendaUrl}}",
    })),
  },
  {
    key: "welcome_anual",
    label: "Welcome anual (MIFGE legacy)",
    description: "Convirtió a anual. Push a agendar sesión 1:1 de onboarding.",
    category: "lifecycle",
    group: "lifecycle_legacy",
    trigger: "MIFGE legacy: cuando un cliente paga el plan anual. No se usa en flow Capital Hub actual.",
    frequency: "baja",
    variables: ["fullName", "appUrl", "agendaUrl"],
    defaultSubject: "Bienvenido al plan anual",
    renderDefault: () => render(WelcomeAnualEmail({
      fullName: "{{fullName}}",
      appUrl: "{{appUrl}}",
      agendaUrl: "{{agendaUrl}}",
    })),
  },
  {
    key: "trial_ends_48h",
    label: "Trial ends en 48h (MIFGE legacy)",
    description: "Cron 48h antes del cobro recurrente. Recordatorio + push a quedarse.",
    category: "lifecycle",
    group: "lifecycle_legacy",
    trigger: "MIFGE legacy: cron 48h antes del cobro recurrente. No se usa en flow Capital Hub actual.",
    frequency: "baja",
    variables: ["fullName", "cancelUrl", "appUrl"],
    defaultSubject: "Tu prueba termina en 48h",
    renderDefault: () => render(TrialEnds48hEmail({
      fullName: "{{fullName}}",
      cancelUrl: "{{cancelUrl}}",
      appUrl: "{{appUrl}}",
    })),
  },
  {
    key: "payment_failed",
    label: "Cobro fallido (MIFGE legacy)",
    description: "Recovery cuando el cobro recurrente falla. 3 días para actualizar tarjeta.",
    category: "lifecycle",
    group: "lifecycle_legacy",
    trigger: "MIFGE legacy: webhook de Stripe payment_failed. No se usa en flow Capital Hub actual.",
    frequency: "baja",
    variables: ["fullName", "updateCardUrl"],
    defaultSubject: "No pudimos cobrarte — actualiza tu método",
    renderDefault: () => render(PaymentFailedEmail({
      fullName: "{{fullName}}",
      updateCardUrl: "{{updateCardUrl}}",
    })),
  },
  {
    key: "bump_confirmed",
    label: "Order bump confirmado",
    description: "Confirmación order bump 19€ (Bonus Bundle Express).",
    category: "transactional",
    group: "venta",
    trigger: "Cuando el cliente acepta el order bump en el checkout (compra accesoria 19€).",
    frequency: "media",
    variables: ["fullName", "appUrl"],
    defaultSubject: "Bonus activado · acceso inmediato",
    renderDefault: () => render(BumpConfirmedEmail({
      fullName: "{{fullName}}",
      appUrl: "{{appUrl}}",
    })),
  },
  {
    key: "beta_retargeting_trial",
    label: "Win-back (canceló trial)",
    description: "Beta retargeting a quien canceló desde trial.",
    category: "retargeting",
    group: "winback",
    trigger: "Cron semanal: detecta cancelaciones desde trial y manda este email para reactivar.",
    frequency: "baja",
    variables: ["fullName", "rejoinUrl"],
    defaultSubject: "¿Te interesa probar de nuevo?",
    renderDefault: () => render(BetaRetargetingEmail({
      fullName: "{{fullName}}",
      rejoinUrl: "{{rejoinUrl}}",
      cancelOrigin: "trial",
    })),
  },
  {
    key: "beta_retargeting_monthly",
    label: "Win-back (canceló mensual)",
    description: "Beta retargeting a quien canceló plan mensual.",
    category: "retargeting",
    group: "winback",
    trigger: "Cron semanal: detecta cancelaciones desde plan mensual y manda este email para reactivar.",
    frequency: "baja",
    variables: ["fullName", "rejoinUrl"],
    defaultSubject: "Te echamos de menos",
    renderDefault: () => render(BetaRetargetingEmail({
      fullName: "{{fullName}}",
      rejoinUrl: "{{rejoinUrl}}",
      cancelOrigin: "monthly",
    })),
  },
  {
    key: "beta_retargeting_annual",
    label: "Win-back (canceló anual)",
    description: "Beta retargeting a quien canceló plan anual.",
    category: "retargeting",
    group: "winback",
    trigger: "Cron semanal: detecta cancelaciones desde plan anual y manda este email para reactivar.",
    frequency: "baja",
    variables: ["fullName", "rejoinUrl"],
    defaultSubject: "Te echamos de menos",
    renderDefault: () => render(BetaRetargetingEmail({
      fullName: "{{fullName}}",
      rejoinUrl: "{{rejoinUrl}}",
      cancelOrigin: "annual",
    })),
  },
  {
    key: "internal_error_alert",
    label: "Sistema: Alerta de errores (Marco)",
    description: "Digest cada 30 min de fallos email/CAPI.",
    category: "internal",
    group: "alertas_sistema",
    trigger: "Cron cada 30 min: si hay fallos de envío email o CAPI agrega y manda este resumen a Marco.",
    frequency: "baja",
    variables: ["windowMinutes", "emailFails", "capiFails"],
    defaultSubject: "⚠️ Fallos en MIFGE — últimos {{windowMinutes}}min",
    renderDefault: () => render(InternalErrorAlert({
      windowMinutes: 30,
      emailFails: 0,
      capiFails: 0,
      items: [],
    })),
  },
  {
    key: "internal_gcal_alert_marco",
    label: "Sistema: Google Calendar caído (Marco)",
    description: "Aviso a Marco cuando Google Calendar se desconecta.",
    category: "internal",
    group: "alertas_sistema",
    trigger: "Cron health-check detecta token Google Calendar inválido o desconectado. Manda alerta inmediata a Marco.",
    frequency: "baja",
    variables: ["reason"],
    defaultSubject: "⚠️ Google Calendar desconectado del OS",
    renderDefault: () => render(InternalGCalAlert({
      reason: "{{reason}}",
      detail: "",
      lastConnectedAt: null,
      ownerEmail: null,
    })),
  },
  {
    key: "internal_gcal_alert_adrian",
    label: "Sistema: Google Calendar caído (Adrián)",
    description: "Aviso a Adrián cuando su Calendar se desconecta.",
    category: "internal",
    group: "alertas_sistema",
    trigger: "Cron health-check detecta token Google Calendar inválido de Adrián. Manda alerta inmediata a Adrián.",
    frequency: "baja",
    variables: ["reason"],
    defaultSubject: "⚠️ Tu Google Calendar se desconectó del OS",
    renderDefault: () => render(InternalGCalAlert({
      reason: "{{reason}}",
      detail: "",
      lastConnectedAt: null,
      ownerEmail: null,
    })),
  },
  {
    key: "password_changed",
    label: "Contraseña cambiada (notif seguridad)",
    description: "Aviso al usuario tras cambiar su contraseña.",
    category: "auth",
    group: "equipo_os",
    trigger: "Cuando un miembro del equipo cambia su contraseña en /settings. Notif de seguridad.",
    frequency: "baja",
    variables: ["fullName", "changedAtFormatted"],
    defaultSubject: "Tu contraseña ha cambiado",
    renderDefault: () => render(PasswordChangedEmail({
      fullName: "{{fullName}}",
      changedAtFormatted: "{{changedAtFormatted}}",
    })),
  },
]

/** Metadata visual de cada grupo — usado por el editor para agrupar visualmente */
export const GROUP_META: Record<Template["group"], { label: string; icon: string; color: string; description: string; order: number }> = {
  venta: { label: "🟢 Venta cerrada", icon: "🟢", color: "border-green-500/40 text-green-400 bg-green-500/[0.04]", description: "Lo que dispara cada venta nueva — copy crítico", order: 1 },
  pre_llamada: { label: "🟡 Pre-llamada (reservas)", icon: "🟡", color: "border-amber-500/40 text-amber-400 bg-amber-500/[0.04]", description: "Cuando un lead agenda llamada (Calendly o calendar propio)", order: 2 },
  post_llamada: { label: "🔵 Post-llamada", icon: "🔵", color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/[0.04]", description: "Recovery tras la llamada (no show / attended)", order: 3 },
  equipo_os: { label: "👥 Equipo OS", icon: "👥", color: "border-purple-500/40 text-purple-400 bg-purple-500/[0.04]", description: "Auth interna del equipo (invites + password)", order: 4 },
  winback: { label: "🔄 Win-back", icon: "🔄", color: "border-pink-500/40 text-pink-400 bg-pink-500/[0.04]", description: "Recovery de cancelaciones — reactivar clientes", order: 5 },
  lifecycle_legacy: { label: "📚 Lifecycle MIFGE (legacy)", icon: "📚", color: "border-zinc-500/40 text-zinc-400 bg-zinc-500/[0.04]", description: "Productos viejos (trial / mensual / anual) — baja prioridad", order: 6 },
  alertas_sistema: { label: "🛡 Alertas Sistema", icon: "🛡", color: "border-red-500/40 text-red-400 bg-red-500/[0.04]", description: "Notif técnicas internas (errores, Gcal caído)", order: 7 },
}

/**
 * GET /api/admin/email-templates — lista templates editables con su contenido actual.
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: overrides } = await admin
    .from("email_template_overrides")
    .select("template_key, subject, html_body, updated_at")

  const overrideMap = new Map((overrides ?? []).map((o) => [o.template_key as string, o]))

  const result = await Promise.all(TEMPLATES.map(async (t) => {
    const override = overrideMap.get(t.key)
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
      updatedAt: override?.updated_at ?? null,
    }
  }))

  return NextResponse.json({ templates: result })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    template_key?: string
    subject?: string
    html_body?: string
  }
  if (!body.template_key || !body.subject || !body.html_body) {
    return NextResponse.json({ error: "template_key, subject y html_body son obligatorios" }, { status: 400 })
  }
  if (!TEMPLATES.find((t) => t.key === body.template_key)) {
    return NextResponse.json({ error: "Template no reconocido" }, { status: 400 })
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from("email_template_overrides")
    .upsert({
      template_key: body.template_key,
      subject: body.subject,
      html_body: body.html_body,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "template_key" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

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
