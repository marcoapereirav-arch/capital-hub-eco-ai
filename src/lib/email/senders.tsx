import "server-only"
import { render } from "@react-email/render"
import { sendEmail } from "./send-email"
import { APP_URL } from "./resend-client"
import { WelcomeTrialEmail } from "./templates/welcome-trial"
import { AgendaConfirmedEmail } from "./templates/agenda-confirmed"
import { AgendaReminder24hEmail } from "./templates/agenda-reminder-24h"
import { TrialEnds48hEmail } from "./templates/trial-ends-48h"
import { PaymentFailedEmail } from "./templates/payment-failed"

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
  meetingUrl?: string | null
  callId?: string
  leadId?: string
}) {
  const html = await render(AgendaConfirmedEmail({
    fullName: input.fullName,
    slotStartIso: input.slotStartIso,
    meetingUrl: input.meetingUrl,
  }))
  return sendEmail({
    template: "agenda_confirmed",
    to: input.email,
    toName: input.fullName,
    subject: "Confirmada tu llamada con Adrián",
    html,
    callId: input.callId,
    leadId: input.leadId,
  })
}

export async function sendAgendaReminder24h(input: {
  fullName: string
  email: string
  slotStartIso: string
  meetingUrl: string
  callId?: string
  leadId?: string
}) {
  const html = await render(AgendaReminder24hEmail({
    fullName: input.fullName,
    slotStartIso: input.slotStartIso,
    meetingUrl: input.meetingUrl,
  }))
  return sendEmail({
    template: "agenda_reminder_24h",
    to: input.email,
    toName: input.fullName,
    subject: "Mañana hablamos — preparación rápida",
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
    subject: "Problema con tu pago — actualiza tu método",
    html,
    leadId: input.leadId,
  })
}
