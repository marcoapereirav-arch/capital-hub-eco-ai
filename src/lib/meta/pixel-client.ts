"use client"

/**
 * Helpers Pixel browser-side. Llaman a fbq() global expuesto por el script
 * de inicialización en MetaPixel (componente que se monta en layout público).
 *
 * Cada evento se dispara también server-side via /api/meta/capi/track con el
 * MISMO event_id para deduplicación de Meta.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

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
 * Devuelve la promesa del POST server-side; el browser-side se dispara síncrono.
 */
export async function track(input: TrackInput): Promise<{ ok: boolean; eventId: string }> {
  const eventId = generateEventId()
  const { fbp, fbc } = readFbCookies()

  // Browser-side fbq
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    const customData: Record<string, unknown> = {}
    if (input.value != null) customData.value = input.value
    if (input.currency) customData.currency = input.currency
    if (input.contentName) customData.content_name = input.contentName
    if (input.contentIds) customData.content_ids = input.contentIds
    if (input.custom) Object.assign(customData, input.custom)
    try {
      window.fbq("trackCustom", input.event, customData, { eventID: eventId })
    } catch (e) {
      console.warn("[meta/pixel] fbq error", e)
    }
  }

  // Server-side CAPI con el mismo eventId para dedup
  try {
    const res = await fetch("/api/meta/capi/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        event_name: input.event,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        user_data: { email: input.email, phone: input.phone, fbp, fbc },
        custom_data: {
          value: input.value,
          currency: input.currency,
          contentName: input.contentName,
          contentIds: input.contentIds,
          ...(input.custom ?? {}),
        },
      }),
    })
    return { ok: res.ok, eventId }
  } catch (e) {
    console.error("[meta/pixel] server CAPI fetch error", e)
    return { ok: false, eventId }
  }
}
