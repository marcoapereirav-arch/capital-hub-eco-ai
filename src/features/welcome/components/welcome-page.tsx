"use client"

import { useEffect } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

/**
 * Pantalla de bienvenida tras aceptar invitación o tras login inicial.
 * Brandkit Capital Hub aplicado: minimalista b&w.
 * Confetti animado en blanco/grays (sin neón).
 */
export function WelcomePage() {
  useEffect(() => {
    // Confetti en paleta del brandkit (whites + grays — sin neón)
    const fire = (originX: number, delay: number) => {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: originX, y: 0.6 },
          colors: ["#FFFFFF", "#F5F6F7", "#D1D5DB", "#9CA3AF"],
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
    <main
      className="min-h-[100dvh] flex items-center justify-center px-4 text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-md w-full text-center space-y-7">
        <span
          className="block text-[11px] uppercase tracking-[0.3em] text-[#9CA3AF] mb-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Capital Hub
        </span>

        <h1
          className="text-4xl md:text-5xl font-medium leading-tight tracking-tight text-white"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Bienvenido a Capital Hub OS
        </h1>

        <p className="text-base text-[#D1D5DB] max-w-sm mx-auto">
          Ya tienes acceso al sistema operativo del negocio.
        </p>

        <div className="pt-4">
          <Button
            asChild
            size="lg"
            className="rounded-none bg-white text-[#0F0F12] hover:bg-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
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
