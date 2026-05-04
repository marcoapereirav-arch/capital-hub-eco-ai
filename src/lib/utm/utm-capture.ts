"use client"

const STORAGE_KEY = "ch_utm_v1"
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 días

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const

export type UtmData = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  first_landing_url?: string
  first_referrer?: string
  captured_at?: string
}

/**
 * Captura UTMs del query string al primer landing y los persiste 30 días.
 * Si ya hay utms guardadas, NO las sobrescribe (first-touch attribution).
 */
export function captureUtmsIfPresent(): UtmData | null {
  if (typeof window === "undefined") return null

  // Ya hay almacenado y no caducado → first-touch, respetar
  const existing = getStoredUtms()
  if (existing && existing.captured_at) {
    const age = Date.now() - new Date(existing.captured_at).getTime()
    if (age < TTL_MS) return existing
  }

  const params = new URLSearchParams(window.location.search)
  const data: UtmData = {}
  let any = false
  for (const k of UTM_KEYS) {
    const v = params.get(k)
    if (v) {
      data[k] = v
      any = true
    }
  }

  // Aunque no haya utm_*, si viene de un referrer externo lo guardamos como first-touch
  const referrer = document.referrer || undefined
  if (referrer && !referrer.includes(window.location.host)) {
    data.first_referrer = referrer
    any = true
  }

  if (!any && !existing) return null

  const payload: UtmData = {
    ...(existing ?? {}),
    ...data,
    first_landing_url: existing?.first_landing_url ?? window.location.href,
    captured_at: existing?.captured_at ?? new Date().toISOString(),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
  return payload
}

export function getStoredUtms(): UtmData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UtmData
  } catch {
    return null
  }
}

export function clearUtms(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
