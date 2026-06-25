"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { FUNNEL_RESERVAR } from "../config"

/**
 * Página /reservar — Calendly INLINE (online-coffee) como tarjeta blanca limpia.
 *
 * Nota técnica: Calendly en modo embed deja el fondo de la página BLANCO (solo tematiza
 * la card; el fondo oscuro no es editable cross-origin en su plan). Por eso NO forzamos
 * tema oscuro (quedaba card-oscura-sobre-blanco, feo). Lo presentamos como la card blanca
 * por defecto de Calendly, enmarcada limpia sobre la página oscura del brandkit.
 *
 * Al completar la reserva, Calendly emite `calendly.event_scheduled` (doc oficial) →
 * redirigimos a /reservar/gracias. NO hay que configurar nada en Calendly.
 * Prefill: ?name=&email= cuando enviamos el link a un lead que ya hizo el test.
 */
export function BookingEmbed() {
  const router = useRouter()
  const params = useSearchParams()
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  const name = params.get("name") ?? params.get("nombre") ?? ""
  const email = params.get("email") ?? ""
  const widgetUrl = (() => {
    const u = new URL(FUNNEL_RESERVAR.CALENDLY_URL)
    u.searchParams.set("hide_gdpr_banner", "1")
    if (name) u.searchParams.set("name", name)
    if (email) u.searchParams.set("email", email)
    return u.toString()
  })()

  useEffect(() => {
    const SRC = "https://assets.calendly.com/assets/external/widget.js"
    function init() {
      const w = window as unknown as { Calendly?: { initInlineWidget: (o: { url: string; parentElement: HTMLElement }) => void } }
      if (w.Calendly && ref.current) {
        ref.current.innerHTML = ""
        w.Calendly.initInlineWidget({ url: widgetUrl, parentElement: ref.current })
        setReady(true)
      }
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`)
    if (existing && (window as unknown as { Calendly?: unknown }).Calendly) {
      init()
    } else if (!existing) {
      const s = document.createElement("script")
      s.src = SRC
      s.async = true
      s.onload = init
      document.body.appendChild(s)
    } else {
      existing.addEventListener("load", init)
    }
  }, [widgetUrl])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== "https://calendly.com") return
      const data = e.data as { event?: string }
      if (data?.event === "calendly.event_scheduled") router.push("/reservar/gracias")
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [router])

  return (
    <main
      className="min-h-[100dvh] text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mx-auto max-w-xl px-5 md:px-8">
        <header className="pt-8 md:pt-12">
          <span
            className="text-[11px] uppercase tracking-[0.4em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 500 }}
          >
            CAPITAL&nbsp;HUB
          </span>
        </header>

        <div className="pt-10 md:pt-14 pb-7">
          <p
            className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#9CA3AF] md:text-[11px]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Reserva tu sesión · 15 minutos · gratis
          </p>
          <h1
            className="text-[1.9rem] font-medium leading-[1.08] tracking-[-0.02em] text-white md:text-[2.6rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Elige el día y la hora de tu sesión de orientación
          </h1>
        </div>

        {/* Tarjeta blanca limpia que enmarca el Calendly (light) sobre la página oscura.
            max-w-xl ≈ ancho natural de 1 columna de Calendly → llena la tarjeta sin huecos. */}
        <div className="relative mb-14 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/40 ring-1 ring-white/10">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-white text-[#6B7280]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando calendario…
            </div>
          )}
          <div ref={ref} style={{ minWidth: 320, height: 900 }} />
        </div>

        <footer
          className="pb-8 text-[10px] uppercase tracking-[0.25em] text-[#4B5159]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>
    </main>
  )
}
