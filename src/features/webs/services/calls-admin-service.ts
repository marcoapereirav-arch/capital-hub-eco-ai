"use client"

import { createClient } from "@/lib/supabase/client"

export type CallStatus = "booked" | "cancelled" | "attended" | "no_show" | "rescheduled"

export type CallRow = {
  id: string
  lead_id: string | null
  email: string
  full_name: string
  phone: string | null
  slot_start: string
  slot_end: string
  status: CallStatus
  notes: string | null
  meeting_url: string | null
  source: string | null
  created_at: string
}

export async function loadAllCalls(): Promise<CallRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("calls")
    .select("id,lead_id,email,full_name,phone,slot_start,slot_end,status,notes,meeting_url,source,created_at")
    .order("slot_start", { ascending: true })
  if (error) {
    console.error("[webs/calls] load", error)
    return []
  }
  return (data ?? []) as CallRow[]
}

export function subscribeAllCalls(onChange: () => void): () => void {
  const supabase = createClient()
  const channel = supabase
    .channel("calls_admin_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "calls" },
      () => onChange()
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("calls").update({ status }).eq("id", callId)
  if (error) console.error("[webs/calls] update status", error)
}

export const STATUS_META: Record<CallStatus, { label: string; color: string; dot: string }> = {
  booked: { label: "Agendada", color: "bg-cyan-500/10 border-cyan-500/40 text-cyan-300", dot: "bg-cyan-400" },
  attended: { label: "Atendida", color: "bg-green-500/10 border-green-500/40 text-green-300", dot: "bg-green-400" },
  no_show: { label: "No-show", color: "bg-orange-500/10 border-orange-500/40 text-orange-300", dot: "bg-orange-400" },
  cancelled: { label: "Cancelada", color: "bg-zinc-500/10 border-zinc-500/40 text-zinc-300", dot: "bg-zinc-400" },
  rescheduled: { label: "Reagendada", color: "bg-amber-500/10 border-amber-500/40 text-amber-300", dot: "bg-amber-400" },
}
