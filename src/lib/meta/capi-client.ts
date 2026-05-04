import "server-only"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Meta Conversions API (CAPI) server-side.
 * Hashea PII (email, phone) con SHA256 antes de enviar.
 * Persiste cada intento en meta_events_log.
 * Usa event_id compartido con el Pixel browser-side para deduplicación.
 */

const PIXEL_ID = process.env.META_PIXEL_ID
const CAPI_TOKEN = process.env.META_CAPI_TOKEN
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE // opcional, para testing

const GRAPH_VERSION = "v21.0"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex")
}

export type CapiEventName =
  | "mifge_lead"
  | "mifge_free_trial_started"
  | "mifge_order_bump"
  | "mifge_call_booked"
  | "mifge_anual_purchased"
  | "mifge_monthly_purchased"
  | "mifge_call_attended"
  // Eventos estándar de Meta (mejor optimización de campañas)
  | "InitiateCheckout"
  | "Purchase"
  | "Lead"
  | "Schedule"
  | "StartTrial"
  | "Subscribe"

export type CapiUserData = {
  email?: string
  phone?: string
  fbp?: string | null
  fbc?: string | null
  ip?: string | null
  userAgent?: string | null
}

export type CapiCustomData = {
  value?: number
  currency?: string
  contentName?: string
  contentIds?: string[]
  contentType?: string
  [k: string]: unknown
}

export type SendCapiInput = {
  /** event_id compartido con el Pixel browser-side para dedup. Si no, se genera uno. */
  eventId?: string
  eventName: CapiEventName
  eventTime?: number // unix seconds, default now
  eventSourceUrl?: string
  userData: CapiUserData
  customData?: CapiCustomData
  leadId?: string
  triggeredBy?: string // ej "webhook_whop", "api_calls_book", "manual_panel"
  /** "browser" si se está disparando desde un navegador (caso de no-prod tests),
   * "server" para todo trigger normal del backend, "manual" para envíos a mano desde el panel /ads. */
  source?: "server" | "manual"
}

export async function sendCapiEvent(input: SendCapiInput): Promise<{
  ok: boolean
  eventId: string
  error?: string
  fbtraceId?: string
  eventsReceived?: number
  metaMessages?: unknown[]
}> {
  const eventId = input.eventId ?? crypto.randomUUID()
  const supabase = getAdminClient()
  const source = input.source ?? "server"

  if (!PIXEL_ID || !CAPI_TOKEN) {
    await supabase.from("meta_events_log").insert({
      event_id: eventId,
      event_name: input.eventName,
      source,
      status: "failed",
      email: input.userData.email ?? null,
      lead_id: input.leadId ?? null,
      url: input.eventSourceUrl ?? null,
      custom_data: (input.customData as Record<string, unknown>) ?? null,
      error: "META_PIXEL_ID o META_CAPI_TOKEN no configurados",
      triggered_by: input.triggeredBy ?? null,
    })
    return { ok: false, eventId, error: "Meta credentials no configuradas" }
  }

  // Build user_data hasheado
  const userData: Record<string, unknown> = {}
  if (input.userData.email) userData.em = sha256(input.userData.email)
  if (input.userData.phone) userData.ph = sha256(input.userData.phone.replace(/\D/g, ""))
  if (input.userData.fbp) userData.fbp = input.userData.fbp
  if (input.userData.fbc) userData.fbc = input.userData.fbc
  if (input.userData.ip) userData.client_ip_address = input.userData.ip
  if (input.userData.userAgent) userData.client_user_agent = input.userData.userAgent

  const customData: Record<string, unknown> = {}
  if (input.customData?.value != null) customData.value = input.customData.value
  if (input.customData?.currency) customData.currency = input.customData.currency
  if (input.customData?.contentName) customData.content_name = input.customData.contentName
  if (input.customData?.contentIds) customData.content_ids = input.customData.contentIds
  if (input.customData?.contentType) customData.content_type = input.customData.contentType
  // pasar también el resto de campos custom
  for (const [k, v] of Object.entries(input.customData ?? {})) {
    if (!["value", "currency", "contentName", "contentIds", "contentType"].includes(k)) {
      customData[k] = v
    }
  }

  const eventPayload = {
    event_name: input.eventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: input.eventSourceUrl,
    user_data: userData,
    custom_data: customData,
  }

  const requestBody = {
    data: [eventPayload],
    ...(TEST_EVENT_CODE && { test_event_code: TEST_EVENT_CODE }),
  }

  // Log "pending" antes de mandar
  const { data: logRow } = await supabase
    .from("meta_events_log")
    .insert({
      event_id: eventId,
      event_name: input.eventName,
      source,
      status: "pending",
      value: input.customData?.value ?? null,
      currency: input.customData?.currency ?? null,
      email: input.userData.email ?? null,
      lead_id: input.leadId ?? null,
      fbp: input.userData.fbp ?? null,
      fbc: input.userData.fbc ?? null,
      user_agent: input.userData.userAgent ?? null,
      ip: input.userData.ip ?? null,
      url: input.eventSourceUrl ?? null,
      custom_data: (input.customData as Record<string, unknown>) ?? null,
      request_payload: requestBody,
      triggered_by: input.triggeredBy ?? null,
    })
    .select("id")
    .single()

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
    const json = (await res.json()) as Record<string, unknown>

    if (!res.ok) {
      await supabase
        .from("meta_events_log")
        .update({
          status: "failed",
          meta_response: json,
          meta_fbtrace_id: (json.fbtrace_id as string) ?? null,
          error: typeof json.error === "object" && json.error !== null && "message" in json.error
            ? String((json.error as { message: unknown }).message)
            : `HTTP ${res.status}`,
        })
        .eq("id", logRow?.id)
      return { ok: false, eventId, error: `Meta CAPI HTTP ${res.status}` }
    }

    await supabase
      .from("meta_events_log")
      .update({
        status: "sent",
        meta_response: json,
        meta_fbtrace_id: (json.fbtrace_id as string) ?? null,
      })
      .eq("id", logRow?.id)

    return {
      ok: true,
      eventId,
      fbtraceId: (json.fbtrace_id as string) ?? undefined,
      eventsReceived: typeof json.events_received === "number" ? (json.events_received as number) : undefined,
      metaMessages: Array.isArray(json.messages) ? (json.messages as unknown[]) : undefined,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error"
    await supabase
      .from("meta_events_log")
      .update({ status: "failed", error: msg })
      .eq("id", logRow?.id)
    return { ok: false, eventId, error: msg }
  }
}
