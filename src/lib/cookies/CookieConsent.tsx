"use client"

import { useEffect, useState } from "react"
import { Cookie, X } from "lucide-react"
import Link from "next/link"

type Consent = "accepted" | "rejected" | null
const STORAGE_KEY = "ch_cookie_consent_v1"
const STORAGE_DATE_KEY = "ch_cookie_consent_date_v1"

/** Lee el consent guardado. Server-side devuelve null. */
export function getConsent(): Consent {
  if (typeof window === "undefined") return null
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === "accepted" || v === "rejected" ? v : null
  } catch {
    return null
  }
}

function saveConsent(value: "accepted" | "rejected") {
  try {
    localStorage.setItem(STORAGE_KEY, value)
    localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString())
    // Notificamos a los listeners (MetaPixel, etc.) que el consent cambió
    window.dispatchEvent(new CustomEvent("ch:consent-changed", { detail: { value } }))
  } catch {
    // ignore
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (getConsent() === null) setVisible(true)
  }, [])

  function accept() {
    saveConsent("accepted")
    setVisible(false)
  }

  function reject() {
    saveConsent("rejected")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 md:p-4">
      <div className="mx-auto max-w-3xl border border-[#2A2D34] bg-[#0F0F12]/95 backdrop-blur-md rounded-md shadow-2xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-shrink-0 hidden md:block">
            <Cookie className="h-5 w-5 text-[#37ca37]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium mb-1">Usamos cookies</p>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Cookies estrictamente necesarias siempre activas. Las de tracking publicitario (Meta Pixel) requieren tu consentimiento.{" "}
              <Link href="/legal/cookies" className="underline hover:text-white">Más info</Link>.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
            <button
              onClick={reject}
              className="flex-1 md:flex-initial px-3 py-2 border border-[#2A2D34] text-[#9CA3AF] text-xs font-mono uppercase tracking-wide rounded-sm hover:bg-[#2A2D34] hover:text-white transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={accept}
              className="flex-1 md:flex-initial px-4 py-2 bg-[#37ca37] text-black text-xs font-mono uppercase tracking-wide font-semibold rounded-sm hover:bg-[#2db82d] transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook para que componentes (MetaPixel) reaccionen al consent.
 * Devuelve true si tienen consentimiento de tracking publicitario.
 */
export function useTrackingConsent(): boolean {
  const [consent, setConsent] = useState<boolean>(false)

  useEffect(() => {
    setConsent(getConsent() === "accepted")
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ value: "accepted" | "rejected" }>).detail
      setConsent(detail.value === "accepted")
    }
    window.addEventListener("ch:consent-changed", handler)
    return () => window.removeEventListener("ch:consent-changed", handler)
  }, [])

  return consent
}
