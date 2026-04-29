"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Lock, Zap, CreditCard, ShieldCheck } from "lucide-react"
import CustomCursor from "./components/CustomCursor"
import Footer from "./components/Footer"
import "./styles.css"

const NEXT_STEP = "/lt8/thank-you"

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(t)
  }, [])

  function handlePay(e: React.FormEvent) {
    e.preventDefault()
    // TODO: integrar Stripe. Por ahora simulamos pago exitoso → thank-you
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

      {/* HEADER STICKY */}
      <header className="sticky top-0 z-50 bg-[#0F0F12]/95 backdrop-blur-sm border-b border-[#2A2D34] py-4">
        <div className="container mx-auto px-6 flex flex-col md:flex-row md:justify-between items-center gap-4">
          <div className="font-serif text-base font-medium tracking-[0.15em] text-white">CAPITAL HUB</div>
          <div className="flex flex-col md:items-end gap-1">
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">PAGO 100% SEGURO · ACCESO INMEDIATO</span>
            <div className="flex gap-3 items-center opacity-60 text-[#9CA3AF]">
              <span className="text-[10px] font-mono">VISA</span>
              <span className="text-[10px] font-mono">MC</span>
              <span className="text-[10px] font-mono">STRIPE</span>
            </div>
          </div>
        </div>
      </header>

      {/* TITLE */}
      <section className="py-12 md:py-16 text-center">
        <div className="container mx-auto px-6">
          <h1 className="checkout-h1 uppercase">
            <span className="weight-light">ESTÁS A UN PASO DE</span>
            <br />
            <span className="weight-bold">EMPEZAR TU CARRERA DIGITAL</span>
          </h1>
          <p className="font-light text-[#9CA3AF] text-sm md:text-base max-w-xl mx-auto">
            Completa tu acceso y desbloquea 14 días gratis de formación + bolsa de empleo.
          </p>
        </div>
      </section>

      {/* CHECKOUT CARD */}
      <section className="container mx-auto px-6">
        <div className="checkout-card">
          <div className="text-center mb-8 pb-6 border-b border-[#2A2D34]">
            <h3 className="font-serif text-xl text-white uppercase mb-2">Completa tu acceso a Capital Hub</h3>
            <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
              <Lock size={12} />
              <span>Tu información está protegida con encriptación bancaria.</span>
            </div>
          </div>

          {/* Form simulado (TODO: Stripe) */}
          <form onSubmit={handlePay} className="flex flex-col gap-4">
            <input type="text" className="form-input" placeholder="Nombre completo" required />
            <input type="email" className="form-input" placeholder="Correo electrónico" required />
            <input type="tel" className="form-input" placeholder="Número de teléfono" required />

            <div className="h-4"></div>

            <button type="button" className="btn-paypal" aria-label="Pagar con PayPal">
              <span className="italic font-bold mr-0.5">Pay</span>
              <span>Pal</span>
            </button>

            <div className="flex items-center text-center text-[#6B7280] text-xs my-2">
              <div className="flex-1 border-b border-[#2A2D34]"></div>
              <span className="mx-4">o paga con tarjeta</span>
              <div className="flex-1 border-b border-[#2A2D34]"></div>
            </div>

            <input type="text" className="form-input" placeholder="Número de tarjeta" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" className="form-input" placeholder="MM / AA" />
              <input type="text" className="form-input" placeholder="CVC" />
            </div>

            <button
              type="submit"
              className="btn-green mt-6 w-full py-4 font-mono uppercase text-xs tracking-wider rounded-[2px] flex items-center justify-center gap-3"
            >
              EMPEZAR AHORA POR 8€
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7h10v10" /><path d="M7 17 17 7" />
              </svg>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-[#4B5563] leading-relaxed mb-4 max-w-sm mx-auto">
              Pago cifrado y seguro. Tus datos nunca se comparten con terceros. Al completar tu compra aceptas los términos y condiciones de Capital Hub.
            </p>
          </div>
        </div>
      </section>

      {/* VALUE STACK */}
      <section className="bg-[#111113] border-t border-[#2A2D34] py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="mb-12">
            <h3 className="font-serif text-2xl text-white uppercase mb-2">LO QUE DESBLOQUEAS HOY</h3>
            <p className="text-sm text-[#9CA3AF] uppercase tracking-wide mb-8">POR SOLO 8€</p>
            <ul className="flex flex-col gap-4">
              {[
                { hl: "Matrícula de 150€ → GRATIS", strong: true },
                { hl: 'Masterclass: "La Profesión Digital: La Verdad Sobre el Trabajo Remoto"' },
                { hl: 'Masterclass: "El Test" — Descubre en qué eres bueno' },
                { hl: 'Masterclass: "El resultado" — Cómo elegir un camino profesional' },
                { hl: "Tour completo de Capital Hub" },
                { hl: "14 días GRATIS de acceso a todas las formaciones" },
                { hl: "Acceso a bolsa de empleo con ofertas reales" },
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="check-box-square">
                    <Check size={12} />
                  </div>
                  <span className={`text-sm md:text-base leading-relaxed ${item.strong ? "text-white font-semibold" : "text-[#D1D5DB]"}`}>
                    {item.hl}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[#2A2D34] my-12"></div>

          <div className="mb-12">
            <h3 className="font-serif text-2xl text-white uppercase mb-8">QUÉ CAMBIA EN TU DÍA A DÍA</h3>
            <div className="flex flex-col gap-4">
              {[
                "Sabrás exactamente qué profesión digital encaja contigo, sin perder meses dudando.",
                "Tendrás una ruta clara paso a paso para formarte, desde cero hasta nivel profesional.",
                "Accederás a ofertas de trabajo reales que empresas publican cada semana en nuestra bolsa de empleo.",
                "Dejarás de consumir contenido sin dirección y empezarás a construir una carrera con futuro.",
                "Tendrás un entorno de personas que ya trabajan en digital — comunidad, tutores y accountability real.",
              ].map((line, i) => (
                <div key={i} className="text-[#D1D5DB] text-sm md:text-base leading-relaxed pl-4 border-l-2 border-[#2A2D34]">
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#2A2D34] my-12"></div>

          <div>
            <h3 className="font-serif text-2xl text-white uppercase mb-8">POR QUÉ FUNCIONA TAN BIEN</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mini-card">
                <h4>Formación aplicada, no teórica.</h4>
                <p>Cada módulo está diseñado para que apliques desde el primer día con profesionales en activo.</p>
              </div>
              <div className="mini-card">
                <h4>Bolsa de empleo real incluida.</h4>
                <p>Empresas nos contactan cada semana buscando perfiles como el tuyo. No es una promesa — es infraestructura.</p>
              </div>
              <div className="mini-card">
                <h4>Riesgo cero para ti.</h4>
                <p>Entras por 8€, pruebas 14 días gratis y tienes 30 días de garantía de devolución. Si no te convence, recuperas tu dinero.</p>
              </div>
              <div className="mini-card">
                <h4>Sistema probado, no improvisación.</h4>
                <p>Capital Hub forma en profesiones que el mercado demanda hoy: comercial digital, marketing, tech e IA.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#2A2D34] my-12"></div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {[
              { icon: <Lock size={24} />, title: "PAGO 100% SEGURO", desc: "Encriptación bancaria de nivel profesional." },
              { icon: <Zap size={24} />, title: "ACCESO INMEDIATO", desc: "Entras a la plataforma en menos de 60 segundos." },
              { icon: <CreditCard size={24} />, title: "PAGO ÚNICO DE 8€", desc: "Sin cargos ocultos. 14 días gratis incluidos." },
              { icon: <ShieldCheck size={24} />, title: "PRIVACIDAD GARANTIZADA", desc: "Tus datos nunca se comparten con terceros." },
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

      {/* GUARANTEE */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="card-bordered text-center max-w-2xl mx-auto">
            <div className="mb-6 text-white opacity-80 flex justify-center">
              <ShieldCheck size={32} />
            </div>
            <h4 className="font-serif text-xl text-white uppercase mb-4">GARANTÍA DE SATISFACCIÓN DE 30 DÍAS</h4>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Accede, explora y decide si es para ti. Si en los primeros 30 días no te convence, te devolvemos el 100% de tu dinero. Sin preguntas.
            </p>
            <div className="glow-effect"></div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
