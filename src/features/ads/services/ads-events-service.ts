"use client"

import { createClient } from "@/lib/supabase/client"

export type EventStatus = "pending" | "sent" | "failed" | "dedup"
export type EventSource = "browser" | "server" | "manual"

export type MetaEventLog = {
  id: string
  event_id: string
  event_name: string
  source: EventSource
  status: EventStatus
  value: number | null
  currency: string | null
  email: string | null
  lead_id: string | null
  fbp: string | null
  fbc: string | null
  url: string | null
  custom_data: Record<string, unknown> | null
  request_payload: Record<string, unknown> | null
  meta_response: Record<string, unknown> | null
  meta_fbtrace_id: string | null
  error: string | null
  triggered_by: string | null
  created_at: string
}

export const KNOWN_EVENTS = [
  "mifge_lead",
  "mifge_free_trial_started",
  "mifge_order_bump",
  "mifge_call_booked",
  "mifge_anual_purchased",
  "mifge_monthly_purchased",
  "mifge_call_attended",
  "mifge_lead_magnet_optin",
] as const

export const EVENT_LABELS: Record<string, string> = {
  mifge_lead: "Lead (CTA landing)",
  mifge_free_trial_started: "Free Trial activado",
  mifge_order_bump: "Order Bump 19€",
  mifge_call_booked: "Llamada agendada",
  mifge_anual_purchased: "Compra Anual 970€",
  mifge_monthly_purchased: "Compra Mensual 97€",
  mifge_call_attended: "Llamada atendida",
  mifge_lead_magnet_optin: "Opt-in Lead Magnet (agregado)",
}

/**
 * Para eventos granulares por lead magnet (mifge_lm_<slug>) que no son fijos,
 * generamos label dinámico desde el slug.
 */
export function getEventLabel(eventName: string): string {
  if (EVENT_LABELS[eventName]) return EVENT_LABELS[eventName]
  if (eventName.startsWith("mifge_lm_")) {
    const slug = eventName.slice("mifge_lm_".length)
    return `Lead Magnet · ${slug.replace(/_/g, " ")}`
  }
  return eventName
}

export const STATUS_META: Record<EventStatus, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-500/10 border-amber-500/40 text-amber-300" },
  sent: { label: "Enviado", color: "bg-green-500/10 border-green-500/40 text-green-300" },
  failed: { label: "Falló", color: "bg-red-500/10 border-red-500/40 text-red-300" },
  dedup: { label: "Dedup", color: "bg-zinc-500/10 border-zinc-500/40 text-zinc-300" },
}

export async function loadMetaEvents(limit = 100): Promise<MetaEventLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("meta_events_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) {
    console.error("[ads/events] load", error)
    return []
  }
  return (data ?? []) as MetaEventLog[]
}

export function subscribeMetaEvents(onChange: () => void): () => void {
  const supabase = createClient()
  const channel = supabase
    .channel("meta_events_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "meta_events_log" },
      () => onChange()
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export async function triggerManualEvent(input: {
  event_name: string
  email: string
  value?: number
  currency?: string
}): Promise<{ ok: boolean; eventId?: string; fbtraceId?: string; eventsReceived?: number; metaMessages?: unknown[]; error?: string }> {
  const res = await fetch("/api/meta/capi/manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  return res.ok
    ? {
        ok: true,
        eventId: json.eventId,
        fbtraceId: json.fbtraceId,
        eventsReceived: json.eventsReceived,
        metaMessages: json.metaMessages,
      }
    : { ok: false, error: json.error }
}
