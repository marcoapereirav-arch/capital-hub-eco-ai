"use client"

import { useEffect, useRef } from "react"
import { CalendarClock, CheckCircle2, BadgeCheck, ArrowRight } from "lucide-react"
import { FUNNEL_WEBINAR, whatsappLink, webinarDateTimeLabel } from "../config"

/** Logo oficial de WhatsApp (glyph monocromo, hereda el color con currentColor). */
function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
  )
}

/**
 * Página de Gracias de la Clase gratuita en directo (funnel `webinar`).
 * Acento VERDE oficial del brandkit (#22C55E / #4ADE80), igual que la landing.
 *
 * Objetivo único (reunión 24-jul-2026): que el lead ESCRIBA a Adrián por WhatsApp para
 * conseguir su entrada al evento. El botón abre WhatsApp con el mensaje ya escrito; el
 * lead solo pulsa enviar. Ese envío es el punto de éxito del funnel: a partir de ahí el
 * equipo hace el setting manual (fuera de este funnel). Confeti de celebración al entrar
 * y recordatorio con la fecha del directo.
 *
 * El número y el mensaje llegan por props desde el server (editables en /webs). Siempre
 * hay un default, así que el botón nunca se queda sin destino.
 */
type Props = {
  whatsappNumber?: string
  whatsappMessage?: string
  dateLabel?: string
  /** Slug opaco del contacto (lo pone el opt-in). Sirve para marcar quién tocó WhatsApp. */
  slug?: string
}

export function WebinarThankYou({ whatsappNumber, whatsappMessage, dateLabel, slug }: Props = {}) {
  const waUrl = whatsappLink(
    whatsappNumber || FUNNEL_WEBINAR.WHATSAPP_NUMBER,
    whatsappMessage || FUNNEL_WEBINAR.WHATSAPP_MESSAGE,
  )
  const resolvedDate = dateLabel || webinarDateTimeLabel()
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

    const W = () => window.innerWidth
    const colors = ["#22C55E", "#4ADE80", "#F5F6F7", "#9CA3AF", "#FFFFFF"]
    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string; rot: number; vr: number; life: number }
    const parts: P[] = []
    const cx = W() / 2
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
      className="relative min-h-[100dvh] overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Atmósfera */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(760px 420px at 50% -8%, rgba(34,197,94,0.16), transparent 66%)" }}
      />
      {/* Confeti */}
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-20" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-xl flex-col px-5 py-10 md:px-8 md:py-16">
        <div className="mb-10 md:mb-14">
          <span
            className="text-sm font-semibold uppercase tracking-[0.15em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Capital Hub
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          {/* Sello de felicitación */}
          <div className="wbt-pop mb-6 inline-flex items-center gap-2 self-start rounded-full border border-[#22C55E]/45 bg-[#22C55E]/12 px-3.5 py-1.5">
            <BadgeCheck className="h-4 w-4 text-[#4ADE80]" />
            <span className="text-[13px] font-bold text-[#4ADE80]">Plaza confirmada. Buena decisión.</span>
          </div>

          <h1
            className="wbt-rise mb-4 text-[2rem] font-extrabold leading-[1.06] tracking-[-0.02em] text-white md:text-[2.6rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Último paso: escríbenos por WhatsApp para conseguir tu entrada.
          </h1>
          <p className="wbt-rise mb-8 max-w-lg text-base leading-relaxed text-[#C7CBD1] md:text-lg" style={{ animationDelay: "80ms" }}>
            Pulsa el botón y se abre tu WhatsApp con el mensaje ya escrito. Solo tienes que
            <strong className="text-white"> enviarlo</strong> y te damos tu acceso al directo. Te respondemos en persona.
          </p>

          {/* CTA principal: escribir por WhatsApp privado con el mensaje predefinido.
              Su envío es el punto de éxito del funnel (reunión 24-jul-2026). */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsappClick}
            className="wbt-cta group relative mb-4 flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-none bg-[#22C55E] px-6 text-lg font-semibold text-[#08130C]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            <span aria-hidden className="wbt-cta-shine" />
            <WhatsappIcon className="relative z-10 h-6 w-6" />
            <span className="relative z-10">Conseguir mi entrada por WhatsApp</span>
            <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <p className="mb-9 text-center text-[13px] text-[#6B7280]">
            Se abre WhatsApp con el mensaje listo. Solo pulsa enviar.
          </p>

          {/* Recordatorio de la cita */}
          <div className="wbt-rise rounded-lg border border-[#2A2D34] bg-[#141418] p-5 md:p-6" style={{ animationDelay: "160ms" }}>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#22C55E]/35 bg-[#22C55E]/12">
                <CalendarClock className="h-[18px] w-[18px] text-[#4ADE80]" />
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-wide text-[#9CA3AF]">Reserva este hueco</p>
                <p className="text-base font-semibold text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                  {resolvedDate}
                </p>
              </div>
            </div>
            <ul className="space-y-2.5 pt-1">
              {[
                "Guárdalo en tu agenda ahora, para que no se te pase.",
                "Reserva ese rato sin distracciones. Móvil en silencio.",
                "Ven con ganas: es tu punto de partida.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-sm text-[#D1D5DB] leading-relaxed">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="pt-10 text-[13px] text-[#6B7280]">
          Capital Hub · Adrián Villanueva
        </footer>
      </div>

      <style>{`
        .wbt-pop { opacity: 0; transform: scale(0.9); animation: wbt-pop 0.5s cubic-bezier(0.22,0.61,0.36,1) 0.1s forwards; }
        @keyframes wbt-pop { to { opacity: 1; transform: scale(1); } }
        .wbt-rise { opacity: 0; transform: translateY(16px); animation: wbt-rise 0.7s cubic-bezier(0.22,0.61,0.36,1) 0.15s forwards; }
        @keyframes wbt-rise { to { opacity: 1; transform: translateY(0); } }
        .wbt-cta { box-shadow: 0 10px 40px -12px rgba(34,197,94,0.6); transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .wbt-cta:hover { transform: translateY(-2px); box-shadow: 0 16px 50px -10px rgba(34,197,94,0.75); }
        .wbt-cta-shine { position: absolute; inset: 0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%); transform: translateX(-120%); animation: wbt-shine 2.6s ease-in-out 0.6s infinite; }
        @keyframes wbt-shine { 0% { transform: translateX(-120%); } 45%,100% { transform: translateX(120%); } }
        @media (prefers-reduced-motion: reduce) {
          .wbt-pop, .wbt-rise, .wbt-cta-shine { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </main>
  )
}
