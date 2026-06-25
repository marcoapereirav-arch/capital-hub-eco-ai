"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, X } from "lucide-react"
import { track } from "@/lib/meta/pixel-client"
import { getStoredUtms } from "@/lib/utm/utm-capture"

/**
 * Landing del Funnel Test Personalidad (test de Equilibria).
 *
 * Dirección de diseño: "instrumento de diagnóstico" — cinematográfico monocromo
 * estilo terminal/IDE. 100% dentro del brandkit Capital Hub:
 *   BG #0F0F12 · hairlines #2A2D34 · texto #F5F6F7 · acento #FFFFFF · sin neón, sin grid.
 *   Inter Tight (display) · Inter (body) · JetBrains Mono (labels técnicos).
 *
 * Motion (WOW dentro del brand): secuencia de entrada escalonada, motif de "4 colores"
 * como ecualizador en grises, count-up de +500.000, CTA magnético, spotlight que sigue
 * el cursor, grano sutil, reveals al scroll. Todo degrada con prefers-reduced-motion.
 *
 * Lógica intacta: opt-in (3 campos obligatorios) → Meta Pixel+CAPI → atribución utm_source.
 */
export function TestPersonalidadLanding() {
  const [open, setOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  // Spotlight que sigue el cursor (desktop, si no hay reduced-motion)
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    let raf = 0
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el!.style.setProperty("--mx", `${e.clientX}px`)
        el!.style.setProperty("--my", `${e.clientY}px`)
      })
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Reveals al scroll (IntersectionObserver sobre [data-reveal])
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("tp-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("tp-in")
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.18 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <main
      ref={mainRef}
      className="tp-root relative min-h-[100dvh] overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <TpStyles />

      {/* Atmósfera: spotlight (cursor) + glow superior + grano + viñeta. Sin grid. */}
      <div aria-hidden className="tp-spotlight" />
      <div aria-hidden className="tp-glow" />
      <div aria-hidden className="tp-grain" />
      <div aria-hidden className="tp-vignette" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-5 md:px-8">
        {/* Marca */}
        <header className="tp-load flex items-center justify-between pt-8 md:pt-12" style={{ animationDelay: "0ms" }}>
          <span
            className="text-[11px] uppercase tracking-[0.4em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 500 }}
          >
            CAPITAL&nbsp;HUB
          </span>
          <span
            className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#6B7280] sm:inline-flex"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <span className="tp-dot" /> sistema de diagnóstico
          </span>
        </header>

        {/* ───────── SECCIÓN 1 · HERO ───────── */}
        <section className="flex flex-1 flex-col justify-center py-16 md:py-24">
          <p
            className="tp-load mb-7 text-[10px] uppercase tracking-[0.3em] text-[#9CA3AF] md:text-[11px]"
            style={{ fontFamily: "'JetBrains Mono', monospace", animationDelay: "80ms" }}
          >
            Test gratis · 15 minutos ·{" "}
            <span className="text-[#F5F6F7]">
              <CountUp target={500000} prefix="+" /> personas
            </span>
          </p>

          <h1
            className="mb-7 text-[2.05rem] font-medium leading-[1.05] tracking-[-0.02em] text-white md:text-[3.4rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            <span className="tp-line" style={{ animationDelay: "160ms" }}>
              Hay mil formas de vivir de internet.
            </span>
            <span className="tp-line mt-2 block text-[#7B818C]" style={{ animationDelay: "300ms" }}>
              Esta te dice cuál es la tuya.
            </span>
          </h1>

          <p
            className="tp-load mb-9 max-w-xl text-base leading-relaxed text-[#C7CBD1] md:text-lg"
            style={{ animationDelay: "460ms" }}
          >
            Llevas años estudiando algo que no te renta o currando en algo que odias. Existe otra
            vía: una profesión digital con la que vivir bien, sin montar un negocio. El problema es
            que nadie te dice cuál encaja contigo. Este test sí, en 15 minutos. Gratis.
          </p>

          <div className="tp-load" style={{ animationDelay: "600ms" }}>
            <MagneticButton onClick={() => setOpen(true)}>Quiero hacer el test gratis</MagneticButton>
          </div>
        </section>

        {/* Separador con índice de sección */}
        <div className="tp-load flex items-center gap-4" style={{ animationDelay: "720ms" }}>
          <span
            className="text-[10px] uppercase tracking-[0.3em] text-[#4B5159]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            02 — Qué es
          </span>
          <div className="h-px flex-1 bg-[#2A2D34]" />
        </div>

        {/* ───────── SECCIÓN 2 · QUÉ ES ───────── */}
        <section className="py-16 md:py-24">
          <h2
            data-reveal
            className="tp-reveal mb-10 text-2xl font-medium tracking-[-0.01em] text-white md:text-4xl"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Qué es este test
          </h2>

          <div className="mb-12 grid gap-4 md:grid-cols-2">
            <article
              data-reveal
              className="tp-reveal group relative overflow-hidden border border-[#2A2D34] bg-[#141418] p-6 md:p-7"
              style={{ transitionDelay: "60ms" }}
            >
              <span
                className="mb-4 block text-[10px] uppercase tracking-[0.3em] text-[#6B7280]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                01 / Avalado
              </span>
              <p className="text-base leading-relaxed text-[#C7CBD1] md:text-[1.05rem]">
                Es el test de <strong className="font-medium text-white">Equilibria</strong>, el mismo
                que usan grandes multinacionales para colocar a cada persona donde rinde. Lo han hecho
                más de 500.000 personas.
              </p>
              <span aria-hidden className="tp-corner" />
            </article>

            <article
              data-reveal
              className="tp-reveal group relative overflow-hidden border border-[#2A2D34] bg-[#141418] p-6 md:p-7"
              style={{ transitionDelay: "140ms" }}
            >
              <span
                className="mb-4 block text-[10px] uppercase tracking-[0.3em] text-[#6B7280]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                02 / Resultado
              </span>
              <p className="mb-5 text-base leading-relaxed text-[#C7CBD1] md:text-[1.05rem]">
                Te da un resultado en <strong className="font-medium text-white">cuatro colores</strong>{" "}
                con tus fortalezas y tus limitadores. Sabes qué profesión digital va contigo de verdad,
                no la que te suena guay y a los tres meses odias.
              </p>
              <FourColors />
              <span aria-hidden className="tp-corner" />
            </article>
          </div>

          <div data-reveal className="tp-reveal" style={{ transitionDelay: "200ms" }}>
            <MagneticButton onClick={() => setOpen(true)}>Hacer el test gratis</MagneticButton>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="mt-auto flex items-center justify-between border-t border-[#1C1D22] py-7 text-[10px] uppercase tracking-[0.25em] text-[#4B5159]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span>© Capital Hub</span>
          <span>Adrián Villanueva</span>
        </footer>
      </div>

      {open && <OptinModal onClose={() => setOpen(false)} />}
    </main>
  )
}

/* ───────────────────── Botón magnético ───────────────────── */
function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`
  }
  function reset() {
    if (ref.current) ref.current.style.transform = "translate(0,0)"
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="tp-cta group relative inline-flex h-[52px] items-center justify-center gap-2.5 overflow-hidden rounded-none bg-white px-7 text-[15px] font-semibold text-[#0F0F12]"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      <span aria-hidden className="tp-cta-fill" />
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  )
}

/* 4 swatches que se rellenan en secuencia (4 tonos de gris→blanco) */
function FourColors() {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`tp-swatch tp-swatch-${i}`} />
      ))}
    </div>
  )
}

/* ───────────────────── Count-up al entrar en viewport ───────────────────── */
function CountUp({ target, prefix = "" }: { target: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setVal(target)
      return
    }
    let raf = 0
    let started = false
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true
          const dur = 1400
          const t0 = performance.now()
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / dur)
            const eased = 1 - Math.pow(1 - p, 3)
            setVal(Math.round(target * eased))
            if (p < 1) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
          io.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [target])

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("es-ES")}
    </span>
  )
}

/* ───────────────────── Pop-up opt-in (lógica intacta) ───────────────────── */
function OptinModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [loading, onClose])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Pon tu nombre")
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Pon un email válido")
      return
    }
    if (phone.replace(/\D/g, "").length < 6) {
      setError("Pon un teléfono válido")
      return
    }
    setLoading(true)
    try {
      const utmSource = getStoredUtms()?.utm_source
      const res = await fetch("/api/optin/test-personalidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          utm_source: utmSource,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? "Algo salió mal. Inténtalo otra vez.")
        setLoading(false)
        return
      }
      await track({
        event: "test_personalidad_lead",
        standardEvent: "Lead",
        email: email.trim(),
        phone: phone.trim(),
        contentName: "Test Personalidad opt-in",
      }).catch(() => {})
      router.push("/test-personalidad/gracias")
    } catch {
      setError("Sin conexión. Revisa tu internet y vuelve a intentarlo.")
      setLoading(false)
    }
  }

  return (
    <div
      className="tp-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="tp-modal relative max-h-[90dvh] w-full overflow-y-auto border-t border-[#2A2D34] bg-[#0F0F12] px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6 sm:max-w-md sm:rounded-none sm:border sm:p-7"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Asa de bottom-sheet (solo móvil) */}
        <div aria-hidden className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#2A2D34] sm:hidden" />
        <button
          type="button"
          onClick={() => !loading && onClose()}
          disabled={loading}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-[#9CA3AF] transition-colors hover:text-white disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>

        <span
          className="mb-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#6B7280]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="tp-dot" /> acceso al test
        </span>
        <h3
          className="mb-6 pr-8 text-xl font-medium tracking-[-0.01em] text-white md:text-2xl"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Deja tus datos y entra al test
        </h3>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <Field id="fullName" label="Tu nombre" value={fullName} onChange={setFullName} placeholder="Tu nombre" autoComplete="name" disabled={loading} />
          <Field id="email" label="Tu mejor email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" autoComplete="email" disabled={loading} />
          <Field id="phone" label="Tu teléfono" type="tel" value={phone} onChange={setPhone} placeholder="+34 600 00 00 00" autoComplete="tel" disabled={loading} />

          {error && (
            <div className="border-l-2 border-white py-1 pl-3 text-sm text-[#F5F6F7]">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="tp-cta group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-none bg-white text-[15px] font-semibold text-[#0F0F12] transition-opacity disabled:opacity-60"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span aria-hidden className="tp-cta-fill" />
                <span className="relative z-10">Quiero hacer el test gratis</span>
                <ArrowRight className="relative z-10 h-4 w-4" />
              </>
            )}
          </button>

          <p className="pt-1 text-center text-xs text-[#9CA3AF]">
            Te llega tu acceso y entras directo al test. Sin tarjeta, sin compromiso.
          </p>
        </form>
      </div>
    </div>
  )
}

function Field({
  id, label, value, onChange, placeholder, type = "text", autoComplete, disabled,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  placeholder: string; type?: string; autoComplete?: string; disabled?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="h-12 w-full rounded-none border border-[#3F3F46] bg-[#18181B] px-4 text-base text-[#F5F6F7] transition-colors placeholder:text-[#6B7280] focus:border-white focus:outline-none focus:ring-1 focus:ring-white/30"
      />
    </div>
  )
}

/* ───────────────────── Estilos (keyframes + atmósfera + reveals) ───────────────────── */
function TpStyles() {
  return (
    <style>{`
      .tp-root { --mx: 50vw; --my: 30vh; }
      /* Spotlight que sigue el cursor */
      .tp-spotlight {
        position: fixed; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(420px circle at var(--mx) var(--my), rgba(245,246,247,0.06), transparent 70%);
        transition: background 120ms linear;
      }
      .tp-glow {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(900px 460px at 50% -10%, rgba(245,246,247,0.05), transparent 70%);
      }
      .tp-vignette {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(120% 120% at 50% 0%, transparent 55%, rgba(0,0,0,0.55) 100%);
      }
      /* Grano sutil */
      .tp-grain {
        position: fixed; inset: -50%; z-index: 0; pointer-events: none; opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        animation: tp-grain 7s steps(6) infinite;
      }
      @keyframes tp-grain {
        0%{transform:translate(0,0)} 16%{transform:translate(-4%,3%)} 33%{transform:translate(3%,-4%)}
        50%{transform:translate(-3%,2%)} 66%{transform:translate(4%,2%)} 83%{transform:translate(-2%,-3%)} 100%{transform:translate(0,0)}
      }
      /* Entrada escalonada */
      .tp-load { opacity: 0; transform: translateY(14px); animation: tp-load 0.7s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes tp-load { to { opacity: 1; transform: translateY(0); } }
      /* Líneas del headline con clip */
      .tp-line { display: block; opacity: 0; transform: translateY(110%); animation: tp-line 0.8s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes tp-line { to { opacity: 1; transform: translateY(0); } }
      /* Reveals al scroll */
      .tp-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s cubic-bezier(0.22,0.61,0.36,1), transform 0.7s cubic-bezier(0.22,0.61,0.36,1); }
      .tp-reveal.tp-in { opacity: 1; transform: translateY(0); }
      /* Punto status pulsante */
      .tp-dot { display:inline-block; width:6px; height:6px; border-radius:9999px; background:#F5F6F7; box-shadow:0 0 0 0 rgba(245,246,247,0.5); animation: tp-pulse 2.4s ease-out infinite; }
      @keyframes tp-pulse { 0%{box-shadow:0 0 0 0 rgba(245,246,247,0.45)} 70%{box-shadow:0 0 0 7px rgba(245,246,247,0)} 100%{box-shadow:0 0 0 0 rgba(245,246,247,0)} }
      /* CTA fill */
      .tp-cta { transition: transform 0.25s cubic-bezier(0.22,0.61,0.36,1); will-change: transform; }
      .tp-cta-fill { position:absolute; inset:0; background:#C7CBD1; transform: scaleX(0); transform-origin:left; transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1); }
      .tp-cta:hover .tp-cta-fill { transform: scaleX(1); }
      /* 4 swatches */
      .tp-swatch { width:34px; height:6px; border-radius:1px; opacity:0; animation: tp-sw 0.5s ease forwards; }
      .tp-reveal.tp-in .tp-swatch-0 { animation-delay:0.15s } .tp-swatch-0{ background:#F5F6F7 }
      .tp-reveal.tp-in .tp-swatch-1 { animation-delay:0.30s } .tp-swatch-1{ background:#9CA3AF }
      .tp-reveal.tp-in .tp-swatch-2 { animation-delay:0.45s } .tp-swatch-2{ background:#6B7280 }
      .tp-reveal.tp-in .tp-swatch-3 { animation-delay:0.60s } .tp-swatch-3{ background:#3F3F46 }
      @keyframes tp-sw { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:translateY(0)} }
      /* Esquina decorativa de las cards */
      .tp-corner { position:absolute; top:0; right:0; width:34px; height:34px; border-top:1px solid #3F3F46; border-right:1px solid #3F3F46; opacity:0; transition:opacity 0.4s; }
      .group:hover .tp-corner { opacity:1; }
      /* Modal */
      .tp-backdrop { background: rgba(8,8,10,0.78); backdrop-filter: blur(6px); animation: tp-fade 0.25s ease forwards; }
      .tp-modal { animation: tp-modal 0.32s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes tp-fade { from{opacity:0} to{opacity:1} }
      @keyframes tp-modal { from{opacity:0; transform:translateY(16px) scale(0.985)} to{opacity:1; transform:translateY(0) scale(1)} }
      /* Accesibilidad: respetar reduce-motion */
      @media (prefers-reduced-motion: reduce) {
        .tp-load, .tp-line, .tp-reveal, .tp-bar, .tp-swatch, .tp-grain, .tp-dot, .tp-backdrop, .tp-modal { animation: none !important; transition: none !important; }
        .tp-load, .tp-line, .tp-reveal, .tp-swatch { opacity: 1 !important; transform: none !important; }
        .tp-spotlight { display: none; }
      }
    `}</style>
  )
}
