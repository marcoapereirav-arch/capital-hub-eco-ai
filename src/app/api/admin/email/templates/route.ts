import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Lista los templates de email registrados en el código.
 * Como están en TS/TSX el "registro" es estático: lo definimos aquí.
 * Cuando se añade un template nuevo, se añade su metadata aquí.
 */

const TEMPLATES = [
  { key: "welcome_trial", label: "Welcome Trial", description: "Cliente empieza trial 14d (MIFGE legacy)", category: "lifecycle" },
  { key: "welcome_anual", label: "Welcome Anual", description: "Cliente convirtió a anual (MIFGE legacy)", category: "lifecycle" },
  { key: "welcome_alumno_ht", label: "Welcome Alumno High Ticket", description: "Tras venta high-ticket: acceso a la App con magic link", category: "lifecycle" },
  { key: "agenda_confirmed", label: "Agenda Confirmada", description: "Confirmación reserva con .ics + link Zoom + cancel/reschedule", category: "calendar" },
  { key: "agenda_reminder_24h", label: "Recordatorio 24h", description: "24h antes de la llamada (cron)", category: "calendar" },
  { key: "no_show", label: "No Show", description: "Cliente no apareció (cron detecta y manda)", category: "calendar" },
  { key: "post_call_followup", label: "Post-Call Followup", description: "Tras marcar attended: resumen + push upsell anual", category: "calendar" },
  { key: "trial_ends_48h", label: "Trial Ends 48h", description: "48h antes de cobro recurrente (cron)", category: "lifecycle" },
  { key: "payment_failed", label: "Payment Failed", description: "Cobro recurrente fallido", category: "lifecycle" },
  { key: "bump_confirmed", label: "Bump Confirmed", description: "Confirmación order bump 19€", category: "transactional" },
  { key: "beta_retargeting_trial", label: "Beta Retargeting (trial)", description: "Cancelación desde trial", category: "retargeting" },
  { key: "beta_retargeting_monthly", label: "Beta Retargeting (mensual)", description: "Cancelación desde plan mensual", category: "retargeting" },
  { key: "beta_retargeting_annual", label: "Beta Retargeting (anual)", description: "Cancelación desde plan anual", category: "retargeting" },
  { key: "team_invite", label: "Team Invite", description: "Invitación equipo BYOE — link configurar contraseña", category: "auth" },
  { key: "internal_booking_alert", label: "Internal: Booking Alert (Adrián)", description: "Notif a Adrián cada vez que se reserva llamada", category: "internal" },
  { key: "internal_purchase_alert", label: "Internal: Purchase Alert (Marco)", description: "Notif a Marco cada compra/evento revenue", category: "internal" },
  { key: "internal_error_alert", label: "Internal: Error Alert (Marco)", description: "Digest de fallos email/CAPI cada 30 min via cron", category: "internal" },
] as const

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({ templates: TEMPLATES })
}
