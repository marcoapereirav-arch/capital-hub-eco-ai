import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export type LeadMagnetsFunnelStats = {
  /** Comentarios captados (deliveries totales). Equivale a "DMs disparados" — mismo número en el flow actual. */
  optins_captured: number
  /** Emails reales capturados (excluye placeholders manychat-*@lead.capitalhubapp.local). */
  email_captured: number
  /** Recursos abiertos (deliveries con opened_at != null). */
  resource_opened: number
  /** Leads que pasaron de stage 'lead' a cualquier stage post-lead (incluye free_trial, won, beta). */
  trial_activated: number
  /** Leads totales atribuidos a algún LM (first_touch_lead_magnet_id != null). */
  attributed_leads: number
}

const POST_LEAD_STAGES = [
  "free_trial",
  "agendados",
  "no_show",
  "no_agendados",
  "won_ano",
  "won_mes",
  "pago_fallido",
  "beta",
] as const

export async function getLeadMagnetsFunnelStats(): Promise<LeadMagnetsFunnelStats> {
  const supabase = createAdminClient()

  // Ejecutar todas las queries en paralelo
  const [deliveriesRes, leadsAttributedRes] = await Promise.all([
    supabase.from("lead_magnet_deliveries").select("id, opened_at"),
    supabase
      .from("mifge_leads")
      .select("id, email, pipeline_stage")
      .not("first_touch_lead_magnet_id", "is", null),
  ])

  const deliveries = deliveriesRes.data ?? []
  const leadsAttributed = leadsAttributedRes.data ?? []

  const optins_captured = deliveries.length
  const resource_opened = deliveries.filter((d) => d.opened_at != null).length

  const email_captured = leadsAttributed.filter(
    (l) => !(typeof l.email === "string" && l.email.endsWith("@lead.capitalhubapp.local"))
  ).length

  const trial_activated = leadsAttributed.filter((l) =>
    POST_LEAD_STAGES.includes(l.pipeline_stage as (typeof POST_LEAD_STAGES)[number])
  ).length

  return {
    optins_captured,
    email_captured,
    resource_opened,
    trial_activated,
    attributed_leads: leadsAttributed.length,
  }
}
