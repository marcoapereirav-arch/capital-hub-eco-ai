"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { FUNNEL_TEST_PERSONALIDAD, bunnyEmbedUrl } from "../config"

/**
 * Página de Gracias del Funnel Test Personalidad (v2, ver PRP-007 y SOP marketing/07).
 *
 * En v1 esta página entregaba el link del test y el lead se iba en 3 segundos.
 * En v2 es la PÁGINA DE VENTA del funnel. Decidido en la reunión del 18-jul-2026:
 *
 *   1. Avisa de que el test llega por email en N minutos (default 7).
 *   2. Mientras espera, el lead ve la VSL de Adrián (Bunny Stream).
 *   3. Justo debajo, el Calendly embebido, VISIBLE DESDE EL SEGUNDO 0
 *      (Pat, 22:20: "yo lo pondría desde el principio").
 *   4. Al reservar, Calendly emite `calendly.event_scheduled` y vamos a
 *      /reservar/gracias, que ya tiene el vídeo de preparación de la llamada.
 *
 * NO lleva botón de WhatsApp: se quitó por fricción (Giustina, 53:49). El WhatsApp
 * vive ahora en la landing del test, que es donde tiene sentido.
 *
 * Si `videoGuid` está vacío (Adrián todavía no ha grabado la VSL) la página NO se
 * rompe: oculta el reproductor y mantiene el resto del funnel funcionando.
 *
 * Brandkit: base monocromo B&W + verde de acento (#22C55E), Inter Tight / Inter.
 */
type Props = {
  videoGuid?: string
  bunnyLibraryId?: string
  calendlyUrl?: string
  emailDelayMinutes?: number
  /** Prefill del Calendly. Se resuelve en el server desde el slug, nunca por query string. */
  leadName?: string
  leadEmail?: string
}

export function TestPersonalidadThankYou({
  videoGuid,
  bunnyLibraryId,
  calendlyUrl,
  emailDelayMinutes,
  leadName,
  leadEmail,
}: Props = {}) {
  const router = useRouter()
  const calendlyRef = useRef<HTMLDivElement>(null)
  const [calendlyReady, setCalendlyReady] = useState(false)
  const [calendlyHeight, setCalendlyHeight] = useState(720)

  const guid = videoGuid || FUNNEL_TEST_PERSONALIDAD.VIDEO_GUID
  const libraryId = bunnyLibraryId || FUNNEL_TEST_PERSONALIDAD.BUNNY_LIBRARY_ID
  const minutos = emailDelayMinutes ?? FUNNEL_TEST_PERSONALIDAD.EMAIL_DELAY_MINUTES

  const widgetUrl = (() => {
    const u = new URL(calendlyUrl || FUNNEL_TEST_PERSONALIDAD.CALENDLY_URL)
    u.searchParams.set("hide_gdpr_banner", "1")
    if (leadName) u.searchParams.set("name", leadName)
    if (leadEmail) u.searchParams.set("email", leadEmail)
    return u.toString()
  })()

  // Carga del widget de Calendly (mismo patrón verificado en /reservar)
  useEffect(() => {
    const SRC = "https://assets.calendly.com/assets/external/widget.js"
    function init() {
      const w = window as unknown as {
        Calendly?: { initInlineWidget: (o: { url: string; parentElement: HTMLElement }) => void }
      }
      if (w.Calendly && calendlyRef.current) {
        calendlyRef.current.innerHTML = ""
        w.Calendly.initInlineWidget({ url: widgetUrl, parentElement: calendlyRef.current })
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
    // Si por lo que sea no llega page_height, no dejar el loader colgado
    const t = setTimeout(() => setCalendlyReady(true), 6000)
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
      if (data?.event === "calendly.page_height" && data.payload?.height) {
        const h = parseInt(data.payload.height, 10)
        if (!Number.isNaN(h) && h > 300) {
          setCalendlyHeight(h)
          setCalendlyReady(true)
        }
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [router])

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Acento verde sutil, coherente con el resto del funnel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(640px 360px at 88% -6%, rgba(34,197,94,0.10), transparent 68%)" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-5 md:px-8">
        {/* Marca */}
        <header className="pt-8 md:pt-12">
          <span
            className="text-sm font-semibold uppercase tracking-[0.15em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Capital Hub
          </span>
        </header>

        {/* Aviso del email */}
        <div className="pt-10 md:pt-14">
          <div className="mb-5 inline-flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#22C55E]" />
            <span className="text-[13px] text-[#9CA3AF]">Ya estás dentro</span>
          </div>

          <h1
            className="mb-4 text-3xl font-medium leading-[1.12] tracking-tight text-white md:text-4xl"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Tu test llega a tu correo en {minutos} minutos.
          </h1>
          <p className="mb-3 max-w-xl text-base leading-relaxed text-[#D1D5DB] md:text-lg">
            Mientras tanto, mira este vídeo. Es lo que te va a ayudar a entender qué hacer con tu
            resultado cuando lo tengas.
          </p>
          <p className="mb-9 text-[13px] text-[#6B7280]">
            Si no te llega, revisa la carpeta de spam.
          </p>
        </div>

        {/* VSL de Adrián. Si todavía no hay vídeo, no se pinta nada y el funnel sigue vivo. */}
        {guid ? (
          <div className="mb-10 overflow-hidden rounded-lg border border-[#2A2D34] bg-black">
            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                src={bunnyEmbedUrl(guid, libraryId)}
                loading="lazy"
                title="Vídeo de Adrián Villanueva"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        ) : null}

        {/* Calendly embebido, visible desde el principio */}
        <div className="mb-6">
          <h2
            className="mb-2 text-xl font-medium tracking-tight text-white md:text-2xl"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            ¿Quieres que lo veamos juntos?
          </h2>
          <p className="mb-5 max-w-xl text-[15px] leading-relaxed text-[#9CA3AF]">
            Reserva una sesión de orientación de 15 minutos. Es gratis y te decimos qué profesión
            digital encaja de verdad contigo.
          </p>
        </div>

        <div className="relative mb-14 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/40 ring-1 ring-white/10">
          {!calendlyReady && (
            <div className="absolute inset-0 z-10">
              <LoadingScreen fullscreen={false} className="absolute inset-0" />
            </div>
          )}
          <div ref={calendlyRef} style={{ minWidth: 320, height: calendlyHeight }} />
        </div>

        <footer className="pb-8 text-[13px] text-[#6B7280]">
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>
    </main>
  )
}
