"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FUNNEL_RESERVAR } from "../config"
import { LoadingScreen } from "@/components/ui/loading-screen"

/**
 * Página /reservar — Calendly INLINE (online-coffee) como tarjeta blanca limpia sobre
 * la página oscura del brandkit. Diseño alineado al funnel Test: logo de marca, copy
 * en Inter normal (sin mayúsculas espaciadas) y verde de acento.
 *
 * - Carga rápida: preconnect + preload del widget en `reservar/page.tsx` (head) → el
 *   navegador conecta y baja el script de Calendly cuanto antes.
 * - Sin scroll interno (móvil): escuchamos `calendly.page_height` y ajustamos el alto de
 *   la tarjeta al contenido real → el calendario no necesita scroll propio y la página
 *   baja de corrido.
 * - Al reservar, Calendly emite `calendly.event_scheduled` → vamos a /reservar/gracias.
 * - Mientras carga: efecto de carga de marca (<LoadingScreen/>).
 * - Prefill: ?name=&email= cuando enviamos el link a un lead que ya hizo el test.
 */
export function BookingEmbed() {
  const router = useRouter()
  const params = useSearchParams()
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [height, setHeight] = useState(720)

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
    // Fallback: si por lo que sea no llega page_height, no dejes el loader colgado
    const t = setTimeout(() => setReady(true), 6000)
    return () => clearTimeout(t)
  }, [widgetUrl])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (typeof e.origin !== "string" || !e.origin.includes("calendly.com")) return
      const data = e.data as { event?: string; payload?: { height?: string } }
      if (data?.event === "calendly.event_scheduled") {
        router.push("/reservar/gracias")
        return
      }
      // Altura real del contenido → tarjeta a medida, sin scroll interno
      if (data?.event === "calendly.page_height" && data.payload?.height) {
        const h = parseInt(data.payload.height, 10)
        if (!Number.isNaN(h) && h > 300) {
          setHeight(h)
          setReady(true)
        }
      }
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
        {/* Logo de marca (brandkit: mayúsculas espaciadas, como el OS) */}
        <header className="pt-8 md:pt-12">
          <span
            className="text-sm font-semibold uppercase tracking-[0.15em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Capital Hub
          </span>
        </header>

        <div className="pt-10 md:pt-14 pb-7">
          <p className="mb-4 inline-flex items-center gap-2 text-sm text-[#9CA3AF] md:text-[15px]">
            <span className="rv-dot" /> Reserva tu sesión · 15 minutos ·{" "}
            <span className="font-semibold text-[#22C55E]">gratis</span>
          </p>
          <h1
            className="text-[1.9rem] font-medium leading-[1.08] tracking-[-0.02em] text-white md:text-[2.6rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Elige el día y la hora de tu sesión de orientación
          </h1>
        </div>

        {/* Tarjeta blanca que enmarca el Calendly (light). El alto se ajusta al contenido
            real (calendly.page_height) → sin scroll interno en móvil. */}
        <div className="relative mb-14 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/40 ring-1 ring-white/10">
          {!ready && (
            <div className="absolute inset-0 z-10">
              <LoadingScreen fullscreen={false} className="absolute inset-0" />
            </div>
          )}
          <div ref={ref} style={{ minWidth: 320, height }} />
        </div>

        <footer className="pb-8 text-[13px] text-[#6B7280]">
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>

      <style>{`
        .rv-dot { display:inline-block; width:7px; height:7px; border-radius:9999px; background:#22C55E; box-shadow:0 0 0 0 rgba(34,197,94,0.5); animation: rv-pulse 2.4s ease-out infinite; }
        @keyframes rv-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
        @media (prefers-reduced-motion: reduce){ .rv-dot{animation:none} }
      `}</style>
    </main>
  )
}
