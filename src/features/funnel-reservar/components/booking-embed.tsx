"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { FUNNEL_RESERVAR } from "../config"

/**
 * Página /reservar — Calendly embebido (online-coffee).
 *
 * Al completar la reserva, Calendly emite el postMessage `calendly.event_scheduled`
 * (verificado en doc oficial). Lo capturamos y redirigimos a /reservar/gracias
 * (nuestra página de gracias-agenda). NO hace falta configurar redirección en Calendly.
 *
 * Prefill: si llega ?name= y ?email= en la URL (cuando enviamos el link a un lead
 * que ya hizo el test), se pasan a Calendly para precargar sus datos.
 */
export function BookingEmbed() {
  const router = useRouter()
  const params = useSearchParams()
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  // Construye la URL del widget con prefill opcional
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

  // Carga el script de Calendly + inicializa el inline widget
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
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`)
    if (script && (window as unknown as { Calendly?: unknown }).Calendly) {
      init()
    } else if (!script) {
      script = document.createElement("script")
      script.src = SRC
      script.async = true
      script.onload = init
      document.body.appendChild(script)
    } else {
      script.addEventListener("load", init)
    }
  }, [widgetUrl])

  // Escucha el evento de reserva completada → redirige a nuestra gracias-agenda
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== "https://calendly.com") return
      const data = e.data as { event?: string }
      if (data?.event === "calendly.event_scheduled") {
        router.push("/reservar/gracias")
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
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <header className="pt-8 md:pt-12">
          <span
            className="text-[11px] uppercase tracking-[0.4em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 500 }}
          >
            CAPITAL&nbsp;HUB
          </span>
        </header>

        <div className="pt-10 md:pt-14 pb-6">
          <p
            className="mb-4 text-[10px] uppercase tracking-[0.3em] text-[#9CA3AF]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Reserva tu sesión · 15 min · gratis
          </p>
          <h1
            className="text-3xl md:text-4xl font-medium leading-[1.1] tracking-[-0.01em] text-white"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Elige el día y la hora de tu sesión de orientación
          </h1>
        </div>

        {/* Calendly inline */}
        <div className="relative rounded-none border border-[#2A2D34] bg-[#0F0F12]">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando calendario…
            </div>
          )}
          <div ref={ref} style={{ minWidth: 320, height: 720 }} />
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
