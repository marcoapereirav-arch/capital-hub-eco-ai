"use client"

import { useEffect, useRef } from "react"
import { MessageCircle, CalendarClock, CheckCircle2, Clock, Sparkles, ArrowRight } from "lucide-react"
import { FUNNEL_WEBINAR } from "../config"

/**
 * Página de Gracias del Funnel Webinar.
 * Brandkit Capital Hub: base monocromo B&W + verde de acento (#22C55E).
 *
 * Objetivo único: entregarle su ACCESO al grupo de WhatsApp (donde se suelta el link
 * del Zoom del directo). Al entrar, un efecto de celebración (confeti) para que sienta
 * que tomó una buena decisión y lo estamos felicitando. Recordatorio con día y hora
 * para que reserve el hueco.
 *
 * El link del grupo llega por props desde el server (editable en /webs). Si aún no está
 * puesto, el botón muestra un estado de espera en vez de romper.
 */
type Props = {
  whatsappGroup?: string
  dateLabel?: string
}

export function WebinarThankYou({ whatsappGroup, dateLabel }: Props = {}) {
  const groupUrl = (whatsappGroup || FUNNEL_WEBINAR.WHATSAPP_GROUP_URL).trim()
  const resolvedDate = dateLabel || FUNNEL_WEBINAR.WEBINAR_DATE_LABEL
  const hasGroup = groupUrl.length > 0
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
          <div className="wbt-pop mb-6 inline-flex items-center gap-2 self-start rounded-full border border-[#22C55E]/40 bg-[#22C55E]/10 px-3.5 py-1.5">
            <Sparkles className="h-4 w-4 text-[#22C55E]" />
            <span className="text-[13px] font-medium text-[#4ADE80]">Plaza confirmada. Buena decisión.</span>
          </div>

          <h1
            className="wbt-rise mb-4 text-[2rem] font-medium leading-[1.1] tracking-tight text-white md:text-[2.6rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Ya tienes tu acceso al grupo de WhatsApp.
          </h1>
          <p className="wbt-rise mb-8 max-w-lg text-base leading-relaxed text-[#C7CBD1] md:text-lg" style={{ animationDelay: "80ms" }}>
            Es tu sala de embarque. Ahí dentro te damos el <strong className="text-white">link del Zoom</strong> del
            directo y todos los avisos. Entra ahora y lo dejas listo.
          </p>

          {/* CTA principal: entrar al grupo (grande y llamativo) */}
          {hasGroup ? (
            <a
              href={groupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="wbt-cta group relative mb-4 flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-none bg-[#22C55E] px-6 text-lg font-semibold text-[#08130C]"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              <span aria-hidden className="wbt-cta-shine" />
              <MessageCircle className="relative z-10 h-6 w-6" />
              <span className="relative z-10">Entrar al grupo de WhatsApp</span>
              <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          ) : (
            <div
              className="mb-4 flex h-16 w-full items-center justify-center gap-2.5 rounded-none border border-[#3F3F46] bg-[#18181B] px-6 text-base font-semibold text-[#9CA3AF]"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              <Clock className="h-5 w-5 text-[#22C55E]" />
              <span>El grupo se abre en breve</span>
            </div>
          )}
          <p className="mb-9 text-center text-[13px] text-[#6B7280]">
            {hasGroup
              ? "Se abre WhatsApp en una pestaña nueva. Pulsa «Unirse al grupo» y ya estás dentro."
              : "Te avisamos por email en cuanto el grupo esté abierto. También lo verás aquí."}
          </p>

          {/* Recordatorio de la cita */}
          <div className="wbt-rise rounded-lg border border-[#2A2D34] bg-[#141418] p-5 md:p-6" style={{ animationDelay: "160ms" }}>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10">
                <CalendarClock className="h-[18px] w-[18px] text-[#22C55E]" />
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
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
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
