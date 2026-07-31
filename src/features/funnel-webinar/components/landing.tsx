"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
  const heroRef = useRef<HTMLDivElement>(null)
  useParallax(heroRef)
  useScrollReveals()

  // Barra fija de abajo: aparece en cuanto el formulario deja de verse (o sea, al bajar
  // a la historia) y se esconde sola cuando el formulario vuelve a estar en pantalla,
  // para no tapar lo que el lead está rellenando.
  const [ctaFijo, setCtaFijo] = useState(false)
  useEffect(() => {
    const form = document.getElementById("reservar")
    if (!form) return
    const io = new IntersectionObserver(
      ([e]) => setCtaFijo(!e.isIntersecting),
      { threshold: 0.12 },
    )
    io.observe(form)
    return () => io.disconnect()
  }, [])

  // El aviso de cookies vive pegado abajo y por encima de todo. Si no se hace nada, en la
  // PRIMERA visita (o sea, todo el tráfico de anuncios) el aviso taparía la barra de
  // reservar, o la barra taparía los botones de aceptar. Se mide el aviso y la barra se
  // coloca justo encima; cuando el aviso desaparece, la barra baja sola.
  useEffect(() => {
    const raiz = document.documentElement
    const medir = () => {
      const aviso = document.querySelector<HTMLElement>("[data-cookie-banner]")
      const alto = aviso ? Math.round(aviso.getBoundingClientRect().height) : 0
      raiz.style.setProperty("--cta-fijo-abajo", alto ? `${alto}px` : "0px")
    }
    medir()
    const obs = new MutationObserver(medir)
    obs.observe(document.body, { childList: true, subtree: true })
    window.addEventListener("resize", medir)
    return () => {
      obs.disconnect()
      window.removeEventListener("resize", medir)
      raiz.style.removeProperty("--cta-fijo-abajo")
    }
  }, [])

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

          CONCEPTO: la ficha del evento. La primera pantalla se lee como una entrada con
          fecha: sello del evento, cuándo es, la promesa, el dato con su sello de fuente,
          el marcador de la cuenta atrás en casillas, y la reserva. De ahí salen las
          decisiones: casillas en el contador, sellos con filete para el dato y la fuente,
          y jerarquía por grosor de Inter Tight (300 a 900), no por fuentes distintas.

          EL BUG DEL SCROLL, RESUELTO DE RAÍZ (Marco, 2026-07-31): antes había reglas
          `@media (max-height: ...)` que encogían todo. En el móvil, al bajar, el navegador
          esconde la barra de direcciones, la pantalla pasa a medir MÁS alto, la regla
          saltaba y la página entera cambiaba de tamaño a mitad de scroll. Ya no queda ni
          una regla que dependa de la altura: TODO se mide con el ANCHO, que no cambia
          nunca. Lo que se ve al entrar es lo que se ve al final.

          REGLA: en una página a pantalla completa, prohibido `@media (max-height)` y
          prohibido usar unidades de altura para calcular tamaños de letra. */}
      {/* El ambiente (luces, orbes, grano) vive AQUÍ, no dentro del hero. Antes lo recortaba
          el borde de la sección y se veía un corte seco justo debajo del formulario. Ahora
          es una capa del documento que se apaga sola hacia abajo, sin costura. */}
      <div ref={heroRef} aria-hidden className="hero-atmos pointer-events-none absolute inset-x-0 top-0">
        <FunnelBackdrop />
      </div>

      <section className="hero relative flex min-h-[100svh] flex-col">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 sm:px-6 md:px-8">
          <div className="hero-top shrink-0">
            <FunnelHeader />
          </div>

          <div className="hero-body my-auto grid w-full lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
            <div className="hero-col flex flex-col">
              {/* 1 · Qué es y cuándo */}
              <div className="hero-when">
                <div
                  className="fk-load hero-badge inline-flex items-center gap-2 rounded-full border border-[#22C55E]/35 bg-[#22C55E]/10"
                  style={{ animationDelay: "60ms" }}
                >
                  <CalendarDays className="hero-badge-ico text-[#4ADE80]" />
                  <span
                    className="font-bold uppercase tracking-[0.1em] text-[#4ADE80]"
                    style={{ fontFamily: "'Inter Tight', sans-serif" }}
                  >
                    Clase gratuita en directo
                  </span>
                </div>
                <p
                  className="fk-load hero-date font-bold text-white"
                  style={{ fontFamily: "'Inter Tight', sans-serif", animationDelay: "120ms" }}
                >
                  {dateLabel}
                </p>
              </div>

              {/* 2 · El titular */}
              <h1
                className="hero-h1 text-white"
                style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 300 }}
              >
                <span className="fk-line block" style={{ animationDelay: "180ms" }}>
                  Cómo ganar <span className="fk-key whitespace-nowrap">de 2k a 4k</span>{" "}
                  <span className="fk-key">al mes</span> en menos de{" "}
                  <span className="hero-strong whitespace-nowrap">90 días</span> con una{" "}
                  <span className="hero-strong">profesión digital</span>
                </span>
              </h1>

              {/* 3 · La condición. Ya no es letra pequeña perdida: va en su propia franja,
                     entre dos filetes, y con las dos ideas que quitan el miedo en blanco. */}
              <p className="fk-load hero-note" style={{ animationDelay: "330ms" }}>
                <span className="hero-note-rule" aria-hidden />
                <span className="hero-note-txt">
                  aunque <em className="hero-note-em">no tengas experiencia</em> y{" "}
                  <em className="hero-note-em whitespace-nowrap">partas de 0</em>.
                </span>
                <span className="hero-note-rule" aria-hidden />
              </p>

              {/* 4 · La promesa */}
              <p className="fk-load hero-sub" style={{ animationDelay: "460ms" }}>
                Aprende una profesión digital desde cero, sin experiencia previa y sin dejar tu
                trabajo, y gana de <strong className="hero-strong">2.000&nbsp;€ a 4.000&nbsp;€ al mes</strong>{" "}
                trabajando para empresas que están buscando tu perfil.
              </p>

              {/* 5 · El dato, como frase APARTE (Marco). Mismo tamaño de lectura, otro
                     tratamiento: Inter Tight, en blanco, con la cifra en verde y el
                     marcador debajo. Y la fuente pegada a él, como el sello que lo firma:
                     etiqueta verde + filete + el informe entero, legible, no en gris
                     diminuto. El dato y quién lo dice van juntos o no valen nada. */}
              <div className="fk-load hero-fact" style={{ animationDelay: "540ms" }}>
                <p className="hero-fact-txt" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                  <span className="fk-mark">más de 500.000 puestos de trabajo online</span>{" "}
                  publicados al año en España.
                </p>
                <p className="hero-fact-src">
                  <span className="hero-fact-tag">Fuente</span>
                  <span className="hero-fact-name">
                    Informe Estado del Mercado Laboral en España 2024 · InfoJobs y Esade
                  </span>
                </p>
              </div>

              {/* 6 · Cuánto queda, en casillas */}
              <div className="fk-load hero-count w-full" style={{ animationDelay: "600ms" }}>
                <Countdown
                  isoDate={webinarDate}
                  time={webinarTime}
                  timeZone={WEBINAR_TZ}
                  labelEmpezado="La clase ya empezó"
                />
              </div>
            </div>

            {/* 7 · La acción */}
            <OptinCard />
          </div>
        </div>
      </section>

      {/* ════════ SECCIÓN 2 · HISTORIA DE ADRIÁN + GALERÍA ════════ */}
      <AdrianStory />

      {/* ════════ CTA FINAL ════════ */}
      <section className="mx-auto max-w-3xl px-5 pb-32 md:px-8 lg:pb-24">
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

      {/* Barra fija: en cuanto el formulario se pierde de vista, el botón de reservar
          queda siempre a mano. Al tocarlo sube al formulario y deja el cursor puesto.
          Respeta la franja de gestos del teléfono (safe-area). */}
      <div className={`cta-fijo ${ctaFijo ? "cta-fijo-on" : ""}`}>
        <button
          type="button"
          onClick={goToForm}
          className="fk-cta cta-fijo-btn group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl font-extrabold"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          <span aria-hidden className="fk-shine" />
          <span className="relative z-10">Reservar mi plaza gratis</span>
          <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      <style>{`
        .cta-fijo { position: fixed; left: 0; right: 0; bottom: var(--cta-fijo-abajo, 0px); z-index: 90;
          padding: 0.75rem 1.25rem calc(env(safe-area-inset-bottom) + 0.75rem);
          background: linear-gradient(180deg, rgba(15,15,18,0) 0%, rgba(15,15,18,0.92) 38%, #0F0F12 100%);
          backdrop-filter: blur(10px);
          transform: translateY(115%); opacity: 0; pointer-events: none;
          transition: transform 0.36s cubic-bezier(0.22,0.61,0.36,1), opacity 0.28s ease; }
        .cta-fijo-on { transform: translateY(0); opacity: 1; pointer-events: auto; }
        .cta-fijo-btn { height: 3.25rem; font-size: 15px; }
        @media (min-width: 1024px) {
          .cta-fijo { left: auto; right: 1.5rem; bottom: calc(var(--cta-fijo-abajo, 0px) + 1.5rem); width: auto; padding: 0; background: none; backdrop-filter: none; }
          .cta-fijo-btn { width: auto; padding-inline: 1.75rem; }
        }
        @media (prefers-reduced-motion: reduce) { .cta-fijo { transition: opacity 0.2s ease; } }
      `}</style>
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
      className="fk-load fk-card hero-card w-full scroll-mt-24 rounded-2xl"
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
            <div role="alert" aria-live="assertive" className="hero-err rounded-md border-l-2 border-[#4ADE80] bg-[#22C55E]/10 pl-3 text-[#F5F6F7]">
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

      {/* Galería: gira sola y en bucle infinito. La lista va DOS veces y la cinta se
          desplaza justo la mitad, así que al reiniciarse cae en el mismo sitio y el salto
          no se ve. Se para al pasar el cursor y se queda quieta con reduce-motion. */}
      <div data-reveal className="fk-reveal -mx-5 mb-10 overflow-hidden md:-mx-8 [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
        <div className="gal-track flex w-max gap-3">
          {[...GALLERY, ...GALLERY].map((g, i) => (
            <figure
              key={`${g.src}-${i}`}
              aria-hidden={i >= GALLERY.length}
              className="group relative aspect-[3/4] w-[210px] shrink-0 overflow-hidden rounded-xl border border-[#2A2D34] bg-[#141418] sm:w-[240px]"
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
        .gal-track { animation: gal-run 46s linear infinite; }
        .gal-track:hover { animation-play-state: paused; }
        @keyframes gal-run { from { transform: translate3d(0,0,0); } to { transform: translate3d(calc(-50% - 0.375rem), 0, 0); } }
        @media (prefers-reduced-motion: reduce) { .gal-track { animation: none; } }
      `}</style>
    </section>
  )
}

/* ───────────────────── Medidas de la primera pantalla ─────────────────────

   NADA DEPENDE DE LA ALTURA. Ni una `@media (max-height)`, ni una unidad de altura
   dentro de un tamaño de letra. Todo se mide con el ANCHO (`vw`), acotado con `clamp`
   para que en tableta no se desmadre. Motivo: en el móvil, al hacer scroll, el navegador
   esconde su barra y la altura de la pantalla CAMBIA; cualquier medida atada a la altura
   hace que la página entera se reescale a mitad de scroll. Ese era el bug.

   Consecuencia asumida: en un teléfono muy bajito (iPhone SE) la primera pantalla se
   pasa un poco y hay que rodar el dedo. Es mejor eso que un texto ilegible o que la
   página cambie de tamaño sola. En los teléfonos de hoy (390 a 430 de ancho) entra todo. */
function HeroFit() {
  return (
    <style>{`
      .hero-top > header { padding-block: clamp(0.6rem, 2.2vw, 1.75rem); }

      .hero-col { text-align: center; align-items: center; }
      .hero-body { display: grid; }

      /* 1 · Evento y fecha */
      .hero-when { display: flex; flex-direction: column; align-items: center; gap: 0.55em; }
      .hero-badge { padding: 0.45em 0.95em; font-size: clamp(10.5px, 3vw, 12px); }
      .hero-badge-ico { width: 1.2em; height: 1.2em; }
      .hero-date { font-size: clamp(15px, 4.3vw, 18px); letter-spacing: -0.01em; }

      /* 2 · Titular */
      .hero-h1 { margin-top: clamp(0.55rem, 2.5vw, 1.5rem); font-size: clamp(23px, 6.2vw, 48px); line-height: 1.06; letter-spacing: -0.034em; max-width: 21ch; text-wrap: balance; }
      .hero-strong { font-weight: 800; color: #FFFFFF; }

      /* 3 · La condición, en su propia franja entre filetes */
      .hero-note { display: flex; align-items: center; justify-content: center; gap: 0.8em; margin-top: clamp(0.5rem, 2vw, 1.1rem); max-width: 36ch; }
      .hero-note-rule { display: block; flex: 1 1 auto; min-width: 0.9rem; max-width: 2.6rem; height: 1px; background: linear-gradient(90deg, rgba(34,197,94,0), rgba(34,197,94,0.75), rgba(34,197,94,0)); }
      .hero-note-txt { flex: 0 1 auto; font-size: clamp(13px, 3.6vw, 15px); font-weight: 400; line-height: 1.35; color: #9BA1AA; text-wrap: balance; }
      .hero-note-em { font-style: normal; font-weight: 700; color: #FFFFFF; }

      /* 4 · La promesa */
      .hero-sub { margin-top: clamp(0.55rem, 2.2vw, 1.5rem); font-size: clamp(12.5px, 3.4vw, 16px); line-height: 1.44; color: #A6ABB4; max-width: 48ch; text-wrap: pretty; }

      /* 5 · El dato, aparte, con su sello de fuente pegado */
      .hero-fact { margin-top: clamp(0.55rem, 2.2vw, 1.4rem); display: flex; flex-direction: column; align-items: center; gap: 0.6em; max-width: 42ch; }
      .hero-fact-txt { font-size: clamp(14px, 3.8vw, 18px); font-weight: 600; line-height: 1.32; letter-spacing: -0.015em; color: #FFFFFF; text-wrap: balance; }
      .hero-fact-src { display: block; padding: 0.45em 0.8em; border: 1px solid rgba(34,197,94,0.22); border-radius: 0.6rem; background: rgba(34,197,94,0.05); text-align: center; }
      .hero-fact-tag { font-family: 'Inter Tight', sans-serif; font-size: clamp(9px, 2.4vw, 10px); font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #4ADE80; margin-right: 0.5em; }
      .hero-fact-tag::after { content: ""; display: inline-block; width: 0.9em; height: 1px; margin-left: 0.5em; vertical-align: middle; background: rgba(74,222,128,0.45); }
      .hero-fact-name { font-size: clamp(10.5px, 2.8vw, 12px); line-height: 1.4; color: #8E939C; }

      /* 6 · Cuenta atrás EN CASILLAS, también en el móvil (Marco) */
      .hero-count { margin-top: clamp(0.6rem, 2.4vw, 1.9rem); text-align: center;
        --fk-count-num: clamp(21px, 5.9vw, 42px);
        --fk-count-lab: clamp(8.5px, 2.3vw, 10px);
        --fk-count-pad: clamp(0.4rem, 1.8vw, 1rem);
      }
      .hero-count .grid { gap: clamp(0.45rem, 2vw, 0.75rem); max-width: 24rem; margin-inline: auto; }

      /* 7 · El formulario. El botón NO se pega al borde de la tarjeta: la tarjeta tiene
             su padding y encima el botón lleva su propio aire por arriba. */
      .hero-card { margin-top: clamp(0.8rem, 3vw, 0); padding: clamp(0.95rem, 4vw, 1.75rem); }
      .hero-form-title { font-size: clamp(16.5px, 4.5vw, 1.6rem); letter-spacing: -0.02em; }
      .hero-form-sub { margin-top: 0.3em; font-size: clamp(12px, 3.3vw, 14px); }
      .hero-form { margin-top: clamp(0.65rem, 2.7vw, 1.25rem); display: flex; flex-direction: column; gap: clamp(0.45rem, 1.9vw, 0.875rem); }
      .hero-input { height: clamp(45px, 11.6vw, 3.25rem); font-size: clamp(15px, 3.9vw, 16px); }
      .hero-submit { margin-top: clamp(0.35rem, 1.5vw, 0.6rem); height: clamp(48px, 12.6vw, 3.5rem); font-size: clamp(15px, 4vw, 15px); }
      .hero-legal { font-size: clamp(11px, 3vw, 12px); }
      .hero-err { padding-block: 0.5em; font-size: clamp(12.5px, 3.4vw, 14px); }

      /* El ambiente: alto medido en ancho, por lo mismo. */
      .hero-atmos { height: 250vw; max-height: 1500px; mask-image: linear-gradient(to bottom, #000 58%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent 100%); }

      /* Escritorio: dos columnas y medida acotada. */
      @media (min-width: 1024px) {
        .hero-col { align-items: center; text-align: center; }
        .hero-body { gap: 3.5rem; }
        .hero-h1 { max-width: 18ch; }
        .hero-note { max-width: 38ch; }
        .hero-sub { max-width: 42ch; }
        .hero-fact { max-width: 40ch; }
        .hero-atmos { height: 135vh; max-height: none; }
      }
    `}</style>
  )
}
