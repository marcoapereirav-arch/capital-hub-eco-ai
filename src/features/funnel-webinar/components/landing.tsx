"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, X } from "lucide-react"
import { track } from "@/lib/meta/pixel-client"
import { getStoredUtms } from "@/lib/utm/utm-capture"

/**
 * Landing del Funnel Webinar (webinar semanal en directo).
 *
 * Dirección de diseño: base monocromo Capital Hub (#0F0F12 · hairlines #2A2D34 ·
 * texto #F5F6F7) + VERDE de acento oficial (#22C55E). Tipografía normal y legible
 * (Inter Tight display · Inter texto). Sin grid de fondo. Hero en una pantalla.
 *
 * Motion (WOW dentro del brand): entrada escalonada, headline con clip, CTA magnético
 * que se llena de verde, spotlight que sigue el cursor, glow verde sutil, reveals al
 * scroll. Todo degrada con prefers-reduced-motion.
 *
 * Lógica: opt-in (3 campos obligatorios) → /api/optin/webinar → Meta Pixel+CAPI
 * (webinar_lead / Lead) → /webinar/gracias. Atribución por utm_source (first-touch).
 *
 * Copy aprobado (reunión Marco/Adrián 06-jul): promesa 2-4k€/90 días, bolsa de trabajo
 * garantizada por contrato, e historia real de Adrián ("La habilidad que me dio la
 * libertad") como sección abierta con scroll (no pop-up).
 */
export function WebinarLanding({ dateLabel }: { dateLabel: string }) {
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
      els.forEach((el) => el.classList.add("wb-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("wb-in")
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.16 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <main
      ref={mainRef}
      className="wb-root relative min-h-[100dvh] overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <WbStyles />

      {/* Atmósfera: spotlight (cursor) + glow + acento verde sutil + grano + viñeta. Sin grid. */}
      <div aria-hidden className="wb-spotlight" />
      <div aria-hidden className="wb-glow" />
      <div aria-hidden className="wb-glow-green" />
      <div aria-hidden className="wb-grain" />
      <div aria-hidden className="wb-vignette" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-5 md:px-8">
        {/* Marca */}
        <header className="wb-load flex items-center justify-between pt-8 md:pt-12" style={{ animationDelay: "0ms" }}>
          <span
            className="text-sm font-semibold uppercase tracking-[0.15em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Capital Hub
          </span>
          <span className="hidden items-center gap-2 text-[13px] text-[#9CA3AF] sm:inline-flex">
            <span className="wb-dot" /> {dateLabel}
          </span>
        </header>

        {/* ───────── SECCIÓN 1 · HERO (una pantalla) ───────── */}
        <section className="flex flex-1 flex-col justify-center py-14 md:py-20">
          <p className="wb-load mb-6 text-sm text-[#9CA3AF] md:text-[15px]" style={{ animationDelay: "80ms" }}>
            Webinar en vivo · Gratis ·{" "}
            <span className="font-semibold text-[#22C55E]">{dateLabel}</span>
          </p>

          <h1
            className="mb-6 text-[2rem] font-medium leading-[1.06] tracking-[-0.02em] text-white md:text-[3.2rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            <span className="wb-line" style={{ animationDelay: "150ms" }}>
              Cómo dejar tu trabajo y vivir de internet
            </span>
            <span className="wb-line mt-1 block" style={{ animationDelay: "280ms" }}>
              ganando entre <span className="text-[#22C55E]">2.000 € y 4.000 €</span> al mes
            </span>
            <span className="wb-line mt-1 block text-[#7B818C]" style={{ animationDelay: "410ms" }}>
              en menos de 90 días.
            </span>
          </h1>

          <p
            className="wb-load mb-8 max-w-xl text-base leading-relaxed text-[#C7CBD1] md:text-lg"
            style={{ animationDelay: "560ms" }}
          >
            Un directo gratuito donde te enseño qué profesión digital encaja con tu personalidad, cómo
            empezar sin montar un negocio y sin experiencia, y cómo accedes a nuestra bolsa de empleo.
            Reserva tu plaza y entra al grupo.
          </p>

          <div className="wb-load" style={{ animationDelay: "700ms" }}>
            <MagneticButton onClick={() => setOpen(true)}>Reservar mi plaza gratis</MagneticButton>
          </div>
        </section>

        {/* Separador con índice de sección */}
        <div className="wb-load flex items-center gap-4" style={{ animationDelay: "820ms" }}>
          <span className="text-[13px] text-[#6B7280]">
            <span className="font-semibold text-[#22C55E]">02</span> · Qué vas a descubrir
          </span>
          <div className="h-px flex-1 bg-[#2A2D34]" />
        </div>

        {/* ───────── SECCIÓN 2 · QUÉ VAS A DESCUBRIR ───────── */}
        <section className="py-14 md:py-20">
          <h2
            data-reveal
            className="wb-reveal mb-9 text-2xl font-medium tracking-[-0.01em] text-white md:text-4xl"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Lo que verás en el directo
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {DISCOVER.map((d, i) => (
              <article
                key={d.title}
                data-reveal
                className="wb-card wb-reveal group relative overflow-hidden border border-[#2A2D34] bg-[#141418] p-6"
                style={{ transitionDelay: `${60 + i * 80}ms` }}
              >
                <span className="mb-4 block text-[13px] text-[#9CA3AF]">
                  <span className="font-semibold text-[#22C55E]">0{i + 1}</span> · {d.tag}
                </span>
                <p className="text-base leading-relaxed text-[#C7CBD1]">{d.title}</p>
                <span aria-hidden className="wb-corner" />
              </article>
            ))}
          </div>
        </section>

        {/* Separador */}
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-[#6B7280]">
            <span className="font-semibold text-[#22C55E]">03</span> · Empleo
          </span>
          <div className="h-px flex-1 bg-[#2A2D34]" />
        </div>

        {/* ───────── SECCIÓN 3 · BOLSA DE TRABAJO ───────── */}
        <section className="py-14 md:py-20">
          <div
            data-reveal
            className="wb-reveal relative overflow-hidden border border-[#2A2D34] bg-[#111113] p-7 md:p-10"
          >
            <span aria-hidden className="wb-corner" style={{ opacity: 0.5 }} />
            <span className="mb-4 inline-flex items-center gap-2 text-[13px] text-[#22C55E]">
              <span className="wb-dot" /> Bolsa de trabajo garantizada por contrato
            </span>
            <h3
              className="mb-4 text-2xl font-medium tracking-[-0.01em] text-white md:text-3xl"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              No te formas y te quedas solo. Te colocamos.
            </h3>
            <p className="max-w-2xl text-base leading-relaxed text-[#C7CBD1] md:text-lg">
              Te formas paso a paso en una habilidad que las empresas están demandando y accedes a
              nuestra bolsa de empleo. Empresas nos contactan cada semana buscando perfiles. En el
              webinar te explico cómo funciona y qué necesitas para entrar.
            </p>
          </div>
        </section>

        {/* Separador */}
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-[#6B7280]">
            <span className="font-semibold text-[#22C55E]">04</span> · Historia
          </span>
          <div className="h-px flex-1 bg-[#2A2D34]" />
        </div>

        {/* ───────── SECCIÓN 4 · HISTORIA DE ADRIÁN (abierta, con scroll) ───────── */}
        <AdrianStory />

        {/* ───────── CTA FINAL ───────── */}
        <section className="py-14 md:py-20">
          <div
            data-reveal
            className="wb-reveal flex flex-col items-start gap-6 border-t border-[#2A2D34] pt-12"
          >
            <h3
              className="max-w-xl text-2xl font-medium leading-tight tracking-[-0.01em] text-white md:text-3xl"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Reserva tu plaza y entra al grupo. Es gratis y es en directo.
            </h3>
            <MagneticButton onClick={() => setOpen(true)}>Reservar mi plaza gratis</MagneticButton>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto flex items-center justify-between border-t border-[#1C1D22] py-7 text-[13px] text-[#6B7280]">
          <span>© Capital Hub</span>
          <span>Adrián Villanueva</span>
        </footer>
      </div>

      {open && <OptinModal onClose={() => setOpen(false)} />}
    </main>
  )
}

/* Qué vas a descubrir — bullets del directo */
const DISCOVER = [
  { tag: "Tu perfil", title: "Qué profesión digital encaja de verdad con tu personalidad, no la que suena bien y a los 3 meses odias." },
  { tag: "El camino", title: "Cómo empezar sin montar un negocio, sin experiencia previa y sin arriesgar tu dinero." },
  { tag: "El empleo", title: "Cómo accedes a nuestra bolsa de empleo y qué hacen las empresas que nos contactan." },
] as const

/* ───────────────────── Historia de Adrián (sección abierta) ───────────────────── */
function AdrianStory() {
  return (
    <section className="py-14 md:py-20">
      <h2
        data-reveal
        className="wb-reveal mb-3 text-2xl font-medium tracking-[-0.01em] text-white md:text-4xl"
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        La habilidad que me dio la libertad
      </h2>
      <p data-reveal className="wb-reveal mb-9 text-[13px] text-[#6B7280]">
        La historia de Adrián
      </p>

      <div
        data-reveal
        className="wb-reveal space-y-4 max-w-2xl text-[#C7CBD1] [&_strong]:font-medium [&_strong]:text-white"
      >
        <p className="text-lg text-white">Me llamo Adrián. Y hace unos años estaba jodido. Pero jodido de verdad.</p>
        <p>
          Tenía 21 años. Había pasado 4 años montando negocios que fracasaron: agencia de marketing,
          consultoría, eventos, criptomonedas. Había vuelto a casa de mi madre, lo había dejado con mi
          novia, y tenía una deuda de 4.000 € que no sabía cómo iba a pagar.
        </p>
        <p>
          Vengo de una familia de clase baja. Mi madre limpiaba casas, mi padre era camarero. Nunca
          tuvimos casa en propiedad. Y nadie —absolutamente nadie— me enseñó cómo funcionaba el dinero.
        </p>
        <p className="text-lg text-white">
          Entonces descubrí las profesiones digitales.
        </p>
        <p>
          Tenía un amigo que trabajaba de esto. Ganaba muy bien, desde casa, sin jefes. Y pensé:
          «aquí puedo aprender una habilidad que se paga bien, meterme en una empresa en días, y
          empezar a cobrar. Sin montar nada, sin riesgo». <strong>Aprendes. Das el servicio. Te pagan.</strong>
        </p>
        <p className="text-lg text-white">
          Dejé el trabajo en diciembre. En enero gané 4.000 €. Casi 4 veces más de lo que ganaba,
          en 30 días, desde casa.
        </p>
        <p>
          No porque fuera especial, sino porque tenía una habilidad que el mercado pagaba bien. Pasé
          de 1.150 € al mes en una inmobiliaria a 4.000 € desde casa. No fue hacerme rico:
          <strong> fue dejar de depender.</strong>
        </p>
        <p>Y esa es mi intención para ti con Capital Hub, para que puedas:</p>
        <ul className="space-y-2.5 pt-1">
          {[
            "Dejar de depender de un sueldo que no controlas.",
            "Aprender una habilidad que las empresas están demandando.",
            "Diseñar un estilo de vida flexible, en tus propios términos.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <span className="shrink-0 font-semibold text-[#22C55E]">→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
      className="wb-cta group relative inline-flex h-[52px] items-center justify-center gap-2.5 overflow-hidden rounded-none bg-white px-7 text-[15px] font-semibold text-[#0F0F12]"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      <span aria-hidden className="wb-cta-fill" />
      <span className="wb-cta-label relative z-10">{children}</span>
      <ArrowRight className="wb-cta-arrow relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  )
}

/* ───────────────────── Pop-up opt-in ───────────────────── */
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
      const res = await fetch("/api/optin/webinar", {
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
        event: "webinar_lead",
        standardEvent: "Lead",
        email: email.trim(),
        phone: phone.trim(),
        contentName: "Webinar opt-in",
      }).catch(() => {})
      router.push("/webinar/gracias")
    } catch {
      setError("Sin conexión. Revisa tu internet y vuelve a intentarlo.")
      setLoading(false)
    }
  }

  return (
    <div
      className="wb-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="wb-modal relative max-h-[90dvh] w-full overflow-y-auto border-t border-[#2A2D34] bg-[#0F0F12] px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6 sm:max-w-md sm:rounded-none sm:border sm:p-7"
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

        <span className="mb-3 inline-flex items-center gap-2 text-[13px] text-[#9CA3AF]">
          <span className="wb-dot" /> Reserva tu plaza
        </span>
        <h3
          className="mb-6 pr-8 text-xl font-medium tracking-[-0.01em] text-white md:text-2xl"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Deja tus datos y entra al grupo del webinar
        </h3>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <Field id="fullName" label="Tu nombre" value={fullName} onChange={setFullName} placeholder="Tu nombre" autoComplete="name" disabled={loading} />
          <Field id="email" label="Tu mejor email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" autoComplete="email" disabled={loading} />
          <Field id="phone" label="Tu teléfono" type="tel" value={phone} onChange={setPhone} placeholder="+34 600 00 00 00" autoComplete="tel" disabled={loading} />

          {error && (
            <div className="border-l-2 border-[#22C55E] py-1 pl-3 text-sm text-[#F5F6F7]">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="wb-cta group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-none bg-white text-[15px] font-semibold text-[#0F0F12] transition-opacity disabled:opacity-60"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span aria-hidden className="wb-cta-fill" />
                <span className="wb-cta-label relative z-10">Reservar mi plaza gratis</span>
                <ArrowRight className="wb-cta-arrow relative z-10 h-4 w-4" />
              </>
            )}
          </button>

          <p className="pt-1 text-center text-xs text-[#9CA3AF]">
            Reservas tu plaza y entras directo al grupo de WhatsApp. Sin tarjeta, sin compromiso.
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
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-[#9CA3AF]">
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
        className="h-12 w-full rounded-none border border-[#3F3F46] bg-[#18181B] px-4 text-base text-[#F5F6F7] transition-colors placeholder:text-[#6B7280] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]/40"
      />
    </div>
  )
}

/* ───────────────────── Estilos (keyframes + atmósfera + reveals) ───────────────────── */
function WbStyles() {
  return (
    <style>{`
      .wb-root { --mx: 50vw; --my: 30vh; }
      .wb-spotlight {
        position: fixed; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(420px circle at var(--mx) var(--my), rgba(245,246,247,0.06), transparent 70%);
        transition: background 120ms linear;
      }
      .wb-glow {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(900px 460px at 50% -10%, rgba(245,246,247,0.05), transparent 70%);
      }
      .wb-glow-green {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(640px 360px at 88% -6%, rgba(34,197,94,0.10), transparent 68%);
      }
      .wb-vignette {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(120% 120% at 50% 0%, transparent 55%, rgba(0,0,0,0.55) 100%);
      }
      .wb-grain {
        position: fixed; inset: -50%; z-index: 0; pointer-events: none; opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        animation: wb-grain 7s steps(6) infinite;
      }
      @keyframes wb-grain {
        0%{transform:translate(0,0)} 16%{transform:translate(-4%,3%)} 33%{transform:translate(3%,-4%)}
        50%{transform:translate(-3%,2%)} 66%{transform:translate(4%,2%)} 83%{transform:translate(-2%,-3%)} 100%{transform:translate(0,0)}
      }
      .wb-load { opacity: 0; transform: translateY(14px); animation: wb-load 0.7s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-load { to { opacity: 1; transform: translateY(0); } }
      .wb-line { display: block; opacity: 0; transform: translateY(110%); animation: wb-line 0.8s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-line { to { opacity: 1; transform: translateY(0); } }
      .wb-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s cubic-bezier(0.22,0.61,0.36,1), transform 0.7s cubic-bezier(0.22,0.61,0.36,1); }
      .wb-reveal.wb-in { opacity: 1; transform: translateY(0); }
      .wb-dot { display:inline-block; width:7px; height:7px; border-radius:9999px; background:#22C55E; box-shadow:0 0 0 0 rgba(34,197,94,0.55); animation: wb-pulse 2.4s ease-out infinite; }
      @keyframes wb-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
      .wb-cta { transition: transform 0.25s cubic-bezier(0.22,0.61,0.36,1); will-change: transform; }
      .wb-cta-fill { position:absolute; inset:0; background:#22C55E; transform: scaleX(0); transform-origin:left; transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1); }
      .wb-cta:hover .wb-cta-fill { transform: scaleX(1); }
      .wb-cta-label, .wb-cta-arrow { transition: color 0.3s ease; }
      .wb-cta:hover .wb-cta-label, .wb-cta:hover .wb-cta-arrow { color: #FFFFFF; }
      .wb-card { transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1), border-color 0.4s ease; }
      .wb-card:hover { transform: translateY(-3px); border-color: #2f6b45; }
      .wb-corner { position:absolute; top:0; right:0; width:34px; height:34px; border-top:1px solid #22C55E; border-right:1px solid #22C55E; opacity:0; transition:opacity 0.4s; }
      .group:hover .wb-corner { opacity:0.7; }
      .wb-backdrop { background: rgba(8,8,10,0.78); backdrop-filter: blur(6px); animation: wb-fade 0.25s ease forwards; }
      .wb-modal { animation: wb-modal 0.32s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-fade { from{opacity:0} to{opacity:1} }
      @keyframes wb-modal { from{opacity:0; transform:translateY(16px) scale(0.985)} to{opacity:1; transform:translateY(0) scale(1)} }
      @media (prefers-reduced-motion: reduce) {
        .wb-load, .wb-line, .wb-reveal, .wb-grain, .wb-dot, .wb-backdrop, .wb-modal { animation: none !important; transition: none !important; }
        .wb-load, .wb-line, .wb-reveal { opacity: 1 !important; transform: none !important; }
        .wb-spotlight { display: none; }
      }
    `}</style>
  )
}
