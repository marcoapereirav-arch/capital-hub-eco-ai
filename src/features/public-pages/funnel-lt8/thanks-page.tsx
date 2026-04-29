"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Check, AlertTriangle, ShieldCheck, ChevronDown } from "lucide-react"
import CustomCursor from "./components/CustomCursor"
import Confetti from "./components/Confetti"
import "./styles.css"

const AGENDA_URL = "/lt8/agenda-thank-you"

export default function ThanksPage() {
  const [loading, setLoading] = useState(true)
  const helpSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(t)
  }, [])

  function scrollToHelp() {
    helpSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
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
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden pb-24">
      <CustomCursor />
      <Confetti />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-40 py-4 md:py-6">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="font-serif text-sm md:text-2xl font-medium tracking-[0.15em] md:tracking-[0.25em] uppercase text-white">
            Capital Hub
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-12">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 md:gap-3 border border-[#2A2D34] bg-[#18181B] px-3 md:px-4 py-2 rounded-[2px] mb-8">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow: "0 0 5px #10B981" }}></span>
            <span className="text-[9px] md:text-xs uppercase tracking-wide leading-tight">
              <span className="text-green-500 font-semibold">CONFIRMACIÓN</span> <span className="text-[#9CA3AF]">DE ACCESO</span>
            </span>
          </div>

          <h1 className="font-serif font-semibold uppercase text-3xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            ¡BIENVENIDO A CAPITAL HUB!
          </h1>

          <p className="text-base md:text-lg text-[#9CA3AF] mb-4 max-w-2xl mx-auto">
            Acabas de tomar la mejor decisión para tu futuro profesional.
          </p>

          <p className="text-sm text-[#6B7280] max-w-xl mx-auto">
            Normalmente cobramos una matrícula de 150€ para acceder a Capital Hub, pero está incluida en tu registro inicial.
          </p>

          <div className="highlight-box mt-8">
            <p className="text-white font-mono text-sm uppercase text-center">
              Solo has pagado 8€ de acceso en lugar de 158€
            </p>
          </div>
        </div>
      </div>

      {/* ACCESS READY */}
      <section className="py-16 border-t border-b border-[#2A2D34]">
        <div className="container mx-auto px-6 text-center">
          <span className="font-mono text-xs text-[#6B7280] uppercase tracking-widest border border-[#2A2D34] px-3 py-1 rounded-[2px] mb-6 inline-block">
            SIGUIENTE PASO
          </span>
          <h2 className="font-serif text-2xl md:text-4xl text-white uppercase mb-4">Tu acceso está listo</h2>
          <p className="text-[#9CA3AF] mb-8">En los próximos 60 segundos recibirás un email con:</p>

          <div className="max-w-md mx-auto">
            <ul className="flex flex-col gap-4 text-left">
              {[
                "Acceso a la plataforma",
                "Test vocacional (10 min) → Descubre tu profesión",
                "Plan personalizado de 30 días",
                "Kit con 5 plantillas listas para usar",
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="check-box-square">
                    <Check size={12} />
                  </div>
                  <span className="text-[#D1D5DB] text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-center font-mono text-xs text-[#6B7280] mt-8">
              Revisa tu bandeja de entrada y spam
            </p>
          </div>
        </div>
      </section>

      {/* HELP SECTION */}
      <section ref={helpSectionRef} className="py-16 bg-[#111113] border-b border-[#2A2D34]">
        <div className="container mx-auto px-6">
          <div className="card-bordered max-w-2xl mx-auto text-center" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
            <div className="glow-effect" style={{ opacity: 0.5 }}></div>
            <h3 className="font-serif text-xl md:text-2xl text-white mb-2">TE AYUDAMOS A EMPEZAR</h3>
            <p className="text-[#9CA3AF] mb-8">Agenda una llamada GRATIS de 15 minutos</p>

            <ul className="flex flex-col gap-4 text-left mb-10 max-w-sm mx-auto">
              {[
                "Analizamos tu situación actual",
                "Te recomendamos tu profesión ideal",
                "Diseñamos tu plan de 90 días",
                "Resolvemos todas tus dudas",
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="check-box-square"><Check size={12} /></div>
                  <span className="text-[#D1D5DB] text-sm">{item}</span>
                </li>
              ))}
            </ul>

            <Link href={AGENDA_URL} className="inline-block w-full py-4 px-8 bg-white text-black font-mono uppercase text-sm tracking-wider rounded-[2px] hover:bg-[#E5E5E5] transition-colors">
              AGENDAR MI LLAMADA GRATUITA
            </Link>
            <p className="font-mono text-xs text-[#6B7280] mt-4">(Plazas limitadas cada día)</p>
          </div>
        </div>
      </section>

      {/* WARNING */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="card-bordered max-w-3xl mx-auto" style={{ borderLeft: "3px solid #f59e0b" }}>
            <h4 className="font-mono text-amber-500 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
              <AlertTriangle size={16} />
              MUY IMPORTANTE
            </h4>
            <div className="text-[#D1D5DB] flex flex-col gap-4">
              <p>La matrícula de 150€ está incluida como parte de tu registro inicial.</p>
              <p>Si cancelas tu membresía y decides reactivarla más adelante, tendrás que pagar la matrícula de 150€ + la cuota mensual de 44€.</p>
              <p className="text-[#9CA3AF] text-sm">Este beneficio solo aplica para nuevos registros. Aprovecha estos 14 días al máximo para tomar una decisión informada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-16 bg-[#111113] border-y border-[#2A2D34]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl md:text-4xl text-white uppercase">Qué va a pasar ahora</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="card-bordered">
              <h4 className="font-serif text-lg text-white mb-6">DÍAS 1-14 (100% GRATIS)</h4>
              <ul className="flex flex-col gap-3">
                <li className="text-[#9CA3AF] text-sm">• Haces el test vocacional</li>
                <li className="text-[#9CA3AF] text-sm">• Empiezas tu formación certificada</li>
                <li className="text-[#9CA3AF] text-sm">• Asistes a 2 mentorías por semana</li>
                <li className="text-[#9CA3AF] text-sm">• Conoces la comunidad (500+ miembros)</li>
              </ul>
            </div>
            <div className="card-bordered">
              <h4 className="font-serif text-lg text-white mb-6">DÍA 14 (Tú decides)</h4>
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-white font-semibold mb-2">OPCIÓN A: Continúas</p>
                  <p className="text-[#9CA3AF] text-sm">44€/mes, te certificas en 60-90 días y accedes a la bolsa de trabajo.</p>
                </div>
                <div>
                  <p className="text-white font-semibold mb-2">OPCIÓN B: Cancelas</p>
                  <p className="text-[#9CA3AF] text-sm">Gratis, 1 clic, solo invertiste 8€ por todo el conocimiento.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="card-bordered text-center max-w-xl mx-auto">
            <div className="mb-6 text-white opacity-80 flex justify-center">
              <ShieldCheck size={40} />
            </div>
            <h4 className="font-mono text-[#9CA3AF] text-sm tracking-wider mb-4">TU GARANTÍA</h4>
            <p className="text-[#D1D5DB] mb-6">
              Si completas tu formación y NO tienes acceso a oportunidades laborales en nuestra bolsa de empleo, te devolvemos:
            </p>
            <h3 className="font-serif text-4xl md:text-5xl text-white mb-2">TODO + 100€</h3>
            <p className="font-mono text-[#9CA3AF] text-sm">Sin preguntas.</p>
          </div>
        </div>
      </section>

      {/* INVESTMENT */}
      <section className="py-16 bg-[#111113] border-t border-b border-[#2A2D34]">
        <div className="container mx-auto px-6 max-w-md">
          <div className="text-center mb-8">
            <h2 className="font-serif text-xl md:text-2xl text-white uppercase">Resumen de inversión</h2>
          </div>
          <table className="investment-table">
            <tbody>
              <tr>
                <td className="text-[#6B7280] line-through">Matrícula: 150€</td>
                <td className="text-green-500">Incluida ✅</td>
              </tr>
              <tr>
                <td className="text-white">Hoy</td>
                <td className="text-white">8€ (ya pagado ✅)</td>
              </tr>
              <tr>
                <td className="text-white">Días 1-14</td>
                <td className="text-white">0€ (GRATIS)</td>
              </tr>
              <tr>
                <td className="text-white">Día 15+</td>
                <td className="text-[#9CA3AF]">44€/mes (o cancela gratis)</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-8 border border-[#2A2D34] p-4 rounded-[2px] bg-white/[0.02] text-center">
            <p className="text-[#D1D5DB] text-sm">
              <span className="block font-serif text-white mb-1">Inversión típica:</span>
              60-90 días (96€-140€ total) para acceder a trabajos de 1.500€/mes
            </p>
          </div>
        </div>
      </section>

      {/* NEXT STEPS + SIGNATURE */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <h3 className="font-serif text-xl md:text-2xl text-white mb-8">Tus próximos pasos:</h3>
          <div className="flex flex-col gap-6 mb-16">
            {[
              "Revisa tu email → Asunto: \"Tu acceso a Capital Hub\"",
              "Entra a la plataforma",
              "Haz el test vocacional (10 min)",
              "Descarga tu plan de 30 días",
              "Reserva tu plaza en la próxima mentoría",
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <span className="font-mono text-[#2A2D34] text-xl">{i + 1}.</span>
                <p className="text-[#D1D5DB]">{step}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#2A2D34] pt-8">
            <p className="font-serif text-lg text-white mb-1">Nos vemos dentro,</p>
            <p className="text-white mb-1">Adrián Villanueva</p>
            <p className="text-[#9CA3AF] text-sm mb-6">Fundador, Capital Hub</p>
            <p className="font-mono text-xs text-[#6B7280]">P.D.: Próxima mentoría en vivo: JUEVES a las 19:00. No te la pierdas.</p>
          </div>
        </div>
      </section>

      {/* STICKY BAR */}
      <div className="sticky-bar">
        <button onClick={scrollToHelp} className="btn-sticky">
          QUIERO AYUDA PERSONALIZADA
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  )
}
