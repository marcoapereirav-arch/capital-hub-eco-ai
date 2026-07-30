"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Play } from "lucide-react"
import { zonedDateTimeToMs } from "./tiempo"

/**
 * KIT DE PÁGINAS PÚBLICAS DE CAPITAL HUB.
 *
 * Es el estilo base de TODAS las páginas públicas que hagamos a partir del 2026-07-30
 * (orden de Marco: "todas las páginas que vayamos diseñando tienen que tener este
 * estilo"). Landing de la clase en directo y su página de gracias ya salen de aquí, y
 * la siguiente página que se cree debe salir también de aquí, no copiando estilos a mano.
 *
 * BRANDKIT (ley, `docs/sops/marketing/brand/01-brandkit-oficial.md`):
 *  - Fondo carbón #0F0F12, hairlines #2A2D34, texto #F5F6F7.
 *  - Acento: SOLO el verde oficial #22C55E / #4ADE80. Nada de inventar otro color,
 *    aunque se pida en el chat: primero se avisa, y por defecto manda el brandkit.
 *  - Tipografía: Inter Tight. La jerarquía se hace con GROSOR (300 a 900), no con
 *    fuentes distintas.
 *  - Sin rejilla de fondo. Sin emojis. Sin guion largo.
 */

export const ACENTO = {
  solido: "#22C55E",
  claro: "#4ADE80",
  tinta: "#08130C",
  rgb: "34, 197, 94",
} as const

/* ─────────────── Estilos compartidos ─────────────── */
export function FunnelStyles() {
  return (
    <style>{`
      /* Acento VERDE OFICIAL del brandkit. Prohibido inventar colores fuera de estos. */
      .fk-root {
        --px: 0; --py: 0;
        --acc: ${ACENTO.solido};
        --acc-2: ${ACENTO.claro};
        --acc-ink: ${ACENTO.tinta};
        --acc-rgb: ${ACENTO.rgb};
      }

      /* Capas de color del fondo: se mueven con el puntero (parallax). */
      .fk-layer, .fk-orb { position: absolute; pointer-events: none; z-index: 0; will-change: transform; transition: transform 0.3s cubic-bezier(0.22,0.61,0.36,1); }
      .fk-glow-a { inset: 0; background: radial-gradient(820px 460px at 78% -6%, rgba(var(--acc-rgb),0.20), transparent 66%); transform: translate3d(calc(var(--px) * -8px), calc(var(--py) * -8px), 0); }
      .fk-glow-b { inset: 0; background: radial-gradient(900px 520px at 18% 4%, rgba(245,246,247,0.06), transparent 68%); transform: translate3d(calc(var(--px) * -4px), calc(var(--py) * -4px), 0); }
      .fk-orb { border-radius: 9999px; filter: blur(48px); opacity: 0.6; }
      .fk-orb-1 { width: 340px; height: 340px; top: 4%; right: -70px; background: radial-gradient(circle, rgba(var(--acc-rgb),0.55), transparent 70%); transform: translate3d(calc(var(--px) * -26px), calc(var(--py) * -26px), 0); animation: fk-float1 11s ease-in-out infinite; }
      .fk-orb-2 { width: 280px; height: 280px; bottom: 4%; left: -60px; background: radial-gradient(circle, rgba(74,222,128,0.24), transparent 70%); transform: translate3d(calc(var(--px) * -18px), calc(var(--py) * -18px), 0); animation: fk-float2 13s ease-in-out infinite; }
      .fk-orb-3 { width: 200px; height: 200px; top: 46%; left: 22%; background: radial-gradient(circle, rgba(245,246,247,0.07), transparent 70%); transform: translate3d(calc(var(--px) * -34px), calc(var(--py) * -34px), 0); animation: fk-float1 16s ease-in-out infinite; }
      @keyframes fk-float1 { 0%,100% { margin-top: 0; } 50% { margin-top: -22px; } }
      @keyframes fk-float2 { 0%,100% { margin-top: 0; } 50% { margin-top: 20px; } }
      .fk-grain { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
      .fk-vignette { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(130% 120% at 50% 0%, transparent 58%, rgba(0,0,0,0.55) 100%); }

      /* Titular: leve inclinación 3D + palabras clave en verde de marca */
      .fk-tilt { transform-style: preserve-3d; perspective: 1000px; transform: rotateX(calc(var(--py) * -2deg)) rotateY(calc(var(--px) * 3deg)); transform-origin: 20% 50%; transition: transform 0.3s cubic-bezier(0.22,0.61,0.36,1); }
      .fk-key { font-weight: 900; color: var(--acc-2); }

      /* Motif del marcador: subrayado a mano alzada sobre el dato clave */
      .fk-mark { position: relative; color: var(--acc-2); font-weight: 700; }
      .fk-mark::after { content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 2px; background: linear-gradient(90deg, transparent, var(--acc), transparent); transform: scaleX(0); transform-origin: left; animation: fk-underline 0.9s cubic-bezier(0.22,0.61,0.36,1) 1.1s forwards; }
      @keyframes fk-underline { to { transform: scaleX(1); } }

      /* Cuenta atrás */
      .fk-count { border: 1px solid rgba(var(--acc-rgb),0.28); background: linear-gradient(180deg, rgba(var(--acc-rgb),0.10), rgba(20,20,24,0.9)); box-shadow: 0 12px 34px -22px rgba(var(--acc-rgb),0.9); }
      .fk-count-glow { position: absolute; inset: 0; background: radial-gradient(120% 80% at 50% 0%, rgba(var(--acc-rgb),0.24), transparent 70%); }
      .fk-count-tick { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--acc-2), transparent); animation: fk-tick 1s steps(1,end) infinite; }
      @keyframes fk-tick { 0%,49% { opacity: 1; } 50%,100% { opacity: 0.15; } }

      /* Tarjeta (formulario, bloques destacados) */
      .fk-card { position: relative; overflow: hidden; border: 1px solid rgba(var(--acc-rgb),0.30); background: linear-gradient(180deg, #17181C 0%, #101013 100%); box-shadow: 0 30px 80px -40px rgba(var(--acc-rgb),0.95), 0 0 0 1px rgba(255,255,255,0.02) inset; }
      .fk-card-glow { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(420px 200px at 50% -10%, rgba(var(--acc-rgb),0.22), transparent 70%); }

      /* Entradas */
      .fk-load { opacity: 0; transform: translateY(14px); animation: fk-load 0.7s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes fk-load { to { opacity: 1; transform: translateY(0); } }
      .fk-line { opacity: 0; transform: translateY(18px); animation: fk-line 0.8s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes fk-line { to { opacity: 1; transform: translateY(0); } }
      .fk-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s cubic-bezier(0.22,0.61,0.36,1), transform 0.7s cubic-bezier(0.22,0.61,0.36,1); }
      .fk-reveal.fk-in { opacity: 1; transform: translateY(0); }

      .fk-dot { display:inline-block; width:7px; height:7px; border-radius:9999px; background:var(--acc-2); box-shadow:0 0 0 0 rgba(var(--acc-rgb),0.6); animation: fk-pulse 2.4s ease-out infinite; }
      @keyframes fk-pulse { 0%{box-shadow:0 0 0 0 rgba(var(--acc-rgb),0.55)} 70%{box-shadow:0 0 0 7px rgba(var(--acc-rgb),0)} 100%{box-shadow:0 0 0 0 rgba(var(--acc-rgb),0)} }

      /* Botones: verde oficial con barrido de brillo */
      .fk-cta { background: var(--acc); color: var(--acc-ink); box-shadow: 0 16px 44px -18px rgba(var(--acc-rgb),0.95); transition: transform 0.25s cubic-bezier(0.22,0.61,0.36,1), box-shadow 0.25s ease; will-change: transform; }
      .fk-cta:hover { box-shadow: 0 22px 56px -16px rgba(var(--acc-rgb),1); }
      .fk-shine { position:absolute; inset:0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%); transform: translateX(-120%); animation: fk-shine 2.8s ease-in-out 0.4s infinite; }
      @keyframes fk-shine { 0%{transform:translateX(-120%)} 45%,100%{transform:translateX(120%)} }

      /* Vídeo */
      .fk-video { position: relative; width: 100%; aspect-ratio: 16 / 9; box-shadow: 0 30px 90px -50px rgba(var(--acc-rgb),0.9); }
      .fk-video-glow { position: absolute; inset: -1px; border-radius: 1rem; pointer-events: none; z-index: 1; background: radial-gradient(600px 220px at 50% 0%, rgba(var(--acc-rgb),0.20), transparent 70%); }

      @media (prefers-reduced-motion: reduce) {
        .fk-load, .fk-line, .fk-reveal, .fk-orb, .fk-grain, .fk-dot, .fk-mark::after, .fk-shine, .fk-count-tick { animation: none !important; transition: none !important; }
        .fk-load, .fk-line, .fk-reveal { opacity: 1 !important; transform: none !important; }
        .fk-layer, .fk-orb, .fk-tilt { transform: none !important; }
      }
    `}</style>
  )
}

/* ─────────────── Fondo con capas ─────────────── */
export function FunnelBackdrop() {
  return (
    <>
      <div aria-hidden className="fk-layer fk-glow-a" />
      <div aria-hidden className="fk-layer fk-glow-b" />
      <div aria-hidden className="fk-orb fk-orb-1" />
      <div aria-hidden className="fk-orb fk-orb-2" />
      <div aria-hidden className="fk-orb fk-orb-3" />
      <div aria-hidden className="fk-grain" />
      <div aria-hidden className="fk-vignette" />
    </>
  )
}

/** Parallax del fondo por puntero. Solo escritorio y respetando reduce-motion. */
export function useParallax(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
        el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
      })
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [ref])
}

/** Reveals al hacer scroll sobre cualquier elemento con `data-reveal`. */
export function useScrollReveals() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("fk-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("fk-in")
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.16 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ─────────────── Marca de cabecera ─────────────── */
export function FunnelHeader({ enDirecto = true }: { enDirecto?: boolean }) {
  return (
    <header className="fk-load flex items-center justify-between py-6 md:py-8" style={{ animationDelay: "0ms" }}>
      <span
        className="text-sm font-bold uppercase tracking-[0.15em] text-[#F5F6F7]"
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        Capital Hub
      </span>
      {enDirecto && (
        <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#4ADE80]">
          <span className="fk-dot" /> En directo
        </span>
      )}
    </header>
  )
}

/* ─────────────── Etiqueta de sección numerada ─────────────── */
export function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-7 flex items-center justify-center gap-4">
      <div className="h-px w-14 bg-[#2A2D34]" />
      <span className="text-[13px] text-[#8A8F99]">
        <span className="font-extrabold text-[#4ADE80]">{n}</span> · {title}
      </span>
      <div className="h-px w-14 bg-[#2A2D34]" />
    </div>
  )
}

/* ─────────────── Cuenta atrás ─────────────── */
export function Countdown({
  isoDate,
  time,
  timeZone,
  label = "Empieza en",
  labelEmpezado = "Ya empezó",
  align = "left",
}: {
  isoDate: string
  time: string
  timeZone: string
  label?: string
  labelEmpezado?: string
  align?: "left" | "center"
}) {
  // Arranca vacía y se rellena ya en el navegador: así el HTML del servidor y el del
  // cliente coinciden siempre (nada de parpadeos ni avisos de hidratación).
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    const target = zonedDateTimeToMs(isoDate, time, timeZone)
    if (target == null) return
    const tick = () => setLeft(Math.max(0, target - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isoDate, time, timeZone])

  const empezado = left !== null && left <= 0
  const sec = left === null ? null : Math.floor(left / 1000)
  const units: { value: number | null; label: string }[] = [
    { value: sec === null ? null : Math.floor(sec / 86400), label: "días" },
    { value: sec === null ? null : Math.floor((sec % 86400) / 3600), label: "horas" },
    { value: sec === null ? null : Math.floor((sec % 3600) / 60), label: "min" },
    { value: sec === null ? null : sec % 60, label: "seg" },
  ]

  return (
    <div className={align === "center" ? "flex flex-col items-center" : undefined}>
      <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8A8F99]">
        {empezado ? labelEmpezado : label}
      </p>
      <div className="grid w-full max-w-md grid-cols-4 gap-2.5 md:gap-3">
        {units.map((u, i) => (
          <div key={u.label} className="fk-count relative overflow-hidden rounded-xl px-1 py-3 text-center md:py-4">
            <span aria-hidden className="fk-count-glow" />
            <span
              className="relative z-10 block tabular-nums text-white"
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.5rem, 6.2vw, 2.5rem)",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {u.value === null ? "--" : String(u.value).padStart(2, "0")}
            </span>
            <span className="relative z-10 mt-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-[#4ADE80] md:text-[11px]">
              {u.label}
            </span>
            {i === 3 && !empezado && <span aria-hidden className="fk-count-tick" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────── Botón principal (magnético) ─────────────── */
export function CtaButton({
  children,
  onClick,
  href,
  icon,
  target,
  rel,
  full = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  icon?: React.ReactNode
  target?: string
  rel?: string
  full?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    el.style.transform = `translate(${x * 0.16}px, ${y * 0.2}px)`
  }
  function reset() {
    if (ref.current) ref.current.style.transform = "translate(0,0)"
  }

  const cls = `fk-cta group relative inline-flex ${full ? "w-full h-16 text-base" : "h-[54px] px-7 text-[15px]"} items-center justify-center gap-2.5 overflow-hidden rounded-xl font-extrabold`
  const inner = (
    <>
      <span aria-hidden className="fk-shine" />
      {icon && <span className="relative z-10 flex items-center">{icon}</span>}
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </>
  )

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={cls}
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        {inner}
      </a>
    )
  }
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cls}
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      {inner}
    </button>
  )
}

/* ─────────────── Marco del vídeo (Bunny) ─────────────── */
export function VideoFrame({
  embedUrl,
  title,
  textoVacio = "El vídeo se está preparando",
  subtextoVacio = "En un momento estará aquí.",
}: {
  embedUrl?: string
  title: string
  textoVacio?: string
  subtextoVacio?: string
}) {
  return (
    <div className="fk-video overflow-hidden rounded-2xl border border-[#22C55E]/25 bg-black">
      <div aria-hidden className="fk-video-glow" />
      {embedUrl ? (
        <iframe
          src={embedUrl}
          loading="lazy"
          title={title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#141418] px-5 text-center">
          <span
            aria-hidden
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[#22C55E]/50 bg-[#22C55E]/15"
          >
            <Play className="ml-0.5 h-6 w-6 text-[#4ADE80]" fill="currentColor" />
          </span>
          <p className="text-[15px] font-bold text-[#F5F6F7]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            {textoVacio}
          </p>
          <p className="max-w-xs text-[12px] leading-snug text-[#8A8F99]">{subtextoVacio}</p>
        </div>
      )}
    </div>
  )
}
