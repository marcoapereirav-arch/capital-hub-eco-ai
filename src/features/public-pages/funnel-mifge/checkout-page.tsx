"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Lock, Zap, ShieldCheck, Gift } from "lucide-react"
import CustomCursor from "@/features/public-pages/funnel-lt8/components/CustomCursor"
import Footer from "@/features/public-pages/funnel-lt8/components/Footer"
import "@/features/public-pages/funnel-lt8/styles.css"

const NEXT_STEP = "/mifge/upsell-anual"

export default function MifgeCheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orderBumpAdded, setOrderBumpAdded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(t)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: Stripe. Por ahora simulamos -> upsell-anual
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

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0F0F12]/95 backdrop-blur-sm border-b border-[#2A2D34] py-4">
        <div className="container mx-auto px-6 flex flex-col md:flex-row md:justify-between items-center gap-4">
          <div className="font-serif text-base font-medium tracking-[0.15em] text-white">CAPITAL HUB</div>
          <div className="flex flex-col md:items-end gap-1">
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">PRUEBA GRATIS · NO SE COBRA NADA HOY</span>
          </div>
        </div>
      </header>

      {/* TITLE */}
      <section className="py-12 md:py-16 text-center">
        <div className="container mx-auto px-6">
          <h1 className="checkout-h1 uppercase">
            <span className="weight-light">EMPIEZA HOY</span>
            <br />
            <span className="weight-bold">14 DÍAS GRATIS</span>
          </h1>
          <p className="font-light text-[#9CA3AF] text-sm md:text-base max-w-xl mx-auto">
            Sin compromiso. Sin cargos hoy. Cancela cuando quieras antes del día 15.
          </p>
        </div>
      </section>

      {/* CHECKOUT CARD */}
      <section className="container mx-auto px-6">
        <div className="checkout-card">
          <div className="text-center mb-8 pb-6 border-b border-[#2A2D34]">
            <h3 className="font-serif text-xl text-white uppercase mb-2">Activa tu prueba gratuita</h3>
            <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
              <Lock size={12} />
              <span>Información protegida con encriptación bancaria.</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="text" className="form-input" placeholder="Nombre completo" required />
            <input type="email" className="form-input" placeholder="Correo electrónico" required />
            <input type="tel" className="form-input" placeholder="Número de teléfono" required />

            <div className="flex items-center text-center text-[#6B7280] text-xs my-2">
              <div className="flex-1 border-b border-[#2A2D34]"></div>
              <span className="mx-4">datos de tarjeta (no se cobra hoy)</span>
              <div className="flex-1 border-b border-[#2A2D34]"></div>
            </div>

            <input type="text" className="form-input" placeholder="Número de tarjeta" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" className="form-input" placeholder="MM / AA" />
              <input type="text" className="form-input" placeholder="CVC" />
            </div>

            {/* ORDER BUMP — placeholder */}
            <label
              className={`mt-4 flex gap-3 p-4 border-2 cursor-pointer transition-colors rounded-[2px] ${
                orderBumpAdded ? "border-[#37ca37] bg-[#37ca37]/5" : "border-dashed border-[#2A2D34] bg-[#0F0F12]"
              }`}
            >
              <input
                type="checkbox"
                checked={orderBumpAdded}
                onChange={(e) => setOrderBumpAdded(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#37ca37]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={14} className="text-[#37ca37]" />
                  <span className="font-mono text-xs uppercase text-[#37ca37] tracking-wide">SOLO 20€ · ÚNICA OFERTA</span>
                </div>
                <p className="text-white font-semibold text-sm mb-1">Bonus Bundle Express</p>
                <p className="text-[#9CA3AF] text-xs leading-relaxed">
                  Añade el bonus bundle por solo 20€ a tu prueba gratuita. <span className="text-white">[Placeholder — pendiente definir contenido real]</span>
                </p>
              </div>
            </label>

            <button
              type="submit"
              className="btn-green mt-6 w-full py-4 font-mono uppercase text-xs tracking-wider rounded-[2px] flex items-center justify-center gap-3"
            >
              EMPEZAR MI PRUEBA GRATUITA {orderBumpAdded && "(+ BONUS 20€)"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7h10v10" /><path d="M7 17 17 7" />
              </svg>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-[#4B5563] leading-relaxed mb-4 max-w-sm mx-auto">
              Hoy no se te cobra nada. El día 15, si no cancelas, se activa tu membresía a 97€/mes. Cancela 1-click cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-[#111113] border-t border-[#2A2D34] py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {[
              { icon: <Lock size={24} />, title: "PAGO SEGURO", desc: "Encriptación bancaria." },
              { icon: <Zap size={24} />, title: "ACCESO INMEDIATO", desc: "En menos de 60 segundos." },
              { icon: <Check size={24} />, title: "0€ HOY", desc: "Empiezas sin pagar nada." },
              { icon: <ShieldCheck size={24} />, title: "CANCELA 1-CLICK", desc: "Sin permanencia." },
            ].map((s, i) => (
              <div key={i} className="flex flex-col gap-2 items-center md:items-start opacity-90">
                <div className="text-white opacity-80">{s.icon}</div>
                <div className="font-serif text-xs text-white uppercase mt-2">{s.title}</div>
                <div className="text-xs text-[#9CA3AF]">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
