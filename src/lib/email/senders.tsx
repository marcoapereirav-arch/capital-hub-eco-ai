import "server-only"
import { render } from "@react-email/render"
import { sendEmail } from "./send-email"
import { APP_URL } from "./resend-client"
import { WelcomeTrialEmail } from "./templates/welcome-trial"
import { AgendaConfirmedEmail } from "./templates/agenda-confirmed"
import { AgendaReminder24hEmail } from "./templates/agenda-reminder-24h"
import { TrialEnds48hEmail } from "./templates/trial-ends-48h"
import { PaymentFailedEmail } from "./templates/payment-failed"
import { InternalBookingAlert } from "./templates/internal-booking-alert"
import { InternalPurchaseAlert } from "./templates/internal-purchase-alert"

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
  return sendEmail({
    template: "internal_purchase_alert",
    to: MARCO_EMAIL,
    toName: "Marco",
    subject: `${input.amount ? `${input.amount}${input.currency === "EUR" || !input.currency ? "€" : input.currency} · ` : ""}${input.eventLabel} — ${input.fullName}`,
    html,
    leadId: input.leadId,
  })
}
