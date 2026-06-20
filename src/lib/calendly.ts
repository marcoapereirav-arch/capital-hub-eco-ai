import "server-only"
import crypto from "node:crypto"

/**
 * Cliente Calendly API + helpers.
 *
 * Auth: Personal Access Token (PAT) en env CALENDLY_PERSONAL_ACCESS_TOKEN.
 * El webhook signing_key se obtiene al crear el webhook con createWebhookSubscription()
 * y se guarda en BD (calendly_config.webhook_signing_key).
 *
 * Doc: https://developers.calendly.com/api-docs
 */

const API_BASE = "https://api.calendly.com"

function getToken(): string {
  const t = process.env.CALENDLY_PERSONAL_ACCESS_TOKEN
  if (!t) throw new Error("CALENDLY_PERSONAL_ACCESS_TOKEN no configurada")
  return t
}

async function calendlyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Calendly ${init?.method ?? "GET"} ${path} → ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

export type CalendlyUser = {
  uri: string
  name: string
  email: string
  scheduling_url: string
  timezone: string
  current_organization: string
}

export async function getCurrentUser(): Promise<CalendlyUser> {
  const data = await calendlyFetch<{ resource: CalendlyUser }>("/users/me")
  return data.resource
}

export type CalendlyEventType = {
  uri: string
  name: string
  slug: string
  scheduling_url: string
  duration: number
  active: boolean
  color: string
  internal_note: string | null
}

export async function listEventTypes(organizationUri: string): Promise<CalendlyEventType[]> {
  const params = new URLSearchParams({ organization: organizationUri, count: "100" })
  const data = await calendlyFetch<{ collection: CalendlyEventType[] }>(`/event_types?${params}`)
  return data.collection
}

export type CalendlyScheduledEvent = {
  uri: string
  name: string
  status: string
  start_time: string
  end_time: string
  event_type: string
  location?: { type: string; location?: string; join_url?: string }
}

export async function listScheduledEvents(organizationUri: string, opts?: { count?: number }): Promise<CalendlyScheduledEvent[]> {
  const params = new URLSearchParams({ organization: organizationUri, count: String(opts?.count ?? 100), status: "active" })
  const data = await calendlyFetch<{ collection: CalendlyScheduledEvent[] }>(`/scheduled_events?${params}`)
  return data.collection
}

export type CalendlyInvitee = {
  uri: string
  email: string
  name: string
  text_reminder_number?: string | null
  cancellation?: { reason?: string }
}

export async function listInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
  // eventUri es URL absoluta tipo https://api.calendly.com/scheduled_events/{uuid}
  const eventUuid = eventUri.split("/").pop()
  const data = await calendlyFetch<{ collection: CalendlyInvitee[] }>(`/scheduled_events/${eventUuid}/invitees?count=100`)
  return data.collection
}

/**
 * Crea webhook subscription en Calendly apuntando al endpoint del OS.
 * Devuelve { resource: { uri, signing_key, ... } }.
 *
 * events array: ["invitee.created", "invitee.canceled", "invitee_no_show.created"]
 * scope: "organization" (recibe eventos de toda la org, no solo del user)
 */
export type CalendlyWebhookSubscription = {
  uri: string
  callback_url: string
  events: string[]
  signing_key: string
  scope: string
  state: string
}

export async function createWebhookSubscription(input: {
  callbackUrl: string
  organizationUri: string
  events?: string[]
}): Promise<CalendlyWebhookSubscription> {
  const body = {
    url: input.callbackUrl,
    organization: input.organizationUri,
    events: input.events ?? ["invitee.created", "invitee.canceled", "invitee_no_show.created"],
    scope: "organization",
  }
  const data = await calendlyFetch<{ resource: CalendlyWebhookSubscription }>(`/webhook_subscriptions`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  return data.resource
}

export async function listWebhookSubscriptions(organizationUri: string): Promise<CalendlyWebhookSubscription[]> {
  const params = new URLSearchParams({ organization: organizationUri, scope: "organization", count: "100" })
  const data = await calendlyFetch<{ collection: CalendlyWebhookSubscription[] }>(`/webhook_subscriptions?${params}`)
  return data.collection
}

export async function deleteWebhookSubscription(webhookUri: string): Promise<void> {
  const uuid = webhookUri.split("/").pop()
  await calendlyFetch(`/webhook_subscriptions/${uuid}`, { method: "DELETE" })
}

/**
 * Verifica la firma de un webhook entrante.
 * Header: Calendly-Webhook-Signature: t=...,v1=...
 * Algoritmo: HMAC-SHA256 sobre `${t}.${rawBody}` con la signing_key.
 *
 * Tolerancia opcional para evitar replay attacks (timestamp < toleranceSec).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
  toleranceSec = 300,
): { valid: boolean; reason?: string } {
  if (!signatureHeader) return { valid: false, reason: "Missing Calendly-Webhook-Signature header" }
  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=")
    if (k && v) acc[k.trim()] = v.trim()
    return acc
  }, {})
  const t = parts.t
  const v1 = parts.v1
  if (!t || !v1) return { valid: false, reason: "Malformed signature header" }

  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - parseInt(t, 10))
  if (ageSec > toleranceSec) return { valid: false, reason: `Signature too old (${ageSec}s)` }

  const expected = crypto.createHmac("sha256", signingKey).update(`${t}.${rawBody}`).digest("hex")
  const match = crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"))
  return match ? { valid: true } : { valid: false, reason: "Signature mismatch" }
}
