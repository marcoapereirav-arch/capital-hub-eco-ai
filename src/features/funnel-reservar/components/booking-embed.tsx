"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { FUNNEL_RESERVAR } from "../config"

/**
 * Página /reservar — Calendly en POPUP (no inline).
 *
 * Por qué popup: en modo inline Calendly deja el fondo de la página BLANCO (solo
 * tematiza la card) y no se puede cambiar desde fuera (iframe cross-origin). El popup
 * abre la card oscura sobre un overlay oscuro → 100% dentro del brandkit, sin blanco.
 *
 * Al completar la reserva, Calendly emite `calendly.event_scheduled` (doc oficial) →
 * redirigimos a /reservar/gracias. NO hay que configurar nada en Calendly.
 * Prefill: ?name=&email= cuando enviamos el link a un lead que ya hizo el test.
 */
export function BookingEmbed() {
  const router = useRouter()
  const params = useSearchParams()
  const [loaded, setLoaded] = useState(false)

  const name = params.get("name") ?? params.get("nombre") ?? ""
  const email = params.get("email") ?? ""
  const widgetUrl = (() => {
    const u = new URL(FUNNEL_RESERVAR.CALENDLY_URL)
    u.searchParams.set("hide_gdpr_banner", "1")
    u.searchParams.set("background_color", "0F0F12")
    u.searchParams.set("text_color", "F5F6F7")
    u.searchParams.set("primary_color", "FFFFFF")
    if (name) u.searchParams.set("name", name)
    if (email) u.searchParams.set("email", email)
    return u.toString()
  })()

  const openPopup = useCallback(() => {
    const w = window as unknown as { Calendly?: { initPopupWidget: (o: { url: string }) => void } }
    if (w.Calendly?.initPopupWidget) w.Calendly.initPopupWidget({ url: widgetUrl })
  }, [widgetUrl])

  // Carga script + css de Calendly. Auto-abre el popup al cargar.
  useEffect(() => {
    const CSS = "https://assets.calendly.com/assets/external/widget.css"
    const JS = "https://assets.calendly.com/assets/external/widget.js"
    if (!document.querySelector(`link[href="${CSS}"]`)) {
      const l = document.createElement("link")
      l.rel = "stylesheet"
      l.href = CSS
      document.head.appendChild(l)
    }
    function ready() {
      setLoaded(true)
      openPopup()
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${JS}"]`)
    if (existing && (window as unknown as { Calendly?: unknown }).Calendly) {
      ready()
    } else if (!existing) {
      const s = document.createElement("script")
      s.src = JS
      s.async = true
      s.onload = ready
      document.body.appendChild(s)
    } else {
      existing.addEventListener("load", ready)
    }
  }, [openPopup])

  // Reserva completada → nuestra gracias-agenda
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
      className="flex min-h-[100dvh] flex-col text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 md:px-8">
        <header className="pt-8 md:pt-12">
          <span
            className="text-[11px] uppercase tracking-[0.4em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 500 }}
          >
            CAPITAL&nbsp;HUB
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-16">
          <p
            className="mb-5 text-[10px] uppercase tracking-[0.3em] text-[#9CA3AF] md:text-[11px]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Reserva tu sesión · 15 minutos · gratis
          </p>
          <h1
            className="mb-5 text-[2rem] font-medium leading-[1.08] tracking-[-0.02em] text-white md:text-[3rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Elige el día y la hora de tu sesión de orientación
          </h1>
          <p className="mb-9 max-w-xl text-base leading-relaxed text-[#C7CBD1] md:text-lg">
            15 minutos por llamada para ver tu situación y qué profesión digital encaja contigo.
            Elige el hueco que mejor te venga.
          </p>

          <button
            type="button"
            onClick={openPopup}
            className="inline-flex h-[52px] w-full max-w-xs items-center justify-center gap-2.5 rounded-none bg-white px-7 text-[15px] font-semibold text-[#0F0F12] transition-colors hover:bg-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {loaded ? (
              <>
                Elegir día y hora
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </button>
        </div>

        <footer
          className="py-7 text-[10px] uppercase tracking-[0.25em] text-[#4B5159]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>
    </main>
  )
}
