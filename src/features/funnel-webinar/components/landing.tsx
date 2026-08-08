"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, CalendarDays } from "lucide-react"
import { track } from "@/lib/meta/pixel-client"
import { useViewContent } from "@/lib/meta/use-view-content"
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

  // Vio la landing de la clase. No es lo mismo que "cargó una página" (eso ya lo dice
  // PageView solo): esto marca a quien vio LA OFERTA, y es con lo que se construyen las
  // audiencias buenas. Ver SOP marketing/09.
  useViewContent("Clase en directo · landing")

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
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 sm:px-6 md:px-8">
          <div className="hero-top shrink-0">
            <FunnelHeader />
          </div>

          {/* En MÓVIL todo se apila en una columna. En ESCRITORIO, DOS COLUMNAS: el texto
              a la izquierda y el formulario a la derecha, como estaba.

              El texto se lee POR BLOQUES: marca · evento+fecha · promesa · descripción ·
              dato+fuente · cuenta atrás. Aire entre bloques, piezas pegadas dentro. */}
          <div className="hero-body mb-auto grid w-full lg:my-auto lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-14 xl:grid-cols-[1fr_25rem] xl:gap-16">
            <div className="hero-col">
            {/* 1 · CUÁNDO */}
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

            {/* 2 · LA PROMESA. El titular manda; la condición va pegada debajo, en gris,
                   como respiración del titular. Sin filetes a los lados: eran ruido. */}
            <div className="hero-promesa">
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
              <p className="fk-line hero-note" style={{ animationDelay: "330ms" }}>
                aunque <em className="hero-note-em">no tengas experiencia</em> y{" "}
                <em className="hero-note-em whitespace-nowrap">partas de 0</em>.
              </p>
            </div>

            {/* 3 · LA DESCRIPCIÓN. Secundaria y se nota: gris y pequeña. */}
            <p className="fk-load hero-sub" style={{ animationDelay: "460ms" }}>
              Aprende una profesión digital desde cero, sin experiencia previa y sin dejar tu
              trabajo, y gana de <strong className="hero-strong">2.000&nbsp;€ a 4.000&nbsp;€ al mes</strong>{" "}
              trabajando para empresas que están buscando tu perfil.
            </p>

            {/* 4 · EL DATO, bloque propio. Es el segundo foco: blanco, con la cifra en
                   verde. La fuente va PEGADA a él porque es quien lo firma. */}
            <div className="hero-dato">
              <p className="fk-load hero-fact" style={{ animationDelay: "520ms" }}>
                <span className="fk-mark">más de 500.000 puestos de trabajo online</span>{" "}
                publicados al año en España.
              </p>
              <p className="fk-load hero-src" style={{ animationDelay: "560ms" }}>
                <span className="hero-src-tag">Fuente</span>
                Informe Estado del Mercado Laboral en España 2024 · InfoJobs y Esade
              </p>
            </div>

            {/* 5 · CUÁNTO QUEDA */}
            <div className="fk-load hero-count" style={{ animationDelay: "620ms" }}>
              <Countdown
                isoDate={webinarDate}
                time={webinarTime}
                timeZone={WEBINAR_TZ}
                labelEmpezado="La clase ya empezó"
              />
            </div>

            </div>

            {/* 6 · LA ACCIÓN. En escritorio es la columna de la derecha. */}
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
          padding: 0.75rem 1.25rem calc(var(--sab) + 0.75rem);
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

   UNA COLUMNA, CINCO BLOQUES. El ritmo es lo que quita el ruido: el hueco ENTRE bloques
   es grande y constante; dentro de cada bloque las piezas van pegadas. Así el ojo agrupa
   solo (cuándo · promesa · prueba · cuánto queda · reservar) en vez de leer una lista de
   nueve cosas sueltas.

   NADA DEPENDE DE LA ALTURA. Ni una `@media (max-height)`, ni `svh`/`vh` dentro de un
   tamaño. En el móvil la altura cambia al esconderse la barra del navegador y eso
   reescalaba la página a mitad de scroll. Todo se mide con el ANCHO. */
function HeroFit() {
  return (
    <style>{`
      /* La marca respira arriba pero se despega poco por abajo: el bloque del evento
         tiene que quedar CERCA de ella (Marco). */
      .hero-top > header { padding-top: clamp(0.6rem, 2.2vw, 1.5rem); padding-bottom: clamp(0.15rem, 0.6vw, 0.4rem); }

      /* Una sola columna centrada. Los huecos NO son todos iguales: se reparten por
         bloques, que es como lo lee Marco.
           marca ─(pegado)─ evento+fecha ─(SEPARACIÓN)─ promesa ─ descripción ─ dato ─
           cuenta atrás ─ reservar
         El hueco grande antes de la promesa es a propósito: separa "cuándo es" de "qué
         te llevas", que son dos cosas distintas. */
      /* Las dos medidas del ritmo viven en el PADRE de todo (incluido el formulario).
         Estaban en la columna de texto y, al sacar el formulario a su propia columna,
         se quedaba sin ellas: su hueco caía a cero y se pegaba al contador. */
      .hero-body {
        --sep: clamp(1.7rem, 7.4vw, 2.8rem);    /* separación fuerte entre bloques distintos */
        --paso: clamp(1rem, 4.3vw, 1.7rem);     /* paso normal de bloque a bloque */
      }
      .hero-col { width: 100%; max-width: 33rem; margin-inline: auto; text-align: center;
        display: flex; flex-direction: column; align-items: center; }
      /* El evento se acerca a la marca, pero SIN pegarse: son dos bloques, no uno. */
      .hero-when { margin-top: clamp(0.85rem, 3.6vw, 1.5rem); }
      .hero-promesa { margin-top: var(--sep); }
      .hero-sub { margin-top: var(--paso); }
      .hero-dato { margin-top: var(--paso); display: flex; flex-direction: column; align-items: center; gap: 0.5em; }
      .hero-count { margin-top: var(--paso); }
      .hero-card { margin-top: var(--paso); }

      /* 1 · Cuándo */
      .hero-when { display: flex; flex-direction: column; align-items: center; gap: 0.55em; }
      .hero-badge { padding: 0.45em 0.95em; font-size: clamp(10.5px, 3vw, 12px); }
      .hero-badge-ico { width: 1.2em; height: 1.2em; }
      .hero-date { font-size: clamp(15px, 4.3vw, 18px); letter-spacing: -0.01em; }

      /* 2 · La promesa. El titular manda y la condición respira justo debajo. */
      .hero-promesa { display: flex; flex-direction: column; align-items: center; gap: 0.55em; }
      .hero-h1 { font-size: clamp(25px, 6.5vw, 44px); line-height: 1.06; letter-spacing: -0.035em; max-width: 19ch; text-wrap: pretty; }
      .hero-strong { font-weight: 800; color: #FFFFFF; }
      .hero-note { font-size: clamp(10.5px, 3.35vw, 16px); font-weight: 400; line-height: 1.4; color: #868C95; max-width: none; white-space: nowrap; }
      .hero-note-em { font-style: normal; font-weight: 700; color: #E4E7EB; }

      /* 3 · La prueba. Párrafo claramente secundario, dato como segundo foco, fuente
             firmando en una línea. Sin caja: la caja pesaba más que el propio dato. */
      .hero-sub { font-size: clamp(8px, 2.93vw, 15px); line-height: 1.5; color: #8E939C; max-width: none; text-wrap: pretty; }
      .hero-fact { font-family: 'Inter Tight', sans-serif; font-size: clamp(14.5px, 3.9vw, 18px); font-weight: 600; line-height: 1.35; letter-spacing: -0.015em; color: #FFFFFF; max-width: 34ch; text-wrap: balance; }
      .hero-src { font-size: clamp(7px, 2.2vw, 11.5px); line-height: 1.4; color: #6B7079; max-width: none; white-space: nowrap; }
      .hero-src-tag { font-family: 'Inter Tight', sans-serif; font-weight: 800; font-size: 0.9em; letter-spacing: 0.1em; text-transform: uppercase; color: #4ADE80; margin-right: 0.45em; }

      /* 4 · Cuenta atrás, en casillas */
      .hero-count { width: 100%;
        --fk-count-num: clamp(21px, 5.5vw, 34px);
        --fk-count-lab: clamp(8.5px, 2.2vw, 10px);
        --fk-count-pad: clamp(0.4rem, 1.7vw, 0.8rem);
      }
      .hero-count .grid { gap: clamp(0.45rem, 2vw, 0.7rem); max-width: 22rem; margin-inline: auto; }

      /* 5 · La acción. El botón no se pega al borde: la tarjeta tiene su padding y el
             botón además su propio aire por arriba. */
      .hero-card { width: 100%; max-width: 30rem; padding: clamp(0.95rem, 4vw, 1.6rem); }
      .hero-form-title { font-size: clamp(17px, 4.6vw, 1.5rem); letter-spacing: -0.02em; }
      .hero-form-sub { margin-top: 0.3em; font-size: clamp(12px, 3.3vw, 13.5px); }
      .hero-form { margin-top: clamp(0.7rem, 3vw, 1.15rem); display: flex; flex-direction: column; gap: clamp(0.45rem, 1.9vw, 0.7rem); }
      .hero-input { height: clamp(45px, 11.5vw, 3.1rem); font-size: clamp(15px, 3.9vw, 16px); }
      .hero-submit { margin-top: clamp(0.4rem, 1.7vw, 0.55rem); height: clamp(50px, 13vw, 3.35rem); font-size: 15px; }
      .hero-legal { font-size: clamp(11px, 3vw, 12px); }
      .hero-err { padding-block: 0.5em; font-size: clamp(12.5px, 3.4vw, 14px); }

      /* El ambiente: alto medido en ancho, por lo mismo que todo lo demás. */
      .hero-atmos { height: 250vw; max-height: 1500px; mask-image: linear-gradient(to bottom, #000 58%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent 100%); }

      @media (min-width: 768px) {
        .hero-body { --sep: 1.9rem; --paso: 1.25rem; }
        .hero-col { max-width: 34rem; }
        .hero-when { margin-top: 1.1rem; }
        .hero-h1 { font-size: 38px; max-width: 17ch; }
        .hero-note { font-size: 15px; max-width: none; }
        .hero-sub { font-size: 14.5px; max-width: none; }
        .hero-fact { font-size: 17px; max-width: 40ch; }
        .hero-src { font-size: 11px; max-width: none; }
        .hero-count { --fk-count-num: 30px; --fk-count-pad: 0.7rem; }
        .hero-count .grid { max-width: 21rem; gap: 0.6rem; }
        .hero-card { padding: 1.4rem; }
        .hero-form-title { font-size: 1.35rem; }
        .hero-form { margin-top: 1rem; gap: 0.6rem; }
        .hero-input { height: 3rem; }
        .hero-submit { height: 3.25rem; }
        .hero-atmos { height: 135vh; max-height: none; }
      }

      /* Solo en escritorio se puede afinar por altura: ahí la ventana NO cambia de alto
         al hacer scroll (no hay barra de navegador que se esconda), así que no existe el
         bug de reescalado. En móvil sigue terminantemente prohibido. */
      /* DOS COLUMNAS (escritorio). El texto a la izquierda, el formulario a la derecha
         con ancho FIJO: así las dos columnas se leen como un solo bloque ordenado y no
         como dos manchas flotando en una página enorme.

         Los dos textos que marcan el ancho (la fuente y la descripción) se acotan a la
         columna, no a la pantalla, para que sigan cayendo en 1 y 3 líneas. */
      @media (min-width: 1024px) {
        /* Tamaños grandes a propósito: en escritorio hay altura de sobra y, si el
           contenido se queda pequeño, la página se llena de huecos muertos. */
        .hero-body { --sep: 2.1rem; --paso: 1.35rem; }
        .hero-col { max-width: 100%; }
        .hero-when { margin-top: 0; }
        /* La tarjeta arranca a la MISMA altura que el sello del evento, no a media
           página: es lo que hacía que las dos columnas se vieran desalineadas. */
        .hero-card { margin-top: 0; width: 100%; max-width: none; padding: 1.9rem; }
        /* El texto no llena la columna entera: medida corta y centrada dentro de ella,
           para que el bloque se lea como un rectángulo limpio y no como líneas sueltas. */
        .hero-col > * { max-width: 31rem; margin-inline: auto; }
        .hero-h1 { font-size: clamp(32px, 2.7vw, 40px); max-width: 100%; text-wrap: balance; }
        .hero-note { font-size: 15.5px; }
        .hero-sub { font-size: 15px; }
        .hero-fact { font-size: 18px; }
        .hero-src { font-size: 11px; }
        .hero-count { --fk-count-num: 38px; --fk-count-pad: 0.95rem; }
        .hero-count .grid { max-width: 22rem; gap: 0.7rem; }
        .hero-form-title { font-size: 1.5rem; }
        .hero-form { margin-top: 1.25rem; gap: 0.85rem; }
        .hero-input { height: 3.4rem; }
        .hero-submit { height: 3.6rem; margin-top: 0.6rem; }
        .hero-atmos { height: 135vh; max-height: none; }
      }

      @media (min-width: 1024px) and (min-height: 1180px) {
        .hero-body { --sep: 2.5rem; --paso: 1.5rem; }
        .hero-h1 { font-size: 44px; }
        .hero-sub { font-size: 15px; }
        .hero-fact { font-size: 18px; }
        .hero-count { --fk-count-num: 34px; --fk-count-pad: 0.8rem; }
        .hero-card { padding: 1.6rem; }
      }
    `}</style>
  )
}
