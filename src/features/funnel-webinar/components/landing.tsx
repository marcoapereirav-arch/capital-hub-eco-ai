"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, CalendarDays, Play } from "lucide-react"
import { track } from "@/lib/meta/pixel-client"
import { getStoredUtms } from "@/lib/utm/utm-capture"
import { bunnyEmbedUrl, webinarTargetMs } from "../config"

/**
 * Landing de la CLASE GRATUITA EN DIRECTO (funnel `webinar`, slug interno intacto).
 *
 * Pasada del 2026-07-30 (feedback de Marco, referencia live.mkthackers.com):
 *  - Titular y subtítulo nuevos, con la fuente del dato de mercado en pequeño.
 *  - En pantalla NUNCA se dice "webinar": es "Clase gratuita en directo".
 *  - Más dopamina: acento VERDE oficial del brandkit, tipografía mucho más gruesa (Inter Tight
 *    hasta 900) y más color en fondos, bordes y botones.
 *  - Opt-in EMBEBIDO en la propia página (fuera el pop-up): el lead rellena de una.
 *  - Cuenta atrás real hasta el directo (fecha y hora de España, con verano/invierno).
 *  - El vídeo sale de la primera pantalla y pasa a una sección propia debajo.
 *  - Fuera la sección "No te formas y te quedas solo" (levantaba alarmas del cliente) y
 *    fuera la foto de la madre de la galería.
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
  videoGuid,
  bunnyLibraryId,
}: {
  dateLabel: string
  webinarDate: string
  webinarTime: string
  videoGuid?: string
  bunnyLibraryId?: string
}) {
  const heroRef = useRef<HTMLElement>(null)

  // Lleva al lead al formulario embebido y le deja el cursor puesto en el primer campo.
  const goToForm = useCallback(() => {
    const el = document.getElementById("reservar")
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" })
    window.setTimeout(() => document.getElementById("fullName")?.focus(), reduce ? 0 : 520)
  }, [])

  // Parallax de las capas del fondo por puntero (solo escritorio, sin reduce-motion).
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

      {/* ════════ SECCIÓN 1 · HERO + OPT-IN EMBEBIDO ════════
          Sin vídeo: titular, promesa, cuenta atrás y formulario. En escritorio va a dos
          columnas para que el formulario se vea sin bajar; en móvil se apila en orden. */}
      <section ref={heroRef} className="wb-hero relative min-h-[100svh] overflow-hidden pb-16 md:pb-24">
        {/* Capas de color (parallax) */}
        <div aria-hidden className="wb-layer wb-glow-a" />
        <div aria-hidden className="wb-layer wb-glow-b" />
        <div aria-hidden className="wb-orb wb-orb-1" />
        <div aria-hidden className="wb-orb wb-orb-2" />
        <div aria-hidden className="wb-orb wb-orb-3" />
        <div aria-hidden className="wb-grain" />
        <div aria-hidden className="wb-vignette" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 md:px-8">
          {/* Marca */}
          <header className="wb-load flex items-center justify-between py-6 md:py-8" style={{ animationDelay: "0ms" }}>
            <span
              className="text-sm font-bold uppercase tracking-[0.15em] text-[#F5F6F7]"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Capital Hub
            </span>
            <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#4ADE80]">
              <span className="wb-dot" /> En directo
            </span>
          </header>

          <div className="grid items-start gap-10 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pt-8">
            {/* ── Columna izquierda: promesa + cuenta atrás ── */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Sello del evento */}
              <div
                className="wb-load inline-flex items-center gap-2 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/12 px-3.5 py-1.5"
                style={{ animationDelay: "60ms" }}
              >
                <CalendarDays className="h-4 w-4 text-[#4ADE80]" />
                <span
                  className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#4ADE80] md:text-[13px]"
                  style={{ fontFamily: "'Inter Tight', sans-serif" }}
                >
                  Clase gratuita en directo
                </span>
              </div>

              {/* Fecha y hora reales, salidas del ⚙️ de /webs */}
              <p
                className="wb-load mt-3 text-[15px] font-bold text-white md:text-[17px]"
                style={{ fontFamily: "'Inter Tight', sans-serif", animationDelay: "120ms" }}
              >
                {dateLabel}
              </p>

              {/* Titular: contraste de peso. Lo importante en Black 900 y verde de marca. */}
              <h1
                className="wb-tilt mt-5 max-w-[22ch] text-white [text-wrap:balance]"
                style={{
                  fontFamily: "'Inter Tight', sans-serif",
                  fontSize: "clamp(1.75rem, 5.4vw, 3.35rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.028em",
                  fontWeight: 300,
                }}
              >
                <span className="wb-line block" style={{ animationDelay: "180ms" }}>
                  Cómo ganar <span className="wb-key">de 2k a 4k al mes</span> en menos de{" "}
                  <span className="wb-key wb-key-white">90 días</span> con una{" "}
                  <span className="wb-key">profesión digital</span>
                </span>
                <span
                  className="wb-line block font-light text-[#A6ABB4]"
                  style={{
                    animationDelay: "330ms",
                    marginTop: "0.45rem",
                    fontSize: "clamp(1rem, 2.4vw, 1.5rem)",
                    lineHeight: 1.25,
                  }}
                >
                  aunque no tengas experiencia y partas de 0.
                </span>
              </h1>

              {/* Subtítulo (copy dictado por Marco) */}
              <p
                className="wb-load mt-6 max-w-2xl text-[15px] leading-relaxed text-[#C7CBD1] md:text-[17px]"
                style={{ animationDelay: "460ms" }}
              >
                Aprende una profesión digital desde cero, sin experiencia previa y sin dejar tu
                trabajo, y gana de <strong className="font-bold text-white">2.000&nbsp;€ a 4.000&nbsp;€ al mes</strong>{" "}
                trabajando para empresas que están buscando tu perfil:{" "}
                <span className="wb-money">más de 500.000 puestos de trabajo online</span> publicados
                al año en España.
              </p>
              <p className="wb-load mt-2.5 text-[11px] leading-snug text-[#6B7280]" style={{ animationDelay: "520ms" }}>
                Fuente: Informe Estado del Mercado Laboral en España 2024 · InfoJobs y Esade
              </p>

              {/* Cuenta atrás hasta el directo */}
              <div className="wb-load mt-9 w-full" style={{ animationDelay: "580ms" }}>
                <Countdown isoDate={webinarDate} time={webinarTime} />
              </div>
            </div>

            {/* ── Columna derecha: opt-in embebido ── */}
            <OptinCard />
          </div>
        </div>
      </section>

      {/* ════════ SECCIÓN 2 · EL VÍDEO (ya no en la primera pantalla) ════════ */}
      <section className="relative mx-auto max-w-4xl px-5 pb-4 pt-6 md:px-8 md:pb-10">
        <SectionLabel n="01" title="El evento" />
        <div data-reveal className="wb-reveal">
          <div className="wb-vsl group relative overflow-hidden rounded-2xl border border-[#22C55E]/25 bg-black">
            <div aria-hidden className="wb-vsl-glow" />
            {videoGuid ? (
              <iframe
                src={bunnyEmbedUrl(videoGuid, bunnyLibraryId)}
                loading="lazy"
                title="Presentación de la clase en directo · Adrián Villanueva"
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
                <p
                  className="text-[15px] font-bold text-[#F5F6F7]"
                  style={{ fontFamily: "'Inter Tight', sans-serif" }}
                >
                  El vídeo se está preparando
                </p>
                <p className="max-w-xs text-[12px] leading-snug text-[#8A8F99]">
                  En un momento estará aquí. Reserva tu plaza mientras tanto.
                </p>
              </div>
            )}
          </div>
        </div>
        <div data-reveal className="wb-reveal mt-8 flex justify-center">
          <MagneticButton onClick={goToForm}>Reservar mi plaza gratis</MagneticButton>
        </div>
      </section>

      {/* ════════ SECCIÓN 3 · HISTORIA DE ADRIÁN + GALERÍA ════════ */}
      <AdrianStory onOpen={goToForm} />

      {/* ════════ CTA FINAL ════════ */}
      <section className="mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <div data-reveal className="wb-reveal flex flex-col items-center gap-6 border-t border-[#2A2D34] pt-14 text-center">
          <h3
            className="mx-auto max-w-xl text-[1.7rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-white md:text-[2.4rem] [text-wrap:balance]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Reserva tu plaza. Es gratis y es en directo.
          </h3>
          <MagneticButton onClick={goToForm}>Reservar mi plaza gratis</MagneticButton>
        </div>
        <footer className="mt-16 flex items-center justify-between border-t border-[#1C1D22] pt-7 text-[13px] text-[#6B7280]">
          <span>Capital Hub</span>
          <span>Adrián Villanueva</span>
        </footer>
      </section>
    </main>
  )
}

/* ───────────────────── Etiqueta de sección ───────────────────── */
function SectionLabel({ n, title }: { n: string; title: string }) {
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

/* ───────────────────── Cuenta atrás ─────────────────────
   Arranca vacía y se rellena ya en el navegador: así el HTML del servidor y el del
   cliente coinciden siempre (nada de parpadeos raros ni avisos de hidratación). */
function Countdown({ isoDate, time }: { isoDate: string; time: string }) {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    const target = webinarTargetMs(isoDate, time)
    if (target == null) return
    const tick = () => setLeft(Math.max(0, target - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isoDate, time])

  const started = left !== null && left <= 0
  const sec = left === null ? null : Math.floor(left / 1000)
  const units: { value: number | null; label: string }[] = [
    { value: sec === null ? null : Math.floor(sec / 86400), label: "días" },
    { value: sec === null ? null : Math.floor((sec % 86400) / 3600), label: "horas" },
    { value: sec === null ? null : Math.floor((sec % 3600) / 60), label: "min" },
    { value: sec === null ? null : sec % 60, label: "seg" },
  ]

  return (
    <div>
      <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8A8F99]">
        {started ? "La clase ya empezó" : "Empieza en"}
      </p>
      <div className="grid max-w-md grid-cols-4 gap-2.5 md:gap-3">
        {units.map((u, i) => (
          <div key={u.label} className="wb-count relative overflow-hidden rounded-xl px-1 py-3 text-center md:py-4">
            <span aria-hidden className="wb-count-glow" />
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
            {i === 3 && !started && <span aria-hidden className="wb-count-tick" />}
          </div>
        ))}
      </div>
    </div>
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
      className="wb-load wb-card relative w-full scroll-mt-24 overflow-hidden rounded-2xl p-6 md:p-7 lg:sticky lg:top-8"
      style={{ animationDelay: "300ms" }}
    >
      <span aria-hidden className="wb-card-glow" />
      <div className="relative z-10">
        <h2
          className="text-[1.35rem] font-extrabold leading-tight tracking-[-0.02em] text-white md:text-[1.6rem]"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Reserva tu plaza
        </h2>
        <p className="mt-1.5 text-[13px] text-[#A6ABB4] md:text-sm">
          Deja tus datos para acceder al directo.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
          <Field id="fullName" label="Tu nombre" value={fullName} onChange={setFullName} placeholder="Tu nombre" autoComplete="name" disabled={loading} />
          <Field id="email" label="Tu mejor email" type="email" value={email} onChange={setEmail} placeholder="tu@email.com" autoComplete="email" disabled={loading} />
          <Field id="phone" label="Tu teléfono" type="tel" value={phone} onChange={setPhone} placeholder="+34 600 00 00 00" autoComplete="tel" disabled={loading} />

          {error && (
            <div className="rounded-md border-l-2 border-[#4ADE80] bg-[#22C55E]/10 py-2 pl-3 text-sm text-[#F5F6F7]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="wb-send group relative inline-flex h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-[15px] font-extrabold text-[#08130C] transition-opacity disabled:opacity-60"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {loading ? (
              <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
            ) : (
              <>
                <span aria-hidden className="wb-send-shine" />
                <span className="relative z-10">Reservar mi plaza</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </button>

          <p className="pt-0.5 text-center text-xs text-[#8A8F99]">Es gratis. Plazas limitadas.</p>
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
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-[#A6ABB4]">
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
        className="h-12 w-full rounded-xl border border-[#3F3F46] bg-[#18181B] px-4 text-base text-[#F5F6F7] transition-colors placeholder:text-[#6B7280] focus:border-[#4ADE80] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/35"
      />
    </div>
  )
}

/* ───────────────────── Historia de Adrián + galería ───────────────────── */
function AdrianStory({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel n="02" title="Historia" />

      <h2
        data-reveal
        className="wb-reveal mb-2 text-center text-[1.7rem] font-extrabold tracking-[-0.02em] text-white md:text-[2.5rem]"
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        La profesión que me dio la libertad
      </h2>
      <p data-reveal className="wb-reveal mb-8 text-center text-[13px] text-[#8A8F99]">La historia de Adrián</p>

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
        className="wb-reveal mx-auto max-w-2xl space-y-4 text-center text-[15px] leading-relaxed text-[#C7CBD1] md:text-base [&_strong]:font-bold [&_strong]:text-white"
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
        <div className="flex justify-center pt-5">
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
      className="wb-cta group relative inline-flex h-[54px] items-center justify-center gap-2.5 overflow-hidden rounded-xl px-7 text-[15px] font-extrabold text-[#08130C]"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      <span aria-hidden className="wb-cta-shine" />
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  )
}

/* ───────────────────── Estilos ───────────────────── */
function WbStyles() {
  return (
    <style>{`
      /* Acento VERDE OFICIAL del brandkit. Nada de inventar colores fuera de estos dos. */
      .wb-root {
        --px: 0; --py: 0;
        --acc: #22C55E;      /* verde oficial: botones, bordes */
        --acc-2: #4ADE80;    /* verde claro oficial: iconos y texto sobre oscuro */
        --acc-ink: #08130C;  /* tinta sobre verde (contraste, SOP 47) */
        --acc-rgb: 34, 197, 94;
      }

      /* Capas de color del fondo: se mueven con el puntero (parallax). */
      .wb-layer, .wb-orb { position: absolute; pointer-events: none; z-index: 0; will-change: transform; transition: transform 0.3s cubic-bezier(0.22,0.61,0.36,1); }
      .wb-glow-a { inset: 0; background: radial-gradient(820px 460px at 78% -6%, rgba(var(--acc-rgb),0.20), transparent 66%); transform: translate3d(calc(var(--px) * -8px), calc(var(--py) * -8px), 0); }
      .wb-glow-b { inset: 0; background: radial-gradient(900px 520px at 18% 4%, rgba(245,246,247,0.06), transparent 68%); transform: translate3d(calc(var(--px) * -4px), calc(var(--py) * -4px), 0); }
      .wb-orb { border-radius: 9999px; filter: blur(48px); opacity: 0.6; }
      .wb-orb-1 { width: 340px; height: 340px; top: 4%; right: -70px; background: radial-gradient(circle, rgba(var(--acc-rgb),0.55), transparent 70%); transform: translate3d(calc(var(--px) * -26px), calc(var(--py) * -26px), 0); animation: wb-float1 11s ease-in-out infinite; }
      .wb-orb-2 { width: 280px; height: 280px; bottom: 4%; left: -60px; background: radial-gradient(circle, rgba(74,222,128,0.24), transparent 70%); transform: translate3d(calc(var(--px) * -18px), calc(var(--py) * -18px), 0); animation: wb-float2 13s ease-in-out infinite; }
      .wb-orb-3 { width: 200px; height: 200px; top: 46%; left: 22%; background: radial-gradient(circle, rgba(245,246,247,0.07), transparent 70%); transform: translate3d(calc(var(--px) * -34px), calc(var(--py) * -34px), 0); animation: wb-float1 16s ease-in-out infinite; }
      @keyframes wb-float1 { 0%,100% { margin-top: 0; } 50% { margin-top: -22px; } }
      @keyframes wb-float2 { 0%,100% { margin-top: 0; } 50% { margin-top: 20px; } }
      .wb-grain { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
      .wb-vignette { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(130% 120% at 50% 0%, transparent 58%, rgba(0,0,0,0.55) 100%); }

      /* Titular: leve inclinación 3D según el puntero + palabras clave en verde de marca */
      .wb-tilt { transform-style: preserve-3d; perspective: 1000px; }
      .wb-tilt { transform: rotateX(calc(var(--py) * -2deg)) rotateY(calc(var(--px) * 3deg)); transform-origin: 20% 50%; transition: transform 0.3s cubic-bezier(0.22,0.61,0.36,1); }
      .wb-key { font-weight: 900; color: var(--acc-2); }
      .wb-key-white { background: none; color: #FFFFFF; }

      /* Motif del marcador: subrayado a mano alzada sobre el dato clave */
      .wb-money { position: relative; color: var(--acc-2); font-weight: 700; }
      .wb-money::after { content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 2px; background: linear-gradient(90deg, transparent, var(--acc), transparent); transform: scaleX(0); transform-origin: left; animation: wb-underline 0.9s cubic-bezier(0.22,0.61,0.36,1) 1.1s forwards; }
      @keyframes wb-underline { to { transform: scaleX(1); } }

      /* Cuenta atrás */
      .wb-count { border: 1px solid rgba(var(--acc-rgb),0.28); background: linear-gradient(180deg, rgba(var(--acc-rgb),0.10), rgba(20,20,24,0.9)); box-shadow: 0 12px 34px -22px rgba(var(--acc-rgb),0.9); }
      .wb-count-glow { position: absolute; inset: 0; background: radial-gradient(120% 80% at 50% 0%, rgba(var(--acc-rgb),0.24), transparent 70%); }
      .wb-count-tick { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--acc-3), transparent); animation: wb-tick 1s steps(1,end) infinite; }
      @keyframes wb-tick { 0%,49% { opacity: 1; } 50%,100% { opacity: 0.15; } }

      /* Tarjeta del opt-in */
      .wb-card { border: 1px solid rgba(var(--acc-rgb),0.30); background: linear-gradient(180deg, #17181C 0%, #101013 100%); box-shadow: 0 30px 80px -40px rgba(var(--acc-rgb),0.95), 0 0 0 1px rgba(255,255,255,0.02) inset; }
      .wb-card-glow { position: absolute; inset: 0; background: radial-gradient(420px 200px at 50% -10%, rgba(var(--acc-rgb),0.22), transparent 70%); pointer-events: none; }

      .wb-load { opacity: 0; transform: translateY(14px); animation: wb-load 0.7s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-load { to { opacity: 1; transform: translateY(0); } }
      .wb-line { opacity: 0; transform: translateY(18px); animation: wb-line 0.8s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-line { to { opacity: 1; transform: translateY(0); } }

      .wb-dot { display:inline-block; width:7px; height:7px; border-radius:9999px; background:var(--acc-2); box-shadow:0 0 0 0 rgba(var(--acc-rgb),0.6); animation: wb-pulse 2.4s ease-out infinite; }
      @keyframes wb-pulse { 0%{box-shadow:0 0 0 0 rgba(var(--acc-rgb),0.55)} 70%{box-shadow:0 0 0 7px rgba(var(--acc-rgb),0)} 100%{box-shadow:0 0 0 0 rgba(var(--acc-rgb),0)} }

      .wb-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s cubic-bezier(0.22,0.61,0.36,1), transform 0.7s cubic-bezier(0.22,0.61,0.36,1); }
      .wb-reveal.wb-in { opacity: 1; transform: translateY(0); }

      /* Botones: verde oficial con barrido de brillo */
      .wb-cta, .wb-send { background: var(--acc); color: var(--acc-ink); box-shadow: 0 16px 44px -18px rgba(var(--acc-rgb),0.95); transition: transform 0.25s cubic-bezier(0.22,0.61,0.36,1), box-shadow 0.25s ease; will-change: transform; }
      .wb-cta:hover, .wb-send:hover { box-shadow: 0 22px 56px -16px rgba(var(--acc-rgb),1); }
      .wb-cta-shine, .wb-send-shine { position:absolute; inset:0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%); transform: translateX(-120%); animation: wb-shine 2.8s ease-in-out 0.4s infinite; }
      @keyframes wb-shine { 0%{transform:translateX(-120%)} 45%,100%{transform:translateX(120%)} }

      /* Vídeo (sección 01) */
      .wb-vsl { position: relative; width: 100%; aspect-ratio: 16 / 9; box-shadow: 0 30px 90px -50px rgba(var(--acc-rgb),0.9); }
      .wb-vsl-glow { position: absolute; inset: -1px; border-radius: 1rem; background: radial-gradient(600px 220px at 50% 0%, rgba(var(--acc-rgb),0.20), transparent 70%); pointer-events: none; z-index: 1; }

      /* Galería */
      .wb-gallery { scrollbar-width: none; }
      .wb-gallery::-webkit-scrollbar { display: none; }
      .wb-shot { opacity: 0; transform: translateY(18px) scale(0.98); animation: wb-shot 0.6s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes wb-shot { to { opacity: 1; transform: translateY(0) scale(1); } }

      @media (prefers-reduced-motion: reduce) {
        .wb-load, .wb-line, .wb-reveal, .wb-orb, .wb-grain, .wb-dot, .wb-shot, .wb-money::after, .wb-cta-shine, .wb-send-shine, .wb-count-tick { animation: none !important; transition: none !important; }
        .wb-load, .wb-line, .wb-reveal, .wb-shot { opacity: 1 !important; transform: none !important; }
        .wb-layer, .wb-orb { transform: none !important; }
        .wb-tilt { transform: none !important; }
      }
    `}</style>
  )
}
