"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, CalendarDays } from "lucide-react"
import { track } from "@/lib/meta/pixel-client"
import { getStoredUtms } from "@/lib/utm/utm-capture"
import { WEBINAR_TZ } from "../config"
import {
  FunnelStyles, FunnelBackdrop, FunnelHeader, SectionLabel, Countdown, CtaButton,
  useParallax, useScrollReveals,
} from "@/features/public-pages/kit/funnel-kit"

/**
 * Landing de la CLASE GRATUITA EN DIRECTO (funnel `webinar`, slug interno intacto).
 *
 * Estructura (2026-07-30, feedback de Marco; referencia live.mkthackers.com):
 *   1. Hero: sello del evento + fecha, titular, subtítulo con la fuente, CUENTA ATRÁS y
 *      el OPT-IN EMBEBIDO (nada de pop-up: el lead rellena de una).
 *   2. Historia de Adrián con galería. Sin botón dentro: el CTA es el del final.
 *   3. CTA final + pie.
 *
 * AQUÍ NO VA NINGÚN VÍDEO. El vídeo es de la página de GRACIAS (post-registro).
 *
 * Estilo: sale del kit común de páginas públicas (`features/public-pages/kit`), que es
 * el que deben usar todas las páginas nuevas. Acento VERDE oficial del brandkit.
 *
 * Lógica intacta: opt-in (3 campos obligatorios) → /api/optin/webinar → Meta
 * (webinar_lead / Lead) → /webinar/gracias. Atribución por utm_source (first-touch).
 */

// Galería de Adrián: fotos servidas desde nuestro dominio (public/adrian), no de un
// link externo. Optimizadas por next/image según el dispositivo.
const GALLERY = [
  { src: "/adrian/adrian-italia.jpg", alt: "Adrián en Italia" },
  { src: "/adrian/adrian-100km.jpg", alt: "Corriendo 100 km en un día", label: "100 km en un día" },
  { src: "/adrian/adrian-bali.jpg", alt: "Adrián en Bali" },
  { src: "/adrian/adrian-muaythai.jpg", alt: "Entrenando Muay Thai", label: "Muay Thai" },
  { src: "/adrian/adrian-croacia.jpg", alt: "Adrián en Croacia" },
  { src: "/adrian/adrian-amigos-italia.jpg", alt: "Con amigos en Italia" },
  { src: "/adrian/adrian-pequeno.jpg", alt: "Adrián de pequeño" },
] as const

export function WebinarLanding({
  dateLabel,
  webinarDate,
  webinarTime,
}: {
  dateLabel: string
  webinarDate: string
  webinarTime: string
}) {
  const heroRef = useRef<HTMLElement>(null)
  useParallax(heroRef)
  useScrollReveals()

  // Lleva al lead al formulario embebido y le deja el cursor puesto en el primer campo.
  const goToForm = useCallback(() => {
    const el = document.getElementById("reservar")
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" })
    window.setTimeout(() => document.getElementById("fullName")?.focus(), reduce ? 0 : 520)
  }, [])

  return (
    <main
      className="fk-root relative overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <FunnelStyles />
      <HeroFit />

      {/* ════════ SECCIÓN 1 · HERO + OPT-IN, TODO EN UNA SOLA PANTALLA ════════
          Regla dura de Marco (2026-07-30): en MÓVIL tiene que verse TODO sin bajar:
          sello, fecha, titular, subtítulo con la fuente, cuenta atrás y el formulario
          entero con su botón. Por eso la sección mide 100svh exactos y CADA tamaño y
          CADA hueco es fluido en `svh` (con `min()` contra `vw`): si el teléfono es más
          bajito, todo encoge a la vez y sigue cabiendo. No se quita ni una palabra. */}
      <section ref={heroRef} className="hero relative flex h-[100svh] flex-col overflow-hidden">
        <FunnelBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 md:px-8" style={{ minHeight: 0 }}>
          <div className="shrink-0">
            <FunnelHeader />
          </div>

          <div className="hero-body grid min-h-0 flex-1 items-center lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            {/* ── Promesa + cuenta atrás ── */}
            <div className="flex min-h-0 flex-col items-center text-center lg:items-start lg:text-left">
              {/* Sello del evento */}
              <div
                className="fk-load hero-badge inline-flex items-center gap-2 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/12"
                style={{ animationDelay: "60ms" }}
              >
                <CalendarDays className="hero-badge-ico text-[#4ADE80]" />
                <span
                  className="font-extrabold uppercase tracking-[0.08em] text-[#4ADE80]"
                  style={{ fontFamily: "'Inter Tight', sans-serif" }}
                >
                  Clase gratuita en directo
                </span>
              </div>

              {/* Fecha y hora reales, salidas del ⚙️ de /webs */}
              <p
                className="fk-load hero-date font-bold text-white"
                style={{ fontFamily: "'Inter Tight', sans-serif", animationDelay: "120ms" }}
              >
                {dateLabel}
              </p>

              {/* Titular: contraste de peso. Lo importante en Black 900 y verde de marca. */}
              <h1
                className="fk-tilt hero-h1 max-w-[24ch] text-white [text-wrap:balance]"
                style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 300 }}
              >
                <span className="fk-line block" style={{ animationDelay: "180ms" }}>
                  Cómo ganar <span className="fk-key">de 2k a 4k al mes</span> en menos de{" "}
                  <span className="font-black text-white">90 días</span> con una{" "}
                  <span className="fk-key">profesión digital</span>
                </span>
                <span className="fk-line hero-h1-tail block font-light text-[#A6ABB4]" style={{ animationDelay: "330ms" }}>
                  aunque no tengas experiencia y partas de 0.
                </span>
              </h1>

              {/* Subtítulo (copy dictado por Marco, íntegro) */}
              <p className="fk-load hero-sub max-w-2xl leading-snug text-[#C7CBD1]" style={{ animationDelay: "460ms" }}>
                Aprende una profesión digital desde cero, sin experiencia previa y sin dejar tu
                trabajo, y gana de <strong className="font-bold text-white">2.000&nbsp;€ a 4.000&nbsp;€ al mes</strong>{" "}
                trabajando para empresas que están buscando tu perfil:{" "}
                <span className="fk-mark">más de 500.000 puestos de trabajo online</span> publicados
                al año en España.
              </p>
              <p className="fk-load hero-src leading-snug text-[#6B7280]" style={{ animationDelay: "520ms" }}>
                Fuente: Informe Estado del Mercado Laboral en España 2024 · InfoJobs y Esade
              </p>

              {/* Cuenta atrás hasta el directo */}
              <div className="fk-load hero-count w-full" style={{ animationDelay: "580ms" }}>
                <Countdown
                  isoDate={webinarDate}
                  time={webinarTime}
                  timeZone={WEBINAR_TZ}
                  labelEmpezado="La clase ya empezó"
                />
              </div>
            </div>

            {/* ── Opt-in embebido ── */}
            <OptinCard />
          </div>
        </div>
      </section>

      {/* ════════ SECCIÓN 2 · HISTORIA DE ADRIÁN + GALERÍA ════════ */}
      <AdrianStory />

      {/* ════════ CTA FINAL ════════ */}
      <section className="mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <div data-reveal className="fk-reveal flex flex-col items-center gap-6 border-t border-[#2A2D34] pt-14 text-center">
          <h3
            className="mx-auto max-w-xl text-[1.7rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-white md:text-[2.4rem] [text-wrap:balance]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Reserva tu plaza. Es gratis y es en directo.
          </h3>
          <CtaButton onClick={goToForm}>Reservar mi plaza gratis</CtaButton>
        </div>
        <footer className="mt-16 flex items-center justify-between border-t border-[#1C1D22] pt-7 text-[13px] text-[#6B7280]">
          <span>Capital Hub</span>
          <span>Adrián Villanueva</span>
        </footer>
      </section>
    </main>
  )
}

/* ───────────────────── Opt-in EMBEBIDO ─────────────────────
   Antes era un pop-up. Ahora vive en la propia página para que el lead rellene de una,
   sin un clic de más. Misma lógica de envío, mismo evento de Meta, misma redirección. */
function OptinCard() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Si el lead llegó desde el DM del reel, el link trae ?mc_id=... → lo mandamos
      // para vincular con el contacto ya creado en el comentario (dedup, SOP producto/20).
      const mcId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("mc_id")
          : null
      const res = await fetch("/api/optin/webinar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          utm_source: utmSource,
          ...(mcId ? { mc_id: mcId } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
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
      // Llevamos el slug del contacto a la gracias para poder marcar quién toca WhatsApp.
      const slug = typeof data?.slug === "string" ? data.slug : null
      router.push(slug ? `/webinar/gracias?c=${encodeURIComponent(slug)}` : "/webinar/gracias")
    } catch {
      setError("Sin conexión. Revisa tu internet y vuelve a intentarlo.")
      setLoading(false)
    }
  }

  return (
    <div
      id="reservar"
      className="fk-load fk-card hero-card w-full scroll-mt-24 rounded-2xl lg:sticky lg:top-8"
      style={{ animationDelay: "300ms" }}
    >
      <span aria-hidden className="fk-card-glow" />
      <div className="relative z-10">
        <h2
          className="hero-form-title font-extrabold leading-tight tracking-[-0.02em] text-white"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Reserva tu plaza
        </h2>
        <p className="hero-form-sub text-[#A6ABB4]">Deja tus datos para acceder al directo.</p>

        {/* Sin etiquetas encima: el propio campo dice lo que es. Así el formulario entero
            cabe en la primera pantalla del móvil sin quitar ni un campo. */}
        <form onSubmit={onSubmit} className="hero-form">
          <Field id="fullName" label="Tu nombre" value={fullName} onChange={setFullName} autoComplete="name" disabled={loading} />
          <Field id="email" label="Tu mejor email" type="email" value={email} onChange={setEmail} autoComplete="email" disabled={loading} />
          <Field id="phone" label="Tu teléfono" type="tel" value={phone} onChange={setPhone} autoComplete="tel" disabled={loading} />

          {error && (
            <div className="hero-err rounded-md border-l-2 border-[#4ADE80] bg-[#22C55E]/10 pl-3 text-[#F5F6F7]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="fk-cta hero-submit group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl font-extrabold transition-opacity disabled:opacity-60"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {loading ? (
              <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
            ) : (
              <>
                <span aria-hidden className="fk-shine" />
                <span className="relative z-10">Reservar mi plaza</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </button>

          <p className="hero-legal text-center text-[#8A8F99]">Es gratis. Plazas limitadas.</p>
        </form>
      </div>
    </div>
  )
}

function Field({
  id, label, value, onChange, type = "text", autoComplete, disabled,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  type?: string; autoComplete?: string; disabled?: boolean
}) {
  return (
    <input
      id={id}
      type={type}
      inputMode={type === "tel" ? "tel" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
      aria-label={label}
      autoComplete={autoComplete}
      disabled={disabled}
      required
      className="hero-input w-full rounded-xl border border-[#3F3F46] bg-[#18181B] px-4 text-[#F5F6F7] transition-colors placeholder:text-[#8A8F99] focus:border-[#4ADE80] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/35"
    />
  )
}

/* ───────────────────── Historia de Adrián + galería ─────────────────────
   SIN botón dentro (Marco, 2026-07-30): el CTA de cierre es el del final de la página,
   que queda justo debajo. Dos botones seguidos no aportan nada. */
function AdrianStory() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel n="01" title="Historia" />

      <h2
        data-reveal
        className="fk-reveal mb-2 text-center text-[1.7rem] font-extrabold tracking-[-0.02em] text-white md:text-[2.5rem]"
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        La profesión que me dio la libertad
      </h2>
      <p data-reveal className="fk-reveal mb-8 text-center text-[13px] text-[#8A8F99]">La historia de Adrián</p>

      {/* Galería (scroll horizontal, ideal en móvil) */}
      <div data-reveal className="fk-reveal -mx-5 mb-10 md:-mx-8">
        <div className="fk-gallery flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 md:px-8">
          {GALLERY.map((g) => (
            <figure
              key={g.src}
              className="group relative aspect-[3/4] w-[210px] shrink-0 snap-start overflow-hidden rounded-xl border border-[#2A2D34] bg-[#141418] sm:w-[240px]"
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
                <figcaption className="absolute bottom-2.5 left-2.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
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
        className="fk-reveal mx-auto max-w-2xl space-y-4 text-center text-[15px] leading-relaxed text-[#C7CBD1] md:text-base [&_strong]:font-bold [&_strong]:text-white"
      >
        <p className="text-lg font-semibold text-white">Me llamo Adrián. Y hace unos años estaba jodido. Pero jodido de verdad.</p>
        <p>
          Tenía 21 años. Había pasado 4 años montando negocios que fracasaron: agencia de marketing,
          consultoría, eventos, criptomonedas. Volví a casa de mi madre, lo dejé con mi novia, y tenía
          una deuda que no sabía cómo iba a pagar.
        </p>
        <p>
          Vengo de una familia de clase baja. Mi madre limpiaba casas, mi padre era camarero. Nunca
          tuvimos casa en propiedad. Y nadie me enseñó cómo funcionaba el dinero.
        </p>
        <p className="text-lg font-semibold text-white">Entonces descubrí el mundo de las profesiones digitales.</p>
        <p>
          Vi que se ganaba muy bien desde casa, sin jefes, y más rápido que nada de lo que había visto
          hasta entonces. Mi objetivo era salir de mi trabajo cuanto antes, y pensé: aquí puedo aprender
          una profesión que se paga bien, meterme en una empresa en días y empezar a cobrar. Sin montar
          nada, sin riesgo. <strong>Aprendes. Das el servicio. Te pagan.</strong>
        </p>
        <p className="text-lg font-semibold text-white">
          Dejé mi trabajo en enero de 2022. Mi primer mes como profesional digital gané 4.000 € limpios.
          Casi 4 veces más de lo que ganaba, en 30 días y desde casa.
        </p>
        <p>
          No porque fuera especial, sino porque tenía una profesión que el mercado pagaba bien. Pasé
          de 1.150 € al mes en una inmobiliaria a 4.000 € desde casa. No me hice rico,
          <strong> pero pude dejar mi trabajo y empezar a vivir de internet.</strong>
        </p>
        <p>Y esa es mi intención para ti con Capital Hub, para que puedas:</p>
        <ul className="space-y-2.5 pt-1">
          {[
            "Dejar de depender de un sueldo que no controlas.",
            "Aprender una profesión digital que las empresas están demandando.",
            "Diseñar un estilo de vida flexible, en tus propios términos.",
          ].map((t) => (
            <li key={t} className="flex justify-center gap-2.5">
              <span aria-hidden className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ADE80]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .fk-gallery { scrollbar-width: none; }
        .fk-gallery::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  )
}

/* ───────────────────── Medidas de la primera pantalla ─────────────────────
   Todo lo del hero se mide contra la ALTURA de la pantalla (`svh`), no solo contra el
   ancho. Cada tamaño es `min(algo-vw, algo-svh)`: manda el más pequeño de los dos, así
   que en un teléfono bajito encoge todo a la vez y el formulario nunca se queda fuera.
   A partir de 1024px se pasa a dos columnas y a tamaños cómodos de escritorio. */
function HeroFit() {
  return (
    <style>{`
      .hero-body { gap: min(3.2vw, 1.6svh); align-content: center; }

      .hero-badge { padding: min(0.9vw, 0.5svh) min(3vw, 1.6svh); font-size: min(2.9vw, 1.45svh); }
      .hero-badge-ico { width: min(3.6vw, 1.8svh); height: min(3.6vw, 1.8svh); }
      .hero-date { margin-top: min(2.2vw, 1.1svh); font-size: min(3.7vw, 1.85svh); }
      .hero-h1 { margin-top: min(2.6vw, 1.3svh); font-size: min(5.9vw, 3.05svh); line-height: 1.06; letter-spacing: -0.028em; }
      .hero-h1-tail { margin-top: min(1.4vw, 0.7svh); font-size: min(3.9vw, 1.95svh); line-height: 1.2; }
      .hero-sub { margin-top: min(3vw, 1.5svh); font-size: min(3.35vw, 1.7svh); }
      .hero-src { margin-top: min(1.6vw, 0.8svh); font-size: min(2.5vw, 1.25svh); }
      .hero-count { margin-top: min(3.4vw, 1.7svh);
        --fk-count-num: min(6.4vw, 3.2svh);
        --fk-count-lab: min(2.4vw, 1.2svh);
        --fk-count-pad: min(1.8vw, 0.9svh);
      }

      .hero-card { padding: min(4.4vw, 2.2svh); }
      .hero-form-title { font-size: min(4.6vw, 2.3svh); }
      .hero-form-sub { margin-top: min(1vw, 0.5svh); font-size: min(3vw, 1.5svh); }
      .hero-form { margin-top: min(3vw, 1.5svh); display: flex; flex-direction: column; gap: min(2.4vw, 1.2svh); }
      .hero-input { height: min(11.5vw, 5.4svh); font-size: min(3.9vw, 1.95svh); }
      .hero-submit { height: min(12.5vw, 5.9svh); font-size: min(4vw, 2svh); }
      .hero-legal { font-size: min(2.9vw, 1.45svh); }
      .hero-err { padding-block: min(1.6vw, 0.8svh); font-size: min(3.2vw, 1.6svh); }

      /* Escritorio: dos columnas y tamaños cómodos, ya sin apretar. */
      @media (min-width: 1024px) {
        .hero-body { gap: 3rem; }
        .hero-badge { padding: 0.375rem 0.875rem; font-size: 13px; }
        .hero-badge-ico { width: 1rem; height: 1rem; }
        .hero-date { margin-top: 0.75rem; font-size: 17px; }
        .hero-h1 { margin-top: 1.25rem; font-size: clamp(2.2rem, 3.1vw, 3.35rem); }
        .hero-h1-tail { margin-top: 0.5rem; font-size: clamp(1.05rem, 1.4vw, 1.5rem); }
        .hero-sub { margin-top: 1.5rem; font-size: 17px; line-height: 1.6; }
        .hero-src { margin-top: 0.65rem; font-size: 11px; }
        .hero-count { margin-top: 2rem; --fk-count-num: 2.5rem; --fk-count-lab: 11px; --fk-count-pad: 1rem; }
        .hero-card { padding: 1.75rem; }
        .hero-form-title { font-size: 1.6rem; }
        .hero-form-sub { margin-top: 0.375rem; font-size: 14px; }
        .hero-form { margin-top: 1.25rem; gap: 0.875rem; }
        .hero-input { height: 3rem; font-size: 16px; }
        .hero-submit { height: 3.375rem; font-size: 15px; }
        .hero-legal { font-size: 12px; }
        .hero-err { padding-block: 0.5rem; font-size: 14px; }
      }
    `}</style>
  )
}
