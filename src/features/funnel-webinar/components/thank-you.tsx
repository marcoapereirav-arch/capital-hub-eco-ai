"use client"

import { useEffect, useRef } from "react"
import { CalendarClock, CheckCircle2, BadgeCheck } from "lucide-react"
import { FUNNEL_WEBINAR, WEBINAR_TZ, whatsappLink, webinarDateTimeLabel } from "../config"
import {
  FunnelStyles, FunnelBackdrop, FunnelHeader, SectionLabel, Countdown, CtaButton, VideoFrame,
  useParallax, useScrollReveals,
} from "@/features/public-pages/kit/funnel-kit"

/** Logo oficial de WhatsApp (glyph monocromo, hereda el color con currentColor). */
function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
  )
}

/**
 * Página de GRACIAS (post-registro) de la Clase gratuita en directo.
 *
 * Misma vibra que la landing: sale del mismo kit (`features/public-pages/kit`), mismo
 * fondo con capas, misma tipografía por grosor, mismo verde oficial del brandkit y la
 * misma cuenta atrás. El único verde que NO es acento nuestro es el del botón de
 * WhatsApp: ahí el verde ES WhatsApp.
 *
 * Orden de la página (Marco, 2026-07-30):
 *   1. Plaza confirmada + fecha del directo.
 *   2. EL VÍDEO. Aquí es donde va, no en la landing. GUID editable en el ⚙️ de /webs.
 *   3. Botón a WhatsApp privado de Adrián con el mensaje ya escrito. Ese envío es el
 *      punto de éxito del funnel (reunión 24-jul-2026): al tocarlo se le pone el tag
 *      `whatsapp-webinar-DD_MM_YYYY` y un evento en su timeline.
 *   4. Cuenta atrás + recordatorio para que reserve el hueco.
 *
 * Número, mensaje y GUID llegan por props desde el server (editables en /webs). Siempre
 * hay un default, así que el botón nunca se queda sin destino.
 */
type Props = {
  whatsappNumber?: string
  whatsappMessage?: string
  dateLabel?: string
  webinarDate?: string
  webinarTime?: string
  videoGuid?: string
  bunnyLibraryId?: string
  /** Slug opaco del contacto (lo pone el opt-in). Sirve para marcar quién tocó WhatsApp. */
  slug?: string
}

export function WebinarThankYou({
  whatsappNumber, whatsappMessage, dateLabel,
  webinarDate, webinarTime, videoGuid, bunnyLibraryId, slug,
}: Props = {}) {
  const waUrl = whatsappLink(
    whatsappNumber || FUNNEL_WEBINAR.WHATSAPP_NUMBER,
    whatsappMessage || FUNNEL_WEBINAR.WHATSAPP_MESSAGE,
  )
  const fecha = webinarDate || FUNNEL_WEBINAR.WEBINAR_DATE
  const hora = webinarTime || FUNNEL_WEBINAR.WEBINAR_TIME
  const resolvedDate = dateLabel || webinarDateTimeLabel(fecha, hora)

  const rootRef = useRef<HTMLElement>(null)
  useParallax(rootRef)
  useScrollReveals()

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Al tocar el botón de WhatsApp marcamos al contacto (tag + evento en su timeline).
  // sendBeacon se envía aunque el navegador salte a WhatsApp en el mismo instante.
  function onWhatsappClick() {
    if (!slug) return
    try {
      navigator.sendBeacon(`/api/funnel/webinar/whatsapp-click?c=${encodeURIComponent(slug)}`)
    } catch {
      // No bloquea nunca la apertura de WhatsApp.
    }
  }

  // Confeti de celebración (una ráfaga al montar). Colores del brandkit. Respeta reduce-motion.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const colors = ["#22C55E", "#4ADE80", "#F5F6F7", "#9CA3AF", "#FFFFFF"]
    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string; rot: number; vr: number; life: number }
    const parts: P[] = []
    const cx = window.innerWidth / 2
    // Dos focos (esquinas del centro) para una ráfaga tipo "cañón"
    for (let i = 0; i < 140; i++) {
      const fromLeft = i % 2 === 0
      const originX = fromLeft ? cx - 60 : cx + 60
      const angle = (fromLeft ? -1 : 1) * (Math.PI / 3.2) + (Math.random() - 0.5) * 0.9
      const speed = 8 + Math.random() * 9
      parts.push({
        x: originX,
        y: 190,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed - Math.random() * 3,
        r: 4 + Math.random() * 5,
        c: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        life: 0,
      })
    }

    let raf = 0
    const gravity = 0.28
    const maxLife = 220
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of parts) {
        if (p.life > maxLife) continue
        alive = true
        p.life++
        p.vy += gravity
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        const fade = Math.max(0, 1 - p.life / maxLife)
        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6)
        ctx.restore()
      }
      if (alive) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <main
      ref={rootRef}
      className="fk-root relative min-h-[100svh] overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <FunnelStyles />
      <FunnelBackdrop />
      {/* Confeti */}
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-20" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-20 md:px-8">
        <FunnelHeader />

        {/* ── 1. Confirmación ── */}
        <div className="flex flex-col items-center pt-4 text-center md:pt-8">
          <div
            className="fk-load inline-flex items-center gap-2 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/12 px-3.5 py-1.5"
            style={{ animationDelay: "60ms" }}
          >
            <BadgeCheck className="h-4 w-4 text-[#4ADE80]" />
            <span
              className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#4ADE80] md:text-[13px]"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Plaza confirmada
            </span>
          </div>

          <p
            className="fk-load mt-3 text-[15px] font-bold text-white md:text-[17px]"
            style={{ fontFamily: "'Inter Tight', sans-serif", animationDelay: "120ms" }}
          >
            {resolvedDate}
          </p>

          <h1
            className="fk-tilt mt-5 max-w-[20ch] text-white [text-wrap:balance]"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: "clamp(1.75rem, 5.4vw, 3.1rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.028em",
              fontWeight: 300,
            }}
          >
            <span className="fk-line block" style={{ animationDelay: "180ms" }}>
              Mira este <span className="fk-key">vídeo</span> antes de la clase.
            </span>
          </h1>

          <p
            className="fk-load mt-5 max-w-xl text-[15px] leading-relaxed text-[#C7CBD1] md:text-[17px]"
            style={{ animationDelay: "300ms" }}
          >
            Dura poco y te cuenta cómo aprovechar el directo. Cuando lo termines, escríbenos por
            WhatsApp con el botón de abajo y te damos tu entrada.
          </p>
        </div>

        {/* ── 2. EL VÍDEO (aquí es donde va, no en la landing) ── */}
        <div className="fk-load mt-9" style={{ animationDelay: "380ms" }}>
          <VideoFrame
            guid={videoGuid}
            libraryId={bunnyLibraryId || FUNNEL_WEBINAR.BUNNY_LIBRARY_ID}
            title="Vídeo post registro · Clase en directo · Capital Hub"
            subtextoVacio="En un momento estará aquí. Mientras tanto, escríbenos por WhatsApp justo debajo."
          />
        </div>

        {/* ── 3. WhatsApp: el punto de éxito del funnel ── */}
        <div className="mt-9 flex flex-col items-center">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsappClick}
            className="wa-cta group relative flex h-16 w-full max-w-lg items-center justify-center gap-3 overflow-hidden rounded-xl px-6 text-base font-extrabold text-[#08130C] md:text-lg"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            <span aria-hidden className="fk-shine" />
            <WhatsappIcon className="relative z-10 h-6 w-6" />
            <span className="relative z-10">Conseguir mi entrada por WhatsApp</span>
          </a>
          <p className="mt-3 text-center text-[13px] text-[#8A8F99]">
            Se abre WhatsApp con el mensaje listo. Solo pulsa enviar.
          </p>
        </div>

        {/* ── 4. Cuenta atrás + recordatorio ── */}
        <section className="mt-16">
          <SectionLabel n="01" title="Tu cita" />

          <div data-reveal className="fk-reveal flex flex-col items-center">
            <Countdown
              isoDate={fecha}
              time={hora}
              timeZone={WEBINAR_TZ}
              label="Empieza en"
              labelEmpezado="La clase ya empezó"
              align="center"
            />
          </div>

          <div data-reveal className="fk-reveal fk-card mt-8 rounded-2xl p-5 md:p-6">
            <span aria-hidden className="fk-card-glow" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#22C55E]/35 bg-[#22C55E]/12">
                  <CalendarClock className="h-[18px] w-[18px] text-[#4ADE80]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8A8F99]">Reserva este hueco</p>
                  <p className="text-base font-extrabold text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                    {resolvedDate}
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Guárdalo en tu agenda ahora, para que no se te pase.",
                  "Reserva ese rato sin distracciones. Móvil en silencio.",
                  "Ven con ganas: es tu punto de partida.",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-[#D1D5DB]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div data-reveal className="fk-reveal mt-8 flex justify-center">
            <CtaButton href={waUrl} target="_blank" rel="noopener noreferrer" onClick={onWhatsappClick}>
              Escribir por WhatsApp
            </CtaButton>
          </div>
        </section>

        <footer className="mt-16 flex items-center justify-between border-t border-[#1C1D22] pt-7 text-[13px] text-[#6B7280]">
          <span>Capital Hub</span>
          <span>Adrián Villanueva</span>
        </footer>
      </div>

      {/* El botón grande usa el verde de WhatsApp, no nuestro acento de marca. */}
      <style>{`
        .wa-cta { background: #25D366; box-shadow: 0 16px 44px -18px rgba(37,211,102,0.95); transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .wa-cta:hover { transform: translateY(-2px); box-shadow: 0 22px 56px -16px rgba(37,211,102,1); }
        @media (prefers-reduced-motion: reduce) { .wa-cta:hover { transform: none; } }
      `}</style>
    </main>
  )
}
