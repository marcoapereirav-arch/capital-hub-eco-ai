"use client"

import { getStoredUtms } from "@/lib/utm/utm-capture"

/**
 * Helpers Pixel browser-side. Llaman a fbq() global expuesto por el script
 * de inicialización en MetaPixel (componente que se monta en layout público).
 *
 * Cada evento se dispara también server-side via /api/meta/capi/track con el
 * MISMO event_id para deduplicación de Meta.
 *
 * Cada track() incluye automáticamente las UTMs almacenadas (first-touch
 * attribution) para que Meta tenga la atribución completa de la campaña.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

/**
 * Los eventos ESTÁNDAR de Meta que usamos. Fijados en el SOP
 * `marketing/09-eventos-meta-catalogo`. Si no está aquí, es un evento nuestro.
 *
 * Regla: una acción del usuario dispara UN solo evento estándar. Disparar `Lead` y
 * `CompleteRegistration` en el mismo envío duplica las conversiones y parte en dos el
 * aprendizaje del algoritmo.
 */
export const META_STANDARD_EVENTS = new Set([
  "ViewContent",
  "Lead",
  "Schedule",
  "Contact",
  // Reservados para cuando se cobre desde el OS
  "InitiateCheckout",
  "Purchase",
])

export function generateEventId(): string {
  // crypto.randomUUID() existe en navegadores modernos
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  // fallback simple
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Lee cookies _fbp y _fbc puestas por el Pixel base. */
export function readFbCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {}
  const get = (name: string) => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`))
    return m ? decodeURIComponent(m[1]) : undefined
  }
  return { fbp: get("_fbp"), fbc: get("_fbc") }
}

export type TrackInput = {
  event: string
  value?: number
  currency?: string
  email?: string
  phone?: string
  contentName?: string
  contentIds?: string[]
  custom?: Record<string, unknown>
}

/**
 * Dispara el evento en browser (Pixel) + server (CAPI) con event_id compartido.
 * Incluye UTMs almacenadas (first-touch) en custom_data automáticamente.
 *
 * Si standardEvent está presente, también dispara el evento ESTÁNDAR de Meta
 * (InitiateCheckout, Purchase, etc) además del custom — Meta optimiza mejor
 * campañas con eventos estándar que con custom puros.
 */
export async function track(input: TrackInput & { standardEvent?: string }): Promise<{ ok: boolean; eventId: string }> {
  const eventId = generateEventId()
  const { fbp, fbc } = readFbCookies()
  const utms = getStoredUtms() ?? {}

  const baseCustom: Record<string, unknown> = {}
  if (input.value != null) baseCustom.value = input.value
  if (input.currency) baseCustom.currency = input.currency
  if (input.contentName) baseCustom.content_name = input.contentName
  if (input.contentIds) baseCustom.content_ids = input.contentIds
  if (input.custom) Object.assign(baseCustom, input.custom)
  // Añade UTMs como custom_data (Meta los acepta como atributos arbitrarios)
  if (utms.utm_source) baseCustom.utm_source = utms.utm_source
  if (utms.utm_medium) baseCustom.utm_medium = utms.utm_medium
  if (utms.utm_campaign) baseCustom.utm_campaign = utms.utm_campaign
  if (utms.utm_content) baseCustom.utm_content = utms.utm_content
  if (utms.utm_term) baseCustom.utm_term = utms.utm_term

  // Browser-side fbq (custom + opcional estándar con MISMO eventID).
  // Un evento estándar va por fbq("track"), uno nuestro por fbq("trackCustom"). Si se
  // manda un estándar como custom, Meta lo trata como un nombre inventado y NO optimiza
  // con él, que es justo lo contrario de lo que buscamos.
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      const method = META_STANDARD_EVENTS.has(input.event) ? "track" : "trackCustom"
      window.fbq(method, input.event, baseCustom, { eventID: eventId })
      if (input.standardEvent && input.standardEvent !== input.event) {
        window.fbq("track", input.standardEvent, baseCustom, { eventID: eventId })
      }
    } catch (e) {
      console.warn("[meta/pixel] fbq error", e)
    }
  }

  // Server-side CAPI con el MISMO eventId para dedup.
  // Se manda el custom y, si lo hay, TAMBIÉN el estándar. Antes el estándar solo salía
  // por el píxel del navegador: si el lead rechazaba cookies, Meta no recibía ningún
  // `Lead` ni `Schedule`, que son justo los eventos hacia los que optimizan las
  // campañas. Meta deduplica por (event_name, event_id), así que compartir el eventId
  // entre custom y estándar es correcto: son nombres distintos.
  const payload = {
    event_id: eventId,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    user_data: { email: input.email, phone: input.phone, fbp, fbc },
    custom_data: {
      value: input.value,
      currency: input.currency,
      contentName: input.contentName,
      contentIds: input.contentIds,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
      utm_term: utms.utm_term,
      ...(input.custom ?? {}),
    },
  }

  const post = (eventName: string) =>
    fetch("/api/meta/capi/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, event_name: eventName }),
      keepalive: true,
    })

  try {
    const names = input.standardEvent ? [input.event, input.standardEvent] : [input.event]
    const results = await Promise.all(names.map((n) => post(n).catch(() => null)))
    // ok solo si TODOS llegaron. Si el estándar falla, la campaña se queda sin su
    // señal de optimización, así que no vale darlo por bueno.
    return { ok: results.every((r) => r?.ok === true), eventId }
  } catch (e) {
    console.error("[meta/pixel] server CAPI fetch error", e)
    return { ok: false, eventId }
  }
}

/**
 * Dispara SOLO un evento estándar de Meta, sin custom que lo acompañe.
 * Para señales de página como `ViewContent`, donde no aporta nada tener un
 * gemelo custom. Sale por píxel y por servidor con el mismo event_id.
 */
export async function trackStandard(
  standardEvent: "ViewContent" | "Lead" | "Schedule" | "Contact",
  input: Omit<TrackInput, "event"> = {},
): Promise<{ ok: boolean; eventId: string }> {
  return track({ ...input, event: standardEvent, standardEvent: undefined })
}
