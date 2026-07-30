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
  const heroRef = useRef<HTMLDivElement>(null)
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
          Diseño (Marco, 2026-07-30): en el móvil se ve TODO sin bajar y tiene que
          respirar. Tres decisiones que lo consiguen:
            1. Columna alineada a la IZQUIERDA. Un párrafo largo centrado se lee como
               un ladrillo; a la izquierda cada línea arranca en el mismo sitio y el ojo
               baja solo. La referencia va centrada porque tiene un tercio de texto.
            2. Bloques agrupados por significado: mucho aire ENTRE grupos y poco DENTRO.
               (evento+fecha) (titular) (promesa+fuente) (cuenta atrás) (formulario).
            3. Un solo momento verde en el titular y un solo subrayado en la promesa.
               Antes había cuatro y competían entre ellos.
          Cada tamaño y cada hueco se miden contra la ALTURA (`svh`), así que en un
          teléfono más bajito encoge todo a la vez y el formulario nunca se sale. */}
      {/* El ambiente (luces, orbes, grano) vive AQUÍ, no dentro del hero. Antes lo recortaba
          el borde de la sección y se veía un corte seco justo debajo del formulario. Ahora
          es una capa del documento que se apaga sola hacia abajo, sin costura. */}
      <div ref={heroRef} aria-hidden className="hero-atmos pointer-events-none absolute inset-x-0 top-0">
        <FunnelBackdrop />
      </div>

      <section className="hero relative flex h-[100svh] flex-col">

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 md:px-8" style={{ minHeight: 0 }}>
          <div className="hero-top shrink-0">
            <FunnelHeader />
          </div>

          <div className="hero-body grid min-h-0 flex-1 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
            {/* ── Promesa + cuenta atrás ── */}
            <div className="hero-col flex min-h-0 flex-col">
              {/* Grupo 1: qué es y cuándo */}
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

              {/* Grupo 2: el titular. Las frases clave no se parten nunca a mitad. */}
              <h1
                className="fk-tilt hero-h1 text-white"
                style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 300 }}
              >
                <span className="fk-line block" style={{ animationDelay: "180ms" }}>
                  Cómo ganar <span className="fk-key whitespace-nowrap">de 2k a 4k</span>{" "}
                  <span className="fk-key">al mes</span> en menos de{" "}
                  <span className="hero-strong whitespace-nowrap">90 días</span> con una{" "}
                  <span className="hero-strong">profesión digital</span>
                </span>
                {/* La condición, tratada como un apunte al margen: filete verde y letra
                    fina. Deja de ser "una línea más" y se lee como la letra pequeña
                    que quita el miedo. */}
                <span className="fk-line hero-note block" style={{ animationDelay: "330ms" }}>
                  <span className="hero-note-rule" aria-hidden />
                  <span className="hero-note-txt">
                    aunque <em className="hero-note-em">no tengas experiencia</em> y{" "}
                    <em className="hero-note-em whitespace-nowrap">partas de 0</em>.
                  </span>
                </span>
              </h1>

              {/* Grupo 3: la promesa y de dónde sale el dato (copy íntegro de Marco) */}
              <div className="hero-promise">
                <p className="fk-load hero-sub text-[#A6ABB4]" style={{ animationDelay: "460ms" }}>
                  Aprende una profesión digital desde cero, sin experiencia previa y sin dejar tu
                  trabajo, y gana de <strong className="hero-strong">2.000&nbsp;€ a 4.000&nbsp;€ al mes</strong>{" "}
                  trabajando para empresas que están buscando tu perfil:{" "}
                  <span className="fk-mark">más de 500.000 puestos de trabajo online</span> publicados
                  al año en España.
                </p>
                {/* La fuente, tratada como el sello que respalda el dato: no es relleno,
                    es la prueba. Etiqueta corta arriba y el informe debajo. */}
                <p className="fk-load hero-src" style={{ animationDelay: "520ms" }}>
                  <span className="hero-src-tag">Fuente</span>
                  <span className="hero-src-txt">
                    Informe Estado del Mercado Laboral en España 2024 · InfoJobs y Esade
                  </span>
                </p>
              </div>

              {/* Grupo 4: cuánto queda */}
              <div className="fk-load hero-count w-full" style={{ animationDelay: "580ms" }}>
                <Countdown
                  isoDate={webinarDate}
                  time={webinarTime}
                  timeZone={WEBINAR_TZ}
                  labelEmpezado="La clase ya empezó"
                />
              </div>
            </div>

            {/* Grupo 5: la acción */}
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
   Todo se mide contra la ALTURA de la pantalla (`svh`), no solo contra el ancho: cada
   valor es `min(algo-vw, algo-svh)` y manda el más pequeño, así que en un teléfono
   bajito encoge todo a la vez y el formulario nunca se queda fuera.

   El ritmo es lo que hace que respire: MUCHO aire entre grupos, POCO dentro de cada
   grupo. Por eso los huecos internos van en `em` (atados a su propio texto) y los que
   separan grupos van en `svh`. */
function HeroFit() {
  return (
    <style>{`
      /* Columna editorial: alineada a la izquierda en móvil. */
      .hero-atmos { height: 145svh; mask-image: linear-gradient(to bottom, #000 58%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent 100%); }

      .hero-col { text-align: left; align-items: flex-start; justify-content: safe center; gap: min(4.4vw, 1.95svh); }
      .hero-body { gap: min(4.4vw, 1.95svh); align-content: safe center; grid-template-rows: auto auto; }
      .hero-top > header { padding-block: min(3.4vw, 1.7svh); }

      /* Grupo 1: evento y fecha, pegados entre sí. */
      .hero-when { display: flex; flex-direction: column; align-items: flex-start; gap: 0.6em; }
      .hero-badge { padding: 0.42em 0.9em; font-size: min(2.85vw, 1.42svh); }
      .hero-badge-ico { width: 1.15em; height: 1.15em; }
      .hero-date { font-size: min(4.1vw, 1.9svh); letter-spacing: -0.01em; }

      /* Grupo 2: el titular manda. Interlineado apretado para que se lea como un bloque. */
      .hero-h1 { font-size: min(6.2vw, 2.85svh); line-height: 1.05; letter-spacing: -0.032em; max-width: 19ch; }
      .hero-note { display: flex; align-items: flex-start; gap: 0.7em; margin-top: 0.62em; font-size: 0.46em; max-width: 34ch; }
      .hero-note-rule { flex: none; width: 2px; align-self: stretch; border-radius: 2px; background: linear-gradient(180deg, var(--acc), rgba(34,197,94,0)); }
      .hero-note-txt { font-weight: 300; line-height: 1.32; letter-spacing: 0; color: #8E939C; }
      .hero-note-em { font-style: normal; font-weight: 600; color: #D6DAE0; }
      .hero-strong { font-weight: 800; color: #FFFFFF; }

      /* Grupo 3: la promesa. Medida corta y respirada para que se lea tranquila. */
      .hero-promise { display: flex; flex-direction: column; gap: 0.7em; }
      .hero-sub { font-size: min(3.4vw, 1.56svh); line-height: 1.46; max-width: 48ch; }
      .hero-src { display: flex; align-items: baseline; gap: 0.7em; font-size: min(2.5vw, 1.22svh); line-height: 1.4; max-width: 54ch; }
      .hero-src-tag { flex: none; font-family: 'Inter Tight', sans-serif; font-weight: 800; font-size: 0.84em; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(74,222,128,0.85); }
      .hero-src-tag::after { content: ""; display: inline-block; width: 1.1em; height: 1px; margin-left: 0.5em; vertical-align: middle; background: rgba(74,222,128,0.4); }
      .hero-src-txt { color: #5C616B; }

      /* Grupo 4: cuenta atrás sin cajas en móvil. Solo los números, que es lo que importa. */
      .hero-count { --fk-count-num: min(7.4vw, 3.4svh); --fk-count-lab: min(2.4vw, 1.15svh); --fk-count-pad: 0; }
      .hero-count .fk-count { border: 0; background: none; box-shadow: none; border-radius: 0; text-align: left; padding-inline: 0; }
      .hero-count .fk-count-glow, .hero-count .fk-count-tick { display: none; }
      .hero-count .grid { gap: min(4vw, 2svh); max-width: none; grid-template-columns: repeat(4, max-content); }
      .hero-count .fk-count-lab { color: #5C616B; margin-top: 0.25em; }

      /* Grupo 5: la acción. */
      .hero-card { padding: min(4.3vw, 1.85svh); }
      .hero-form-title { font-size: min(4.6vw, 2.1svh); letter-spacing: -0.02em; }
      .hero-form-sub { margin-top: 0.3em; font-size: min(3vw, 1.5svh); }
      .hero-form { margin-top: min(3vw, 1.3svh); display: flex; flex-direction: column; gap: min(1.9vw, 0.85svh); }
      .hero-input { height: min(10.9vw, 4.75svh); font-size: min(3.8vw, 1.8svh); }
      .hero-submit { height: min(11.9vw, 5.2svh); font-size: min(3.9vw, 1.85svh); }
      .hero-legal { font-size: min(2.85vw, 1.42svh); }
      .hero-err { padding-block: 0.5em; font-size: min(3.2vw, 1.6svh); }

      /* Escritorio: dos columnas, ya sin apretar. */
      @media (min-width: 1024px) {
        .hero-col { gap: 1.75rem; justify-content: center; }
        .hero-body { gap: 3.5rem; }
        .hero-badge { padding: 0.4rem 0.9rem; font-size: 12px; }
        .hero-date { font-size: 18px; }
        .hero-h1 { font-size: clamp(2.35rem, 3.05vw, 3.35rem); max-width: 20ch; }
        .hero-note { font-size: 0.39em; max-width: 44ch; margin-top: 0.8em; }
        .hero-note-rule { width: 3px; }
        .hero-atmos { height: 135vh; }
        .hero-src { font-size: 11.5px; max-width: none; }
        .hero-count { --fk-count-num: 2.7rem; --fk-count-pad: 1.05rem; }
        .hero-sub { font-size: 16px; line-height: 1.65; max-width: 46ch; }
        .hero-src { font-size: 11px; }
        .hero-count { --fk-count-num: 2.5rem; --fk-count-lab: 10px; --fk-count-pad: 0.85rem; }
        .hero-count .fk-count { border: 1px solid rgba(34,197,94,0.28); background: linear-gradient(180deg, rgba(34,197,94,0.10), rgba(20,20,24,0.9)); box-shadow: 0 12px 34px -22px rgba(34,197,94,0.9); border-radius: 0.75rem; text-align: center; padding-inline: 0.25rem; }
        .hero-count .fk-count-glow, .hero-count .fk-count-tick { display: block; }
        .hero-count .grid { gap: 0.75rem; max-width: 28rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .hero-card { padding: 1.75rem; }
        .hero-form-title { font-size: 1.6rem; }
        .hero-form-sub { font-size: 14px; }
        .hero-form { margin-top: 1.25rem; gap: 0.875rem; }
        .hero-input { height: 3rem; font-size: 16px; }
        .hero-submit { height: 3.375rem; font-size: 15px; }
        .hero-legal { font-size: 12px; }
      }
    `}</style>
  )
}
