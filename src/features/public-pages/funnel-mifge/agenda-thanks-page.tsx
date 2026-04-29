"use client"

import React from "react"
import CustomCursor from "@/features/public-pages/funnel-lt8/components/CustomCursor"
import Confetti from "@/features/public-pages/funnel-lt8/components/Confetti"
import "@/features/public-pages/funnel-lt8/styles.css"

export default function MifgeAgendaThanksPage() {
  return (
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden">
      <CustomCursor />
      <Confetti />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>

      <header className="fixed top-0 left-0 w-full z-40 py-4 md:py-6">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="font-serif text-sm md:text-2xl font-medium tracking-[0.15em] md:tracking-[0.25em] uppercase text-white">Capital Hub</div>
        </div>
      </header>

      <div className="relative min-h-[50vh] flex items-center justify-center pt-32 pb-12">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 md:gap-3 border border-[#2A2D34] bg-[#18181B] px-3 md:px-4 py-2 rounded-[2px] mb-8">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow: "0 0 5px #10B981" }}></span>
            <span className="text-[9px] md:text-xs uppercase tracking-wide leading-tight">
              <span className="text-green-500 font-semibold">LLAMADA</span> <span className="text-[#9CA3AF]">CONFIRMADA</span>
            </span>
          </div>
          <h1 className="font-serif font-semibold uppercase text-3xl md:text-5xl lg:text-6xl text-white leading-tight">¡TU LLAMADA ESTÁ CONFIRMADA!</h1>
        </div>
      </div>

      <section className="py-12 md:py-16 bg-[#111113] border-t border-b border-[#2A2D34]">
        <div className="container mx-auto px-6 max-w-2xl">
          <h3 className="font-serif text-xl md:text-2xl text-white mb-8">Antes de tu llamada:</h3>
          <div className="flex flex-col gap-6 mb-8">
            {[
              "Revisa tu email — recibirás la confirmación con fecha y hora",
              "Piensa en tu situación actual — ¿qué te gustaría cambiar profesionalmente?",
              "Anota tus dudas — así aprovechamos al máximo nuestra sesión",
              "Asegúrate de estar en un lugar tranquilo con buena conexión",
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <span className="font-mono text-[#2A2D34] text-xl">{i + 1}.</span>
                <p className="text-[#D1D5DB]">{step}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#2A2D34] pt-8">
            <p className="font-serif text-lg text-white mb-1">Nos vemos en la llamada,</p>
            <p className="text-white mb-1">Adrián Villanueva</p>
            <p className="text-[#9CA3AF] text-sm">Fundador, Capital Hub</p>
          </div>
        </div>
      </section>
    </div>
  )
}
