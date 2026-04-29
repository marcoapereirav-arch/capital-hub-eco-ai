"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Check, Calendar, ArrowUpRight } from "lucide-react"
import CustomCursor from "@/features/public-pages/funnel-lt8/components/CustomCursor"
import "@/features/public-pages/funnel-lt8/styles.css"

const NEXT_STEP = "/mifge/llamada-confirmada"

export default function MifgeAgendaPage() {
  const router = useRouter()

  function handleBook() {
    // TODO: integrar calendar propio. Por ahora redirige a confirmación.
    router.push(NEXT_STEP)
  }

  return (
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden">
      <CustomCursor />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>

      <main className="py-16 md:py-24 min-h-screen flex items-center">
        <div className="container mx-auto px-6 max-w-3xl">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 border border-[#2A2D34] bg-[#18181B] px-3 py-2 rounded-[2px] mb-6">
              <Calendar size={14} className="text-[#37ca37]" />
              <span className="font-mono text-xs text-[#37ca37] uppercase tracking-wide">ÚLTIMO PASO · GRATIS</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl leading-tight uppercase mb-6">
              <span className="weight-light">Antes de irte...</span>
              <br />
              <span className="weight-bold">Agenda 20 min con Adrián</span>
            </h1>
            <p className="text-[#9CA3AF] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Una llamada gratuita de diagnóstico para arrancar tu primer mes con la mejor estrategia personalizada.
            </p>
          </div>

          {/* CARD QUÉ SE HABLA */}
          <div className="card-bordered max-w-2xl mx-auto mb-10" style={{ borderColor: "rgba(55, 202, 55, 0.3)" }}>
            <div className="glow-effect" style={{ opacity: 0.3 }}></div>
            <h3 className="font-serif text-xl text-white mb-2 text-center">EN ESTA LLAMADA:</h3>
            <p className="text-[#9CA3AF] text-sm text-center mb-8">20 minutos · Sin compromiso · 100% gratis</p>

            <ul className="space-y-4 max-w-md mx-auto">
              {[
                "Analizamos tu situación actual y tus objetivos profesionales",
                "Te decimos qué profesión digital encaja mejor contigo",
                "Diseñamos tu plan personalizado de los próximos 90 días",
                "Resolvemos todas tus dudas sobre el programa",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className="check-box-square mt-0.5"><Check size={12} /></div>
                  <span className="text-[#D1D5DB] text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA PRINCIPAL */}
          <button
            onClick={handleBook}
            className="btn-green w-full max-w-md mx-auto block py-5 font-mono uppercase text-sm md:text-base tracking-wider rounded-[2px] flex items-center justify-center gap-3 mb-4"
          >
            AGENDAR MI LLAMADA AHORA
            <ArrowUpRight size={20} />
          </button>

          <p className="text-center text-[#6B7280] font-mono text-xs">(Plazas limitadas cada día)</p>
        </div>
      </main>
    </div>
  )
}
