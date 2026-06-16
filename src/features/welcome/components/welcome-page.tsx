"use client"

import { useEffect } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

/**
 * Pantalla de bienvenida tras aceptar invitación o tras login inicial.
 * Confetti animado + mensaje simple + botón a /dashboard.
 *
 * Copy aprobado por Marco: simple, sin fliparse.
 */
export function WelcomePage() {
  useEffect(() => {
    // Disparo de confetti al montar — 3 ráfagas para efecto cinético
    const fire = (originX: number, delay: number) => {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: originX, y: 0.6 },
          colors: ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ec4899"],
          startVelocity: 35,
          decay: 0.92,
        })
      }, delay)
    }
    fire(0.5, 0)
    fire(0.25, 250)
    fire(0.75, 500)
  }, [])

  return (
    <main className="min-h-[100dvh] bg-black text-white flex items-center justify-center relative overflow-hidden px-4">
      {/* Fondo: gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-black to-cyan-900/10 pointer-events-none" />
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 text-violet-400 mb-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em]">
            Capital Hub
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
          Bienvenido a <span className="text-violet-400">Capital Hub OS</span>
        </h1>

        <p className="text-base text-zinc-400 max-w-sm mx-auto">
          Ya tienes acceso al sistema operativo del negocio.
        </p>

        <div className="pt-4">
          <Button asChild size="lg" className="bg-violet-500 hover:bg-violet-400 text-white">
            <Link href="/dashboard">
              Entrar al dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
