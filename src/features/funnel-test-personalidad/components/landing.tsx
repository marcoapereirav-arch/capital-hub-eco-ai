"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, X } from "lucide-react"

/**
 * Landing del Funnel Test Personalidad (test de Equilibria).
 * Brandkit Capital Hub: paleta minimalista B&W.
 *   BG primary: #0F0F12 · Containers: #2A2D34 · Text: #F5F6F7 · Accent: #FFFFFF
 *   Fonts: Inter Tight (display) · Inter (body) · JetBrains Mono (labels mono)
 *
 * Estructura (copy de Marco):
 *   1. Hero — promesa + botón que abre el pop-up del formulario.
 *   2. "Qué es este test" — Equilibria + resultado en 4 colores + botón al pop-up.
 *   Pop-up — formulario opt-in (nombre · email · teléfono, los 3 obligatorios).
 *
 * El vídeo de Adrián se añade más adelante (de momento la landing va sin vídeo).
 */
export function TestPersonalidadLanding() {
  const [open, setOpen] = useState(false)

  return (
    <main
      className="min-h-[100dvh] text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        {/* Marca */}
        <header className="pt-10 md:pt-14">
          <span
            className="text-[11px] uppercase tracking-[0.25em] text-[#9CA3AF]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Capital Hub
          </span>
        </header>

        {/* SECCIÓN 1 — Hero */}
        <section className="pt-14 md:pt-24 pb-16 md:pb-24">
          <p
            className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#9CA3AF] mb-6"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Test gratis · 15 minutos · +500.000 personas lo han hecho
          </p>

          <h1
            className="text-[2rem] leading-[1.08] md:text-[3.25rem] md:leading-[1.05] font-medium tracking-tight text-white mb-6"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Hay mil formas de vivir de internet.
            <span className="block text-[#9CA3AF] mt-2">Esta te dice cuál es la tuya</span>
          </h1>

          <p className="text-base md:text-lg text-[#D1D5DB] leading-relaxed max-w-2xl mb-10">
            Llevas años estudiando algo que no te renta o currando en algo que odias. Existe otra
            vía: una profesión digital con la que vivir bien, sin montar un negocio. El problema es
            que nadie te dice cuál encaja contigo. Este test sí, en 15 minutos. Gratis.
          </p>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto h-13 px-7 py-3.5 rounded-none bg-white hover:bg-[#F5F6F7] text-[#0F0F12] font-semibold inline-flex items-center justify-center gap-2 transition-colors text-base"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Quiero hacer el test gratis
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        {/* Separador fino */}
        <div className="h-px bg-[#2A2D34]" />

        {/* SECCIÓN 2 — Qué es este test */}
        <section className="pt-16 md:pt-24 pb-20 md:pb-28">
          <h2
            className="text-2xl md:text-4xl font-medium tracking-tight text-white mb-8"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Qué es este test
          </h2>

          <div className="space-y-5 max-w-2xl mb-10">
            <div className="border-l-2 border-white pl-5">
              <p className="text-base md:text-lg text-[#D1D5DB] leading-relaxed">
                Es el test de <strong className="text-white">Equilibria</strong>, el mismo que usan
                grandes multinacionales para colocar a cada persona donde rinde. Lo han hecho más de
                500.000 personas.
              </p>
            </div>
            <div className="border-l-2 border-[#2A2D34] pl-5">
              <p className="text-base md:text-lg text-[#D1D5DB] leading-relaxed">
                Te da un resultado en <strong className="text-white">cuatro colores</strong> que te
                enseña tus fortalezas y tus limitadores. Con eso sabes qué tipo de profesión digital
                va contigo de verdad, no la que te suena guay y a los tres meses odias.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full sm:w-auto h-13 px-7 py-3.5 rounded-none bg-white hover:bg-[#F5F6F7] text-[#0F0F12] font-semibold inline-flex items-center justify-center gap-2 transition-colors text-base"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Hacer el test gratis
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        {/* Footer */}
        <footer
          className="pb-12 text-[10px] uppercase tracking-[0.2em] text-[#6B7280]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>

      {open && <OptinModal onClose={() => setOpen(false)} />}
    </main>
  )
}

/**
 * Pop-up del formulario opt-in. Se abre desde cualquiera de los botones de la landing.
 */
function OptinModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cerrar con ESC + bloquear scroll del body mientras está abierto
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
      const res = await fetch("/api/optin/test-personalidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? "Algo salió mal. Inténtalo otra vez.")
        setLoading(false)
        return
      }
      router.push("/test-personalidad/gracias")
    } catch {
      setError("Sin conexión. Revisa tu internet y vuelve a intentarlo.")
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
      style={{ backgroundColor: "rgba(15,15,18,0.8)" }}
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto border border-[#2A2D34] bg-[#0F0F12] p-6 sm:p-7"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => !loading && onClose()}
          disabled={loading}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-[#9CA3AF] hover:text-white transition-colors disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>

        <h3
          className="text-xl md:text-2xl font-medium tracking-tight text-white mb-6 pr-8"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Déjame tus datos y entra al test
        </h3>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="fullName"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF] mb-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Tu nombre
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full h-12 rounded-none border border-[#3F3F46] bg-[#18181B] px-4 text-base text-[#F5F6F7] placeholder:text-[#6B7280] focus:border-white focus:outline-none focus:ring-1 focus:ring-white/30"
              autoComplete="name"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF] mb-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Tu mejor email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full h-12 rounded-none border border-[#3F3F46] bg-[#18181B] px-4 text-base text-[#F5F6F7] placeholder:text-[#6B7280] focus:border-white focus:outline-none focus:ring-1 focus:ring-white/30"
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF] mb-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Tu teléfono
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 00 00 00"
              className="w-full h-12 rounded-none border border-[#3F3F46] bg-[#18181B] px-4 text-base text-[#F5F6F7] placeholder:text-[#6B7280] focus:border-white focus:outline-none focus:ring-1 focus:ring-white/30"
              autoComplete="tel"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-[#F5F6F7] border-l-2 border-white pl-3 py-1">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-none bg-white hover:bg-[#F5F6F7] text-[#0F0F12] font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Quiero hacer el test gratis
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-xs text-[#9CA3AF] leading-relaxed pt-1 text-center">
            Te llega tu acceso y entras directo al test. Sin tarjeta, sin compromiso.
          </p>
        </form>
      </div>
    </div>
  )
}
