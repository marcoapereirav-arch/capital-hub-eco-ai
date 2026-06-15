"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, ArrowRight } from "lucide-react"

/**
 * Landing del Funnel Test Personalidad.
 * Opt-in simple: nombre + email. Submit → POST /api/optin/test-personalidad → /gracias
 *
 * Estilo: minimalismo dark con acento violeta (alineado con la propuesta de marca).
 * Decision: una sola promesa visible. Sin ruido. El test es el gancho.
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
    <main className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
      {/* Fondo: gradiente sutil violeta-azul */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-black to-blue-900/10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-5 py-12 md:py-20 flex flex-col min-h-[100dvh]">
        {/* Logo / nombre marca */}
        <div className="flex items-center gap-2 mb-12 md:mb-20">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
            Capital Hub
          </span>
        </div>

        {/* Promesa */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-violet-400 mb-4">
            Test gratuito · 3 minutos
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold leading-[1.1] tracking-tight mb-5">
            Descubre qué tipo de emprendedor eres
            <span className="block text-violet-400 mt-2">y qué camino te lleva a vivir de internet.</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-300 leading-relaxed mb-10 max-w-xl">
            Te enviamos el test al instante. Lo haces en 3 minutos y verás claro qué modelo de
            negocio encaja contigo y por dónde empezar.
          </p>

          {/* Form opt-in */}
          <form onSubmit={onSubmit} className="space-y-3 max-w-md">
            <div>
              <label htmlFor="fullName" className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full h-12 rounded-md border border-zinc-700 bg-zinc-900/60 px-4 text-base placeholder:text-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                autoComplete="name"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full h-12 rounded-md border border-zinc-700 bg-zinc-900/60 px-4 text-base placeholder:text-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-md bg-violet-500 hover:bg-violet-400 text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
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

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Te enviamos solo lo necesario para entregarte el test. Sin spam. Cero.
            </p>
          </form>
        </div>

        {/* Footer */}
        <footer className="pt-12 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>
    </main>
  )
}
