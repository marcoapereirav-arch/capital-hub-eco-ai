"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, X, Gift, BadgeCheck, Send } from "lucide-react"
import { track } from "@/lib/meta/pixel-client"
import { getStoredUtms } from "@/lib/utm/utm-capture"

/**
 * Landing del Funnel Webinar (webinar semanal en directo).
 *
 * Brandkit Capital Hub: base monocromo (#0F0F12 · hairlines #2A2D34 · texto #F5F6F7)
 * + VERDE de acento oficial (#22C55E / #4ADE80). Tipografía Inter Tight (display) ·
 * Inter (texto). Sin grid de fondo. Prohibido el guion largo.
 *
 * HERO con profundidad: capas con parallax por puntero (desktop) + perspective 3D en
 * el titular, glow verde y orbes flotantes. Ligero y 60fps, con degradado en móvil y
 * prefers-reduced-motion. Móvil es la prioridad: hero en una pantalla, tipos fluidos.
 *
 * Lógica: opt-in (3 campos obligatorios) → /api/optin/webinar → Meta (webinar_lead /
 * Lead) → /webinar/gracias. Atribución por utm_source (first-touch).
 */

// Galería de Adrián: fotos servidas desde nuestro dominio (public/adrian), no de un
// link externo. Optimizadas por next/image según el dispositivo.
const GALLERY = [
  { src: "/adrian/adrian-italia.jpg", alt: "Adrián en Italia" },
  { src: "/adrian/adrian-100km.jpg", alt: "Corriendo 100 km en un día", label: "100 km en un día" },
  { src: "/adrian/adrian-bali.jpg", alt: "Adrián en Bali" },
  { src: "/adrian/adrian-muaythai.jpg", alt: "Entrenando Muay Thai", label: "Muay Thai" },
  { src: "/adrian/adrian-madre.jpg", alt: "Adrián con su madre", label: "Mi madre" },
  { src: "/adrian/adrian-croacia.jpg", alt: "Adrián en Croacia" },
  { src: "/adrian/adrian-amigos-italia.jpg", alt: "Con amigos en Italia" },
  { src: "/adrian/adrian-pequeno.jpg", alt: "Adrián de pequeño" },
] as const

export function WebinarLanding({ dateLabel }: { dateLabel: string }) {
  const [open, setOpen] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  // Parallax 3D del hero por puntero (solo desktop, sin reduce-motion).
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        el.style.setProperty("--px", px.toFixed(3))
        el.style.setProperty("--py", py.toFixed(3))
      })
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Reveals al scroll
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
      className="wb-root relative overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <WbStyles />

      {/* ════════ SECCIÓN 1 · HERO (una pantalla, la más importante) ════════ */}
      <section ref={heroRef} className="wb-hero relative flex min-h-[100dvh] flex-col overflow-hidden">
        {/* Capas de profundidad (parallax) */}
        <div aria-hidden className="wb-layer wb-glow-green" data-depth="8" />
        <div aria-hidden className="wb-layer wb-glow-white" data-depth="4" />
        <div aria-hidden className="wb-orb wb-orb-1" data-depth="26" />
        <div aria-hidden className="wb-orb wb-orb-2" data-depth="18" />
        <div aria-hidden className="wb-orb wb-orb-3" data-depth="34" />
        <div aria-hidden className="wb-grain" />
        <div aria-hidden className="wb-vignette" />

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 md:px-8">
          {/* Marca */}
          <header className="wb-load flex items-center justify-between pt-7 md:pt-11" style={{ animationDelay: "0ms" }}>
            <span
              className="text-sm font-semibold uppercase tracking-[0.15em] text-[#F5F6F7]"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Capital Hub
            </span>
            <span className="hidden items-center gap-2 text-[13px] text-[#9CA3AF] sm:inline-flex">
              <span className="wb-dot" /> En directo
            </span>
          </header>

          {/* Contenido hero centrado con perspectiva 3D */}
          <div className="flex flex-1 flex-col justify-center py-10">
            <p className="wb-load mb-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#9CA3AF] md:text-[15px]" style={{ animationDelay: "80ms" }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2A2D34] bg-white/[0.03] px-3 py-1">
                <span className="wb-dot" /> Webinar en vivo
              </span>
              <span className="rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1 font-medium text-[#4ADE80]">
                Gratis
              </span>
              <span className="font-medium text-[#F5F6F7]">{dateLabel}</span>
            </p>

            <div className="wb-tilt">
              <h1
                className="text-[2.15rem] font-medium leading-[1.03] tracking-[-0.022em] text-white [text-wrap:balance] md:text-[3.6rem]"
                style={{ fontFamily: "'Inter Tight', sans-serif" }}
              >
                <span className="wb-line block" style={{ animationDelay: "150ms" }}>
                  Deja tu trabajo y vive
                </span>
                <span className="wb-line block" style={{ animationDelay: "270ms" }}>
                  de internet.
                </span>
                <span className="wb-line mt-2 block text-[1.5rem] font-normal leading-[1.15] text-[#C7CBD1] md:text-[2.1rem]" style={{ animationDelay: "400ms" }}>
                  Entre{" "}
                  <span className="wb-money">2.000 € y 4.000 €</span>{" "}
                  al mes, en menos de{" "}
                  <span className="text-white">90 días</span>.
                </span>
              </h1>
            </div>

            {/* Descripción visual: lead + chips (concepts intactos, más escaneable) */}
            <p className="wb-load mb-4 mt-7 max-w-xl text-[15px] leading-relaxed text-[#C7CBD1] md:text-lg" style={{ animationDelay: "540ms" }}>
              Un directo gratuito y en vivo donde te lo enseño paso a paso:
            </p>
            <div className="wb-load mb-9 flex flex-wrap gap-2.5" style={{ animationDelay: "640ms" }}>
              {[
                "Qué profesión digital encaja contigo",
                "Empezar sin montar un negocio",
                "Acceso a nuestra bolsa de empleo",
              ].map((t) => (
                <span
                  key={t}
                  className="wb-chip inline-flex items-center gap-2 rounded-full border border-[#2A2D34] bg-[#141418] px-3.5 py-2 text-[13px] text-[#D1D5DB] md:text-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  {t}
                </span>
              ))}
            </div>

            <div className="wb-load" style={{ animationDelay: "760ms" }}>
              <MagneticButton onClick={() => setOpen(true)}>Reservar mi plaza gratis</MagneticButton>
              <p className="mt-3 text-[13px] text-[#6B7280]">Plazas limitadas. Sin tarjeta, sin compromiso.</p>
            </div>
          </div>

          {/* Indicador de scroll */}
          <div className="wb-load flex justify-center pb-7" style={{ animationDelay: "900ms" }}>
            <span className="wb-scroll" aria-hidden />
          </div>
        </div>
      </section>

      {/* ════════ SECCIÓN 2 · BOLSA DE TRABAJO (mejorada) ════════ */}
      <section className="relative mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
        <div
          data-reveal
          className="wb-reveal wb-job group relative overflow-hidden rounded-2xl border border-[#2A2D34] bg-gradient-to-b from-[#141418] to-[#0F0F12] p-7 md:p-12"
        >
          <div aria-hidden className="wb-job-glow" />
          <span className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3.5 py-1.5 text-[13px] font-medium text-[#4ADE80]">
            <BadgeCheck className="h-4 w-4" />
            Bolsa de trabajo garantizada por contrato
          </span>
          <h2
            className="relative z-10 mb-4 text-[1.75rem] font-medium leading-[1.1] tracking-[-0.01em] text-white md:text-[2.7rem] [text-wrap:balance]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            No te formas y te quedas solo. <span className="wb-underline">Te colocamos.</span>
          </h2>
          <p className="relative z-10 max-w-2xl text-base leading-relaxed text-[#C7CBD1] md:text-lg">
            Aprendes una habilidad que las empresas están demandando y entras en nuestra bolsa de
            empleo. Cada semana nos escriben empresas buscando perfiles. En el directo te explico
            cómo funciona y qué necesitas para entrar.
          </p>

          {/* Fila animada de "empresas buscando" (marquee sutil, genérico) */}
          <div className="relative z-10 mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <div className="wb-marquee flex w-max gap-2.5">
              {["Agencias", "Startups", "Marcas", "Ecommerce", "Infoproductores", "Consultoras", "Agencias", "Startups", "Marcas", "Ecommerce", "Infoproductores", "Consultoras"].map((c, i) => (
                <span key={i} className="whitespace-nowrap rounded-full border border-[#2A2D34] bg-[#0F0F12] px-3.5 py-1.5 text-[13px] text-[#9CA3AF]">
                  {c} buscando talento
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ SECCIÓN 3 · HISTORIA DE ADRIÁN + GALERÍA ════════ */}
      <AdrianStory onOpen={() => setOpen(true)} />

      {/* ════════ CTA FINAL ════════ */}
      <section className="mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <div data-reveal className="wb-reveal flex flex-col items-start gap-6 border-t border-[#2A2D34] pt-14">
          <h3
            className="max-w-xl text-[1.6rem] font-medium leading-tight tracking-[-0.01em] text-white md:text-[2.2rem] [text-wrap:balance]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Reserva tu plaza y entra al grupo. Es gratis y es en directo.
          </h3>
          <MagneticButton onClick={() => setOpen(true)}>Reservar mi plaza gratis</MagneticButton>
        </div>
        <footer className="mt-16 flex items-center justify-between border-t border-[#1C1D22] pt-7 text-[13px] text-[#6B7280]">
          <span>Capital Hub</span>
          <span>Adrián Villanueva</span>
        </footer>
      </section>

      {open && <OptinModal onClose={() => setOpen(false)} />}
    </main>
  )
}

/* ───────────────────── Historia de Adrián + galería ───────────────────── */
function AdrianStory({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-12">
      <div className="mb-8 flex items-center gap-4">
        <span className="text-[13px] text-[#6B7280]">
          <span className="font-semibold text-[#22C55E]">02</span> · Historia
        </span>
        <div className="h-px flex-1 bg-[#2A2D34]" />
      </div>

      <h2
        data-reveal
        className="wb-reveal mb-2 text-2xl font-medium tracking-[-0.01em] text-white md:text-4xl"
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        La habilidad que me dio la libertad
      </h2>
      <p data-reveal className="wb-reveal mb-8 text-[13px] text-[#6B7280]">La historia de Adrián</p>

      {/* Galería (scroll horizontal, ideal en móvil) */}
      <div data-reveal className="wb-reveal -mx-5 mb-10 md:-mx-8">
        <div className="wb-gallery flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 md:px-8">
          {GALLERY.map((g, i) => (
            <figure
              key={g.src}
              className="wb-shot group relative aspect-[3/4] w-[210px] shrink-0 snap-start overflow-hidden rounded-xl border border-[#2A2D34] bg-[#141418] sm:w-[240px]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Image
                src={g.src}
                alt={g.alt}
                fill
                sizes="(max-width: 640px) 210px, 240px"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              {"label" in g && g.label && (
                <figcaption className="absolute bottom-2.5 left-2.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  {g.label}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

      {/* Texto de la historia */}
      <div
        data-reveal
        className="wb-reveal max-w-2xl space-y-4 text-[15px] leading-relaxed text-[#C7CBD1] md:text-base [&_strong]:font-medium [&_strong]:text-white"
      >
        <p className="text-lg text-white">Me llamo Adrián. Y hace unos años estaba jodido. Pero jodido de verdad.</p>
        <p>
          Tenía 21 años. Había pasado 4 años montando negocios que fracasaron: agencia de marketing,
          consultoría, eventos, criptomonedas. Volví a casa de mi madre, lo dejé con mi novia, y tenía
          una deuda de 4.000 € que no sabía cómo iba a pagar.
        </p>
        <p>
          Vengo de una familia de clase baja. Mi madre limpiaba casas, mi padre era camarero. Nunca
          tuvimos casa en propiedad. Y nadie me enseñó cómo funcionaba el dinero.
        </p>
        <p className="text-lg text-white">Entonces descubrí las profesiones digitales.</p>
        <p>
          Un amigo trabajaba de esto. Ganaba muy bien, desde casa, sin jefes. Y pensé: aquí puedo
          aprender una habilidad que se paga bien, meterme en una empresa en días, y empezar a cobrar.
          Sin montar nada, sin riesgo. <strong>Aprendes. Das el servicio. Te pagan.</strong>
        </p>
        <p className="text-lg text-white">
          Dejé el trabajo en diciembre. En enero gané 4.000 €. Casi 4 veces más de lo que ganaba, en
          30 días, desde casa.
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
        <div className="pt-4">
          <MagneticButton onClick={onOpen}>Reservar mi plaza gratis</MagneticButton>
        </div>
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
    el.style.transform = `translate(${x * 0.16}px, ${y * 0.2}px)`
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
      className="wb-cta group relative inline-flex h-[54px] items-center justify-center gap-2.5 overflow-hidden rounded-none bg-white px-7 text-[15px] font-semibold text-[#0F0F12]"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      <span aria-hidden className="wb-cta-fill" />
      <span className="wb-cta-label relative z-10">{children}</span>
      <ArrowRight className="wb-cta-arrow relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  )
}

/* ───────────────────── Pop-up opt-in (reenfocado a entregar acceso) ───────────────────── */
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
        className="wb-modal relative max-h-[92dvh] w-full overflow-y-auto border-t border-[#2A2D34] bg-[#0F0F12] px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6 sm:max-w-md sm:rounded-2xl sm:border sm:p-7"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Encabezado: enfocado en ENTREGAR el acceso, no en pedir datos */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10">
            <Gift className="h-5 w-5 text-[#22C55E]" />
          </div>
          <div>
            <h3
              className="text-lg font-medium tracking-[-0.01em] text-white md:text-xl"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Te enviamos tu invitación al grupo
            </h3>
            <p className="text-[13px] text-[#9CA3AF]">Rellena tus datos y te mandamos la invitación al grupo de WhatsApp.</p>
          </div>
        </div>

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
            className="wb-send group relative inline-flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-none bg-[#22C55E] py-3.5 text-[15px] font-semibold text-[#08130C] transition-opacity disabled:opacity-60"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span aria-hidden className="wb-send-shine" />
                <Send className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Enviarme la invitación</span>
              </>
            )}
          </button>

          <p className="pt-1 text-center text-xs text-[#9CA3AF]">
            Es gratis y sin compromiso. Solo lo usamos para mandarte el acceso al directo.
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
        required
        className="h-12 w-full rounded-lg border border-[#3F3F46] bg-[#18181B] px-4 text-base text-[#F5F6F7] transition-colors placeholder:text-[#6B7280] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]/40"
      />
    </div>
  )
}

/* ───────────────────── Estilos ───────────────────── */
function WbStyles() {
  return (
    <style>{`
      .wb-root { --px: 0; --py: 0; }
      .wb-hero { --gx: calc(var(--px) * 1); --gy: calc(var(--py) * 1); }
      /* Capas de profundidad: se mueven según --px/--py * data-depth (parallax) */
      .wb-layer, .wb-orb { position: absolute; pointer-events: none; z-index: 0; will-change: transform; transition: transform 0.3s cubic-bezier(0.22,0.61,0.36,1); }
      .wb-glow-green { inset: 0; background: radial-gradient(680px 380px at 82% -4%, rgba(34,197,94,0.16), transparent 66%); transform: translate3d(calc(var(--px) * -8px), calc(var(--py) * -8px), 0); }
      .wb-glow-white { inset: 0; background: radial-gradient(760px 420px at 30% -12%, rgba(245,246,247,0.05), transparent 68%); transform: translate3d(calc(var(--px) * -4px), calc(var(--py) * -4px), 0); }
      .wb-orb { border-radius: 9999px; filter: blur(42px); opacity: 0.55; }
      .wb-orb-1 { width: 320px; height: 320px; top: 8%; right: -60px; background: radial-gradient(circle, rgba(34,197,94,0.30), transparent 70%); transform: translate3d(calc(var(--px) * -26px), calc(var(--py) * -26px), 0); animation: wb-float1 11s ease-in-out infinite; }
      .wb-orb-2 { width: 260px; height: 260px; bottom: 6%; left: -50px; background: radial-gradient(circle, rgba(74,222,128,0.16), transparent 70%); transform: translate3d(calc(var(--px) * -18px), calc(var(--py) * -18px), 0); animation: wb-float2 13s ease-in-out infinite; }
      .wb-orb-3 { width: 180px; height: 180px; top: 40%; left: 12%; background: radial-gradient(circle, rgba(245,246,247,0.06), transparent 70%); transform: translate3d(calc(var(--px) * -34px), calc(var(--py) * -34px), 0); animation: wb-float1 16s ease-in-out infinite; }
      @keyframes wb-float1 { 0%,100% { margin-top: 0; } 50% { margin-top: -22px; } }
      @keyframes wb-float2 { 0%,100% { margin-top: 0; } 50% { margin-top: 20px; } }
      .wb-grain { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.045;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
      .wb-vignette { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(120% 120% at 50% 0%, transparent 56%, rgba(0,0,0,0.5) 100%); }

      /* Titular con leve inclinación 3D según el puntero */
      .wb-tilt { transform-style: preserve-3d; perspective: 900px; }
      .wb-tilt > h1 { transform: rotateX(calc(var(--py) * -3deg)) rotateY(calc(var(--px) * 4deg)); transform-origin: 20% 50%; transition: transform 0.3s cubic-bezier(0.22,0.61,0.36,1); }

      /* Número destacado con barrido de brillo */
      .wb-money { position: relative; color: #4ADE80; font-weight: 500; white-space: nowrap; }
      .wb-money::after { content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 2px; background: linear-gradient(90deg, transparent, #22C55E, transparent); transform: scaleX(0); transform-origin: left; animation: wb-underline 0.9s cubic-bezier(0.22,0.61,0.36,1) 1s forwards; }
      @keyframes wb-underline { to { transform: scaleX(1); } }

      .wb-load { opacity: 0; transform: translateY(14px); animation: wb-load 0.7s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-load { to { opacity: 1; transform: translateY(0); } }
      .wb-line { opacity: 0; transform: translateY(18px); animation: wb-line 0.8s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-line { to { opacity: 1; transform: translateY(0); } }
      .wb-chip { transition: border-color 0.3s ease, transform 0.3s ease, background 0.3s ease; }
      .wb-chip:hover { border-color: #22C55E; transform: translateY(-2px); background: #171a17; }

      .wb-dot { display:inline-block; width:7px; height:7px; border-radius:9999px; background:#22C55E; box-shadow:0 0 0 0 rgba(34,197,94,0.55); animation: wb-pulse 2.4s ease-out infinite; }
      @keyframes wb-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }

      .wb-scroll { width: 22px; height: 36px; border: 1px solid #2A2D34; border-radius: 12px; position: relative; }
      .wb-scroll::after { content: ""; position: absolute; top: 6px; left: 50%; width: 3px; height: 7px; border-radius: 2px; background: #22C55E; transform: translateX(-50%); animation: wb-scrolldot 1.8s ease-in-out infinite; }
      @keyframes wb-scrolldot { 0%{opacity:0; transform: translate(-50%,0)} 30%{opacity:1} 60%{opacity:1; transform: translate(-50%,12px)} 100%{opacity:0} }

      .wb-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s cubic-bezier(0.22,0.61,0.36,1), transform 0.7s cubic-bezier(0.22,0.61,0.36,1); }
      .wb-reveal.wb-in { opacity: 1; transform: translateY(0); }

      /* CTA blanco (hero) */
      .wb-cta { transition: transform 0.25s cubic-bezier(0.22,0.61,0.36,1); will-change: transform; }
      .wb-cta-fill { position:absolute; inset:0; background:#22C55E; transform: scaleX(0); transform-origin:left; transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1); }
      .wb-cta:hover .wb-cta-fill { transform: scaleX(1); }
      .wb-cta-label, .wb-cta-arrow { transition: color 0.3s ease; }
      .wb-cta:hover .wb-cta-label, .wb-cta:hover .wb-cta-arrow { color: #08130C; }

      /* Botón verde de enviar (pop-up) */
      .wb-send { box-shadow: 0 10px 34px -14px rgba(34,197,94,0.7); }
      .wb-send-shine { position:absolute; inset:0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%); transform: translateX(-120%); animation: wb-shine 2.8s ease-in-out 0.4s infinite; }
      @keyframes wb-shine { 0%{transform:translateX(-120%)} 45%,100%{transform:translateX(120%)} }

      /* Sección bolsa de trabajo */
      .wb-job-glow { position:absolute; inset:0; background: radial-gradient(500px 260px at 90% 0%, rgba(34,197,94,0.12), transparent 70%); opacity:0.9; }
      .wb-job { transition: border-color 0.4s ease, transform 0.4s ease; }
      .wb-job:hover { border-color: #2f6b45; }
      .wb-underline { position: relative; color: #4ADE80; }
      .wb-marquee { animation: wb-marquee 26s linear infinite; }
      @keyframes wb-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

      /* Galería */
      .wb-gallery { scrollbar-width: none; }
      .wb-gallery::-webkit-scrollbar { display: none; }
      .wb-shot { opacity: 0; transform: translateY(18px) scale(0.98); animation: wb-shot 0.6s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-shot { to { opacity: 1; transform: translateY(0) scale(1); } }

      /* Modal */
      .wb-backdrop { background: rgba(8,8,10,0.8); backdrop-filter: blur(6px); animation: wb-fade 0.25s ease forwards; }
      .wb-modal { animation: wb-modal 0.32s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-fade { from{opacity:0} to{opacity:1} }
      @keyframes wb-modal { from{opacity:0; transform:translateY(16px) scale(0.985)} to{opacity:1; transform:translateY(0) scale(1)} }

      .h-13 { height: 3.25rem; }

      @media (prefers-reduced-motion: reduce) {
        .wb-load, .wb-line, .wb-reveal, .wb-orb, .wb-grain, .wb-dot, .wb-backdrop, .wb-modal, .wb-shot, .wb-marquee, .wb-money::after, .wb-send-shine, .wb-scroll::after { animation: none !important; transition: none !important; }
        .wb-load, .wb-line, .wb-reveal, .wb-shot { opacity: 1 !important; transform: none !important; }
        .wb-layer, .wb-orb { transform: none !important; }
        .wb-tilt > h1 { transform: none !important; }
      }
    `}</style>
  )
}
