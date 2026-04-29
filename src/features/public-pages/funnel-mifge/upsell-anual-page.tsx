"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, ArrowUpRight } from "lucide-react"
import CustomCursor from "@/features/public-pages/funnel-lt8/components/CustomCursor"
import "@/features/public-pages/funnel-lt8/styles.css"

const NEXT_STEP = "/mifge/agenda"

export default function MifgeUpsellAnualPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  function handleAccept() {
    // TODO: cargar plan anual via Stripe
    router.push(NEXT_STEP)
  }

  function handleDecline() {
    router.push(NEXT_STEP)
  }

  if (loading) {
    return (
      <div className="funnel-lt8-root fixed inset-0 bg-[#0F0F12] z-50 flex items-center justify-center text-white px-6 text-center">
        <div className="flex flex-col items-center gap-4 max-w-full">
          <h2 className="font-serif text-2xl md:text-4xl tracking-widest animate-pulse break-words">CAPITAL HUB</h2>
          <div className="w-32 md:w-48 h-[1px] bg-[#2A2D34] overflow-hidden">
            <div className="h-full bg-white w-full origin-left animate-grow"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden">
      <CustomCursor />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>

      {/* WARNING STICKY ARRIBA */}
      <div className="sticky top-0 z-50 bg-amber-500 text-black py-3 text-center">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="uppercase tracking-wide">NO CIERRES ESTA PESTAÑA — TU CONFIRMACIÓN SE PROCESA EN 60s</span>
        </div>
      </div>

      <main className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-3xl">

          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs text-[#37ca37] uppercase tracking-widest border border-[#37ca37]/30 px-3 py-1 rounded-[2px] mb-6 inline-block">
              ESPERA — UNA OPORTUNIDAD ÚNICA
            </span>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-tight uppercase mb-6">
              <span className="weight-light">Antes de continuar...</span>
              <br />
              <span className="weight-bold">¿Quieres ahorrar 194€?</span>
            </h1>
            <p className="text-[#9CA3AF] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Cambia ahora a Plan Anual y consigue <span className="text-white font-semibold">2 meses gratis</span> + features exclusivos.
              <br />
              <span className="text-[#6B7280] text-sm">Esta oferta solo aparece una vez. Si la pasas, no la verás más.</span>
            </p>
          </div>

          {/* CARD CON PRECIO */}
          <div className="border border-[#37ca37]/40 bg-gradient-to-br from-[#0F0F12] to-[#37ca37]/5 rounded-[4px] p-8 md:p-12 mb-10">
            <div className="text-center mb-8">
              <p className="font-mono text-[#6B7280] text-sm uppercase mb-4">PLAN ANUAL CAPITAL HUB PRO · PLACEHOLDER</p>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-[#6B7280] text-2xl line-through font-mono">1.164€</span>
                <span className="font-serif text-6xl md:text-7xl text-white">970€</span>
                <span className="text-[#9CA3AF] text-sm">/año</span>
              </div>
              <p className="text-[#37ca37] font-semibold text-sm uppercase tracking-wide">Ahorras 194€ — 2 meses gratis</p>
            </div>

            <ul className="space-y-3 mb-8 max-w-md mx-auto">
              {[
                "Todo lo del plan mensual",
                "2 meses gratis (sale ~80€/mes)",
                "Sesiones grupales en directo cada semana",
                "Acceso prioritario a las nuevas formaciones",
                "Comunidad anual privada",
                "[Placeholder — pendiente definir features finales]",
              ].map((line, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Check size={16} className="text-[#37ca37] mt-0.5 flex-shrink-0" />
                  <span className="text-[#D1D5DB] text-sm md:text-base">{line}</span>
                </li>
              ))}
            </ul>

            {/* BOTÓN SÍ — enorme */}
            <button
              onClick={handleAccept}
              className="btn-green w-full py-5 font-mono uppercase text-sm md:text-base tracking-wider rounded-[2px] flex items-center justify-center gap-3 mb-4"
            >
              SÍ, QUIERO AHORRAR 194€ Y CAMBIAR A ANUAL
              <ArrowUpRight size={20} />
            </button>

            {/* BOTÓN NO — pequeño y discreto */}
            <button
              onClick={handleDecline}
              className="block mx-auto text-[#4B5563] text-xs underline underline-offset-4 hover:text-[#6B7280] transition-colors"
            >
              no gracias, prefiero pagar mes a mes
            </button>
          </div>

          {/* TRUST DISCRETO */}
          <p className="text-center text-[#4B5563] font-mono text-xs">
            Pago único anual · Acceso completo · Cancela en cualquier momento si no te convence (garantía 30 días)
          </p>
        </div>
      </main>
    </div>
  )
}
