import { NextRequest, NextResponse } from "next/server"
import { render } from "@react-email/render"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { WelcomeTrialEmail } from "@/lib/email/templates/welcome-trial"
import { AgendaConfirmedEmail } from "@/lib/email/templates/agenda-confirmed"
import { AgendaReminder24hEmail } from "@/lib/email/templates/agenda-reminder-24h"
import { TrialEnds48hEmail } from "@/lib/email/templates/trial-ends-48h"
import { PaymentFailedEmail } from "@/lib/email/templates/payment-failed"
import { InternalBookingAlert } from "@/lib/email/templates/internal-booking-alert"
import { InternalPurchaseAlert } from "@/lib/email/templates/internal-purchase-alert"
import { WelcomeAnualEmail } from "@/lib/email/templates/welcome-anual"
import { BumpConfirmedEmail } from "@/lib/email/templates/bump-confirmed"
import { NoShowEmail } from "@/lib/email/templates/no-show"
import { PostCallFollowupEmail } from "@/lib/email/templates/post-call-followup"
import { BetaRetargetingEmail } from "@/lib/email/templates/beta-retargeting"
import { WelcomeAlumnoHTEmail } from "@/lib/email/templates/welcome-alumno-ht"
import { TeamInviteEmail } from "@/lib/email/templates/team-invite"
import { InternalErrorAlert } from "@/lib/email/templates/internal-error-alert"
import { InternalGCalAlert } from "@/lib/email/templates/internal-gcal-alert"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://os.capitalhubapp.com"

// Datos demo para cada template (suficiente para previsualizar)
const previews: Record<string, () => Promise<string>> = {
  welcome_trial: () => render(WelcomeTrialEmail({
    fullName: "Israel Ramírez",
    appUrl: "https://app.capitalhubapp.com",
    agendaUrl: `${APP_URL}/mifge/agenda`,
  })),
  welcome_anual: () => render(WelcomeAnualEmail({
    fullName: "Israel Ramírez",
    appUrl: "https://app.capitalhubapp.com",
    agendaUrl: `${APP_URL}/mifge/agenda`,
  })),
  welcome_alumno_ht: () => render(WelcomeAlumnoHTEmail({
    fullName: "Israel Ramírez",
    product: "IA Integrator",
    inviteUrl: "https://app.capitalhubapp.com/accept-invite/demo-token-32chars-xxxxxxxxxx",
    closerName: "Adrián",
  })),
  agenda_confirmed: () => render(AgendaConfirmedEmail({
    fullName: "Israel Ramírez",
    slotStartIso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    meetingUrl: "https://us06web.zoom.us/j/6812281370",
    cancelUrl: `${APP_URL}/api/calendar/cancel/demo-token`,
    rescheduleUrl: `${APP_URL}/api/calendar/reschedule/demo-token`,
  })),
  agenda_reminder_24h: () => render(AgendaReminder24hEmail({
    fullName: "Israel Ramírez",
    slotStartIso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    meetingUrl: "https://us06web.zoom.us/j/6812281370",
  })),
  no_show: () => render(NoShowEmail({
    fullName: "Israel Ramírez",
    agendaUrl: `${APP_URL}/agenda`,
  })),
  post_call_followup: () => render(PostCallFollowupEmail({
    fullName: "Israel Ramírez",
    upgradeUrl: "https://os.capitalhubapp.com/mifge/upsell-anual",
    appUrl: "https://app.capitalhubapp.com",
  })),
  trial_ends_48h: () => render(TrialEnds48hEmail({
    fullName: "Israel Ramírez",
    cancelUrl: "https://app.capitalhubapp.com/billing/cancel",
    appUrl: "https://app.capitalhubapp.com",
  })),
  payment_failed: () => render(PaymentFailedEmail({
    fullName: "Israel Ramírez",
    updateCardUrl: "https://app.capitalhubapp.com/billing/update",
  })),
  bump_confirmed: () => render(BumpConfirmedEmail({
    fullName: "Israel Ramírez",
    appUrl: "https://app.capitalhubapp.com",
  })),
  beta_retargeting_trial: () => render(BetaRetargetingEmail({
    fullName: "Israel Ramírez",
    rejoinUrl: "https://os.capitalhubapp.com/mifge",
    cancelOrigin: "trial",
  })),
  beta_retargeting_monthly: () => render(BetaRetargetingEmail({
    fullName: "Israel Ramírez",
    rejoinUrl: "https://os.capitalhubapp.com/mifge",
    cancelOrigin: "monthly",
  })),
  beta_retargeting_annual: () => render(BetaRetargetingEmail({
    fullName: "Israel Ramírez",
    rejoinUrl: "https://os.capitalhubapp.com/mifge",
    cancelOrigin: "annual",
  })),
  team_invite: () => render(TeamInviteEmail({
    fullName: "Nagai",
    invitedByName: "Adrián Villanueva",
    role: "closer",
    acceptUrl: `${APP_URL}/accept-invite/demo-token-32chars-xxxxxxxxxx`,
    expiresIn: "7 días",
  })),
  internal_booking_alert: () => render(InternalBookingAlert({
    fullName: "Israel Ramírez",
    email: "israel@email.com",
    phone: "+34 600 000 000",
    slotStartIso: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    notes: "Trabaja en IT, busca cambio profesional",
  })),
  internal_purchase_alert: () => render(InternalPurchaseAlert({
    eventLabel: "Cierre tras llamada",
    fullName: "Israel Ramírez",
    email: "israel@email.com",
    amount: 2990,
    currency: "EUR",
    productName: "IA Integrator",
  })),
  internal_error_alert: () => render(InternalErrorAlert({
    windowMinutes: 30,
    emailFails: 2,
    capiFails: 1,
    items: [
      { source: "email", template_or_event: "agenda_confirmed", error: "Resend rate limit", occurred_at: new Date().toISOString(), to_or_meta: "user@email.com" },
      { source: "capi", template_or_event: "Purchase", error: "Meta CAPI 400 invalid event", occurred_at: new Date().toISOString(), to_or_meta: "browser" },
    ],
  })),
  internal_gcal_alert: () => render(InternalGCalAlert({
    reason: "refresh_failed",
    detail: "invalid_grant: Token has been expired or revoked.",
    lastConnectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ownerEmail: "adrianvillanuevarios@gmail.com",
  })),
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { key } = await ctx.params
  const renderer = previews[key]
  if (!renderer) return new NextResponse(`Unknown template key: ${key}`, { status: 404 })

  const html = await renderer()
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
