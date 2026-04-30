"use client"

import { createClient } from "@/lib/supabase/client"

export type PipelineStage =
  | "free_trial"
  | "agendados"
  | "no_show"
  | "no_agendados"
  | "won_ano"
  | "won_mes"
  | "pago_fallido"
  | "beta"

export type MifgeLead = {
  id: string
  email: string
  full_name: string
  phone: string | null
  pipeline_stage: PipelineStage
  bump_purchased: boolean
  converted_post_call: boolean
  pipeline_stage_updated_at: string
  created_at: string
  source: string | null
  whop_membership_id: string | null
}

export const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: "free_trial", label: "Free Trial", color: "bg-blue-500/10 border-blue-500/30 text-blue-300" },
  { id: "agendados", label: "Agendados", color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" },
  { id: "no_show", label: "No-show", color: "bg-orange-500/10 border-orange-500/30 text-orange-300" },
  { id: "no_agendados", label: "No Agendados", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" },
  { id: "won_ano", label: "WON Año", color: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" },
  { id: "won_mes", label: "WON Mes", color: "bg-green-500/10 border-green-500/30 text-green-300" },
  { id: "pago_fallido", label: "Pago Fallido", color: "bg-red-500/10 border-red-500/30 text-red-300" },
  { id: "beta", label: "Beta", color: "bg-zinc-500/10 border-zinc-500/30 text-zinc-300" },
]

export async function loadMifgeLeads(): Promise<MifgeLead[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("mifge_leads")
    .select("id,email,full_name,phone,pipeline_stage,bump_purchased,converted_post_call,pipeline_stage_updated_at,created_at,source,whop_membership_id")
    .order("pipeline_stage_updated_at", { ascending: false })

  if (error) {
    console.error("[crm] loadMifgeLeads", error)
    return []
  }
  return (data ?? []) as MifgeLead[]
}

export function subscribeMifgeLeads(onChange: () => void): () => void {
  const supabase = createClient()
  const channel = supabase
    .channel("mifge_leads_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "mifge_leads" },
      () => onChange()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
