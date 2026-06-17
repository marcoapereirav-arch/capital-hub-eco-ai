"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"

/**
 * Landing del Funnel Test Personalidad.
 * Brandkit Capital Hub aplicado: paleta minimalista B&W.
 *   BG primary: #0F0F12 · Containers: #2A2D34 · Text: #F5F6F7 · Accent: #FFFFFF
 *   Fonts: Inter Tight (display) · Inter (body) · JetBrains Mono (labels mono)
 */
export function TestPersonalidadLanding() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Pon tu nombre completo")
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Pon un email válido")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/optin/test-personalidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim() }),
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
    <main
      className="min-h-[100dvh] text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-2xl mx-auto px-5 py-12 md:py-20 flex flex-col min-h-[100dvh]">
        {/* Marca */}
        <div className="mb-12 md:mb-20">
          <span
            className="text-[11px] uppercase tracking-[0.25em] text-[#9CA3AF]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Capital Hub
          </span>
        </div>

        {/* Promesa */}
        <div className="flex-1 flex flex-col justify-center">
          <p
            className="text-[10px] uppercase tracking-[0.3em] text-[#9CA3AF] mb-5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Test gratuito · 3 minutos
          </p>

          <h1
            className="text-3xl md:text-5xl font-medium leading-[1.05] tracking-tight mb-6 text-white"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Descubre qué tipo de emprendedor eres
            <span className="block text-[#9CA3AF] mt-2">y qué camino te lleva a vivir de internet.</span>
          </h1>

          <p className="text-base md:text-lg text-[#D1D5DB] leading-relaxed mb-10 max-w-xl">
            Te enviamos el test al instante. Lo haces en 3 minutos y verás claro qué modelo de
            negocio encaja contigo y por dónde empezar.
          </p>

          {/* Form opt-in */}
          <form onSubmit={onSubmit} className="space-y-3 max-w-md">
            <div>
              <label
                htmlFor="fullName"
                className="block text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF] mb-1.5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Nombre completo
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
                Email
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
                  Enviarme el test
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p
              className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280] leading-relaxed pt-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Te enviamos solo lo necesario. Sin spam. Cero.
            </p>
          </form>
        </div>

        {/* Footer */}
        <footer
          className="pt-12 text-[10px] uppercase tracking-[0.2em] text-[#6B7280]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>
    </main>
  )
}
