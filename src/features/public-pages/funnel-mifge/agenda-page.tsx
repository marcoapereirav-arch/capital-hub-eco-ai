"use client"

import React, { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Calendar } from "lucide-react"
import CustomCursor from "@/features/public-pages/funnel-lt8/components/CustomCursor"
import { CalendarBooker } from "./components/CalendarBooker"
import "@/features/public-pages/funnel-lt8/styles.css"

function MifgeAgendaInner() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get("lead_id") ?? undefined

  return (
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden">
      <CustomCursor />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>

      <main className="py-12 md:py-20">
        <div className="container mx-auto px-6 max-w-3xl">

          {/* Header */}
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 border border-[#2A2D34] bg-[#18181B] px-3 py-2 rounded-[2px] mb-6">
              <Calendar size={14} className="text-[#37ca37]" />
              <span className="font-mono text-xs text-[#37ca37] uppercase tracking-wide">ÚLTIMO PASO · GRATIS</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl leading-tight uppercase mb-5">
              <span className="weight-light">Antes de irte...</span>
              <br />
              <span className="weight-bold">Agenda 20 min con Adrián</span>
            </h1>
            <p className="text-[#9CA3AF] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Una llamada gratuita de diagnóstico para arrancar tu primer mes con la mejor estrategia personalizada.
            </p>
          </div>

          {/* QUÉ SE HABLA — versión compacta */}
          <div className="border border-[#2A2D34] bg-[#18181B] rounded-[4px] p-5 md:p-6 mb-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#6B7280] mb-3">En esta llamada</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
              {[
                "Analizamos tu situación y objetivos",
                "Te decimos qué profesión digital encaja contigo",
                "Diseñamos tu plan personalizado de 90 días",
                "Resolvemos todas tus dudas",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <Check size={12} className="text-[#37ca37] mt-1 flex-shrink-0" />
                  <span className="text-[#D1D5DB] text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CALENDAR PROPIO */}
          <CalendarBooker leadId={leadId} successUrl="/mifge/llamada-confirmada" />

        </div>
      </main>
    </div>
  )
}

export default function MifgeAgendaPage() {
  return (
    <Suspense fallback={null}>
      <MifgeAgendaInner />
    </Suspense>
  )
}
