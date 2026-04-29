"use client"

import React from "react"
import { Check, ShieldCheck } from "lucide-react"
import CustomCursor from "@/features/public-pages/funnel-lt8/components/CustomCursor"
import Confetti from "@/features/public-pages/funnel-lt8/components/Confetti"
import "@/features/public-pages/funnel-lt8/styles.css"

export default function MifgeThanksPage() {
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

      <div className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-12">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 md:gap-3 border border-[#2A2D34] bg-[#18181B] px-3 md:px-4 py-2 rounded-[2px] mb-8">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow: "0 0 5px #10B981" }}></span>
            <span className="text-[9px] md:text-xs uppercase tracking-wide leading-tight">
              <span className="text-green-500 font-semibold">PRUEBA GRATUITA</span> <span className="text-[#9CA3AF]">ACTIVADA</span>
            </span>
          </div>
          <h1 className="font-serif font-semibold uppercase text-3xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">¡BIENVENIDO A CAPITAL HUB!</h1>
          <p className="text-base md:text-lg text-[#9CA3AF] mb-4 max-w-2xl mx-auto">Tu prueba gratuita de 14 días está activa.</p>
          <p className="text-sm text-[#6B7280] max-w-xl mx-auto">Hoy no se te ha cobrado nada. El día 15, si no cancelas, se activará automáticamente tu membresía a 97€/mes.</p>

          <div className="highlight-box mt-8">
            <p className="text-white font-mono text-sm uppercase text-center">14 DÍAS · 0€ · CANCELA 1-CLICK CUANDO QUIERAS</p>
          </div>
        </div>
      </div>

      <section className="py-16 border-t border-b border-[#2A2D34]">
        <div className="container mx-auto px-6 text-center">
          <span className="font-mono text-xs text-[#6B7280] uppercase tracking-widest border border-[#2A2D34] px-3 py-1 rounded-[2px] mb-6 inline-block">SIGUIENTE PASO</span>
          <h2 className="font-serif text-2xl md:text-4xl text-white uppercase mb-4">Tu acceso está listo</h2>
          <p className="text-[#9CA3AF] mb-8">En los próximos 60 segundos recibirás un email con:</p>

          <div className="max-w-md mx-auto">
            <ul className="flex flex-col gap-4 text-left">
              {[
                "Acceso a la plataforma",
                "Test vocacional (10 min) — Descubre tu profesión",
                "Plan personalizado de 30 días",
                "Kit con plantillas para empezar",
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="check-box-square"><Check size={12} /></div>
                  <span className="text-[#D1D5DB] text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-center font-mono text-xs text-[#6B7280] mt-8">Revisa tu bandeja de entrada y spam</p>
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="card-bordered text-center max-w-xl mx-auto">
            <div className="mb-6 text-white opacity-80 flex justify-center"><ShieldCheck size={40} /></div>
            <h4 className="font-mono text-[#9CA3AF] text-sm tracking-wider mb-4">SIN COMPROMISO</h4>
            <p className="text-[#D1D5DB] mb-2">14 días totalmente gratis. Después solo 97€/mes si te quedas.</p>
            <p className="text-[#9CA3AF] text-sm">Cancela 1-click cuando quieras. Sin preguntas. Sin permanencia.</p>
          </div>
        </div>
      </section>

      {/* SIGNATURE */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="border-t border-[#2A2D34] pt-8">
            <p className="font-serif text-lg text-white mb-1">Nos vemos dentro,</p>
            <p className="text-white mb-1">Adrián Villanueva</p>
            <p className="text-[#9CA3AF] text-sm">Fundador, Capital Hub</p>
          </div>
        </div>
      </section>
    </div>
  )
}
