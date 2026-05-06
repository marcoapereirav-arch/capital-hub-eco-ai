import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type { LeadMagnet, LeadMagnetWithStats } from "../types"

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

/**
 * Lista todos los lead magnets con stats agregadas (delivery + lead counts).
 *
 * NOTA: queries separadas + agregación en JS para evitar SQL complejo. Volumen esperado
 * bajo (<50 LMs en cualquier momento), no merece optimización prematura.
 */
export async function listLeadMagnetsWithStats(): Promise<LeadMagnetWithStats[]> {
  const supabase = createAdminClient()

  const { data: lms, error } = await supabase
    .from("lead_magnets")
    .select("*")
    .order("created_at", { ascending: false })

  if (error || !lms) {
    console.error("[lead-magnets/service] list failed:", error)
    return []
  }

  const stats: LeadMagnetWithStats[] = await Promise.all(
    (lms as LeadMagnet[]).map(async (lm) => {
      // Deliveries: total + opened
      const { data: deliveries } = await supabase
        .from("lead_magnet_deliveries")
        .select("id, opened_at")
        .eq("lead_magnet_id", lm.id)

      const optins_total = deliveries?.length ?? 0
      const opens_total = (deliveries ?? []).filter((d) => d.opened_at != null).length

      // Leads cuyo first_touch_lead_magnet_id apunta a este LM
      const { data: leads } = await supabase
        .from("mifge_leads")
        .select("id, pipeline_stage")
        .eq("first_touch_lead_magnet_id", lm.id)

      const leads_total = leads?.length ?? 0
      const converted_to_trial_total = (leads ?? []).filter((l) =>
        POST_LEAD_STAGES.includes(l.pipeline_stage as (typeof POST_LEAD_STAGES)[number])
      ).length

      return {
        ...lm,
        optins_total,
        opens_total,
        leads_total,
        converted_to_trial_total,
      }
    })
  )

  return stats
}
