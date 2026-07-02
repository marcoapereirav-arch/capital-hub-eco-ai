import "server-only"
import { render } from "@react-email/render"
import { sendEmail } from "./send-email"
import { APP_URL } from "./resend-client"
import { WelcomeTrialEmail } from "./templates/welcome-trial"
import { AgendaConfirmedEmail } from "./templates/agenda-confirmed"
import { AgendaReminder24hEmail } from "./templates/agenda-reminder-24h"
import { AgendaReminder2hEmail } from "./templates/agenda-reminder-2h"
import { AgendaReminder30minEmail } from "./templates/agenda-reminder-30min"
import { TrialEnds48hEmail } from "./templates/trial-ends-48h"
import { PaymentFailedEmail } from "./templates/payment-failed"
import { InternalBookingAlert } from "./templates/internal-booking-alert"
import { InternalPurchaseAlert } from "./templates/internal-purchase-alert"
import { WelcomeAnualEmail } from "./templates/welcome-anual"
import { BumpConfirmedEmail } from "./templates/bump-confirmed"
import { NoShowEmail } from "./templates/no-show"
import { PostCallFollowupEmail } from "./templates/post-call-followup"
import { BetaRetargetingEmail } from "./templates/beta-retargeting"
import { InternalErrorAlert, type ErrorAlertItem } from "./templates/internal-error-alert"
import { WelcomeAlumnoHTEmail } from "./templates/welcome-alumno-ht"
import { TeamInviteEmail } from "./templates/team-invite"
import { InternalGCalAlert } from "./templates/internal-gcal-alert"
import { PasswordChangedEmail } from "./templates/password-changed"

const ADRIAN_EMAIL = process.env.INTERNAL_NOTIF_EMAIL_ADRIAN ?? "adrianvillanuevarios@gmail.com"
const MARCO_EMAIL = process.env.INTERNAL_NOTIF_EMAIL_MARCO ?? "marcoapereirav@gmail.com"

const AGENDA_URL = `${APP_URL}/mifge/agenda`
const CANCEL_URL = `${process.env.APP_CAPITAL_HUB_URL ?? "https://app.capitalhubapp.com"}/billing/cancel`
const APP_LOGIN_URL = process.env.APP_CAPITAL_HUB_URL ?? "https://app.capitalhubapp.com"

export async function sendWelcomeTrial(input: { fullName: string; email: string; leadId?: string }) {
  const html = await render(WelcomeTrialEmail({
    fullName: input.fullName,
    appUrl: APP_LOGIN_URL,
    agendaUrl: AGENDA_URL,
  }))
  return sendEmail({
    template: "welcome_trial",
    to: input.email,
    toName: input.fullName,
    subject: "Tu prueba gratuita en Capital Hub está activa",
    html,
    leadId: input.leadId,
  })
}

export async function sendAgendaConfirmed(input: {
  fullName: string
  email: string
  slotStartIso: string
  slotEndIso: string
  meetingUrl?: string | null
  callId?: string
  publicToken?: string
  leadId?: string
  cancelUrlPath?: string // ej "/api/calendar/cancel" - default mifge legacy
  reschedulePath?: string // ej "/api/calendar/reschedule"
}) {
  const { generateIcs } = await import("@/lib/calendar/ics")
  const cancelPath = input.cancelUrlPath ?? "/api/mifge/calls/cancel"
  const reschedulePath = input.reschedulePath ?? "/api/mifge/calls/reschedule"
  const cancelUrl = input.publicToken ? `${APP_URL}${cancelPath}/${input.publicToken}` : null
  const rescheduleUrl = input.publicToken ? `${APP_URL}${reschedulePath}/${input.publicToken}` : null
  const html = await render(AgendaConfirmedEmail({
    fullName: input.fullName,
    slotStartIso: input.slotStartIso,
    meetingUrl: input.meetingUrl,
    cancelUrl,
    rescheduleUrl,
  }))

  // .ics adjunto para que el cliente añada a Google/Apple/Outlook con un click
  const ics = generateIcs({
    uid: `${input.callId ?? input.publicToken ?? "call"}@capitalhubapp.com`,
    title: "Llamada con Adrián · Capital Hub",
    description: input.meetingUrl
      ? `Tu llamada de diagnóstico de 20 min.\n\nLink: ${input.meetingUrl}`
      : "Tu llamada de diagnóstico de 20 min.",
    location: input.meetingUrl ?? "Videollamada",
    startIso: input.slotStartIso,
    endIso: input.slotEndIso,
    organizerEmail: process.env.RESEND_FROM_EMAIL ?? "adrian@mail.capitalhubapp.com",
    organizerName: process.env.RESEND_FROM_NAME ?? "Adrián Villanueva",
    attendeeEmail: input.email,
    attendeeName: input.fullName,
  })

  return sendEmail({
    template: "agenda_confirmed",
    to: input.email,
    toName: input.fullName,
    subject: "Confirmada tu llamada con Adrián",
    html,
    callId: input.callId,
    leadId: input.leadId,
    attachments: [
      { filename: "llamada-capital-hub.ics", content: Buffer.from(ics).toString("base64"), contentType: "text/calendar" },
    ],
  })
}

export async function sendAgendaReminder24h(input: {
  fullName: string
  email: string
  slotStartIso: string
  meetingUrl: string
  durationMinutes?: number
  callId?: string
  leadId?: string
}) {
  const html = await render(AgendaReminder24hEmail({
    fullName: input.fullName,
    slotStartIso: input.slotStartIso,
    meetingUrl: input.meetingUrl,
    durationMinutes: input.durationMinutes,
  }))
  return sendEmail({
    template: "agenda_reminder_24h",
    to: input.email,
    toName: input.fullName,
    subject: "Manana hablamos. Preparacion rapida",
    html,
    callId: input.callId,
    leadId: input.leadId,
  })
}

export async function sendAgendaReminder2h(input: {
  fullName: string
  email: string
  slotStartIso: string
  meetingUrl: string
  durationMinutes?: number
  callId?: string
  leadId?: string
}) {
  const html = await render(AgendaReminder2hEmail({
    fullName: input.fullName,
    slotStartIso: input.slotStartIso,
    meetingUrl: input.meetingUrl,
    durationMinutes: input.durationMinutes,
  }))
  return sendEmail({
    template: "agenda_reminder_2h",
    to: input.email,
    toName: input.fullName,
    subject: "En 2 horas hablamos",
    html,
    callId: input.callId,
    leadId: input.leadId,
  })
}

export async function sendAgendaReminder30min(input: {
  fullName: string
  email: string
  slotStartIso: string
  meetingUrl: string
  callId?: string
  leadId?: string
}) {
  const html = await render(AgendaReminder30minEmail({
    fullName: input.fullName,
    slotStartIso: input.slotStartIso,
    meetingUrl: input.meetingUrl,
  }))
  return sendEmail({
    template: "agenda_reminder_30min",
    to: input.email,
    toName: input.fullName,
    subject: "Empezamos en 30 minutos",
    html,
    callId: input.callId,
    leadId: input.leadId,
  })
}

export async function sendTrialEnds48h(input: { fullName: string; email: string; leadId?: string }) {
  const html = await render(TrialEnds48hEmail({
    fullName: input.fullName,
    cancelUrl: CANCEL_URL,
    appUrl: APP_LOGIN_URL,
  }))
  return sendEmail({
    template: "trial_ends_48h",
    to: input.email,
    toName: input.fullName,
    subject: "Tu prueba termina en 48h",
    html,
    leadId: input.leadId,
  })
}

export async function sendPaymentFailed(input: { fullName: string; email: string; leadId?: string }) {
  const html = await render(PaymentFailedEmail({
    fullName: input.fullName,
    updateCardUrl: `${APP_LOGIN_URL}/billing/update`,
  }))
  return sendEmail({
    template: "payment_failed",
    to: input.email,
    toName: input.fullName,
    subject: "Problema con tu pago - actualiza tu método",
    html,
    leadId: input.leadId,
  })
}

export async function sendWelcomeAnual(input: { fullName: string; email: string; leadId?: string }) {
  const html = await render(WelcomeAnualEmail({
    fullName: input.fullName,
    appUrl: APP_LOGIN_URL,
    agendaUrl: AGENDA_URL,
  }))
  return sendEmail({
    template: "welcome_anual",
    to: input.email,
    toName: input.fullName,
    subject: "Bienvenido al plan anual de Capital Hub",
    html,
    leadId: input.leadId,
  })
}

export async function sendBumpConfirmed(input: { fullName: string; email: string; leadId?: string }) {
  const html = await render(BumpConfirmedEmail({
    fullName: input.fullName,
    appUrl: APP_LOGIN_URL,
  }))
  return sendEmail({
    template: "bump_confirmed",
    to: input.email,
    toName: input.fullName,
    subject: "Bonus Bundle Express activado",
    html,
    leadId: input.leadId,
  })
}

export async function sendNoShow(input: { fullName: string; email: string; callId?: string; leadId?: string }) {
  const html = await render(NoShowEmail({
    fullName: input.fullName,
    agendaUrl: AGENDA_URL,
  }))
  return sendEmail({
    template: "no_show",
    to: input.email,
    toName: input.fullName,
    subject: "No te vi hoy - reagenda en 1 click",
    html,
    callId: input.callId,
    leadId: input.leadId,
  })
}

export async function sendPostCallFollowup(input: { fullName: string; email: string; callId?: string; leadId?: string }) {
  const html = await render(PostCallFollowupEmail({
    fullName: input.fullName,
    upgradeUrl: process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_ANO ?? "https://os.capitalhubapp.com/mifge/upsell-anual",
    appUrl: APP_LOGIN_URL,
  }))
  return sendEmail({
    template: "post_call_followup",
    to: input.email,
    toName: input.fullName,
    subject: "Resumen de tu plan personalizado",
    html,
    callId: input.callId,
    leadId: input.leadId,
  })
}

export async function sendBetaRetargeting(input: {
  fullName: string
  email: string
  cancelOrigin: "trial" | "monthly" | "annual"
  leadId?: string
}) {
  const html = await render(BetaRetargetingEmail({
    fullName: input.fullName,
    rejoinUrl: "https://os.capitalhubapp.com/mifge",
    cancelOrigin: input.cancelOrigin,
  }))
  return sendEmail({
    template: `beta_retargeting_${input.cancelOrigin}`,
    to: input.email,
    toName: input.fullName,
    subject: input.cancelOrigin === "trial"
      ? "¿Qué te frenó?"
      : input.cancelOrigin === "monthly"
        ? "Hasta luego - la puerta queda abierta"
        : "Tu plan anual se acabó - la puerta queda abierta",
    html,
    leadId: input.leadId,
  })
}

// ─────────────────────────────────────────────────────────
// Notificaciones internas (a Adrián / Marco)
// ─────────────────────────────────────────────────────────

export async function notifyAdrianBooking(input: {
  fullName: string
  email: string
  phone?: string | null
  slotStartIso: string
  notes?: string | null
  callId?: string
  leadId?: string
}) {
  const html = await render(InternalBookingAlert({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    slotStartIso: input.slotStartIso,
    notes: input.notes,
  }))
  return sendEmail({
    template: "internal_booking_alert",
    to: ADRIAN_EMAIL,
    toName: "Adrián",
    subject: `🔔 Llamada agendada: ${input.fullName}`,
    html,
    callId: input.callId,
    leadId: input.leadId,
  })
}

/**
 * Email de bienvenida al alumno tras venta high-ticket.
 * El inviteUrl debe ser app.capitalhubapp.com/accept/[token] generado via BYOE
 * (supabase.auth.admin.generateLink + persistir token en student_invites).
 */
export async function sendWelcomeAlumnoHT(input: {
  fullName: string
  email: string
  product: string
  inviteUrl: string
  closerName?: string
  contactId?: string
  leadId?: string
}) {
  const html = await render(WelcomeAlumnoHTEmail({
    fullName: input.fullName,
    product: input.product,
    inviteUrl: input.inviteUrl,
    closerName: input.closerName,
  }))
  return sendEmail({
    template: "welcome_alumno_ht",
    to: input.email,
    toName: input.fullName,
    subject: `${input.fullName.split(" ")[0] ?? "Hola"}, entras hoy a Capital Hub`,
    html,
    leadId: input.leadId,
    metadata: { product: input.product, contactId: input.contactId },
    vars: {
      firstName: input.fullName.split(" ")[0] ?? "",
      fullName: input.fullName,
      email: input.email,
      product: input.product,
      inviteUrl: input.inviteUrl,
      closerName: input.closerName ?? "Capital Hub",
    },
  })
}

/**
 * Email invitación a miembro del equipo (BYOE).
 * El acceptUrl lleva un token único guardado en team_invitations.
 * La persona configura su contraseña y entra al OS.
 */
export async function sendTeamInvite(input: {
  fullName: string
  email: string
  invitedByName: string
  role: string
  acceptUrl: string
  expiresIn?: string
}) {
  const html = await render(TeamInviteEmail({
    fullName: input.fullName,
    invitedByName: input.invitedByName,
    role: input.role,
    acceptUrl: input.acceptUrl,
    expiresIn: input.expiresIn ?? "7 días",
  }))
  return sendEmail({
    template: "team_invite",
    to: input.email,
    toName: input.fullName,
    subject: `${input.invitedByName} te invita al OS de Capital Hub`,
    html,
  })
}

/**
 * Email alerta a Marco + Adrián cuando Google Calendar se desconecta.
 * Se dispara desde:
 *  - cron health check si refresh_token falla
 *  - disconnect endpoint si alguien lo borra desde la UI
 *  - book endpoint si crear evento Calendar falla por OAuth
 */
export async function notifyGCalDisconnected(input: {
  reason: string
  detail?: string
  lastConnectedAt?: string | null
  ownerEmail?: string | null
}) {
  const html = await render(InternalGCalAlert(input))
  const results = await Promise.allSettled([
    sendEmail({
      template: "internal_gcal_alert_marco",
      to: MARCO_EMAIL,
      toName: "Marco",
      subject: "⚠️ Google Calendar desconectado del OS",
      html,
    }),
    sendEmail({
      template: "internal_gcal_alert_adrian",
      to: ADRIAN_EMAIL,
      toName: "Adrián",
      subject: "⚠️ Tu Google Calendar se desconectó del OS",
      html,
    }),
  ])
  return results
}

export async function notifyMarcoErrors(input: {
  windowMinutes: number
  emailFails: number
  capiFails: number
  items: ErrorAlertItem[]
}) {
  const total = input.emailFails + input.capiFails
  const html = await render(InternalErrorAlert(input))
  return sendEmail({
    template: "internal_error_alert",
    to: MARCO_EMAIL,
    toName: "Marco",
    subject: `⚠️ ${total} fallo${total === 1 ? "" : "s"} en MIFGE - últimos ${input.windowMinutes}min`,
    html,
  })
}

/**
 * Notif venta - manda alerta a Marco Y Adrián en paralelo.
 * Decisión Marco 2026-06-19: ambos founders deben recibir notif cada venta.
 * Si uno falla el otro sigue (Promise.allSettled). El nombre del helper se
 * mantiene como notifyMarcoPurchase por compat con sales/register endpoint.
 */
export async function notifyMarcoPurchase(input: {
  eventLabel: string
  fullName: string
  email: string
  amount?: number
  currency?: string
  productName?: string
  leadId?: string
}) {
  const html = await render(InternalPurchaseAlert({
    eventLabel: input.eventLabel,
    fullName: input.fullName,
    email: input.email,
    amount: input.amount,
    currency: input.currency,
    productName: input.productName,
  }))
  const subject = `${input.amount ? `${input.amount}${input.currency === "EUR" || !input.currency ? "€" : input.currency} · ` : ""}${input.eventLabel} - ${input.fullName}`
  const vars = {
    fullName: input.fullName,
    email: input.email,
    amount: input.amount ?? 0,
    currency: input.currency ?? "EUR",
    productName: input.productName ?? "",
    eventLabel: input.eventLabel,
  }
  const results = await Promise.allSettled([
    sendEmail({
      template: "internal_purchase_alert_marco",
      to: MARCO_EMAIL,
      toName: "Marco",
      subject,
      html,
      leadId: input.leadId,
      vars,
    }),
    sendEmail({
      template: "internal_purchase_alert_adrian",
      to: ADRIAN_EMAIL,
      toName: "Adrián",
      subject,
      html,
      leadId: input.leadId,
      vars,
    }),
  ])
  const okCount = results.filter((r) => r.status === "fulfilled" && r.value.ok).length
  return { ok: okCount > 0, sent: okCount, total: 2 }
}

export async function sendPasswordChanged(input: {
  email: string
  fullName: string
  changedAt: Date
}) {
  const changedAtFormatted = input.changedAt.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const html = await render(PasswordChangedEmail({
    fullName: input.fullName,
    changedAtFormatted,
  }))
  return sendEmail({
    template: 'password_changed',
    to: input.email,
    toName: input.fullName,
    subject: 'Tu contraseña de Capital Hub OS se cambió',
    html,
  })
}
