"use client"

import React, { useState, useEffect } from 'react';
import Header from '@/features/public-pages/funnel-lt8/components/Header';
import Section from '@/features/public-pages/funnel-lt8/components/Section';
import Services from '@/features/public-pages/funnel-lt8/components/Services';
import Footer from '@/features/public-pages/funnel-lt8/components/Footer';
import CustomCursor from '@/features/public-pages/funnel-lt8/components/CustomCursor';
import BioModal from '@/features/public-pages/funnel-lt8/components/BioModal';
import Button from '@/features/public-pages/funnel-lt8/components/Button';
import { Check, Plus, Minus, ArrowUpRight, ShieldCheck, Lock, Target, GraduationCap, Briefcase, Sparkles } from 'lucide-react';
import Hero from './components/Hero';
import '@/features/public-pages/funnel-lt8/styles.css';

const CHECKOUT_URL = "/mifge/checkout";
const CONTACT_EMAIL = "mailto:hola@capitalhub.com";

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#2A2D34]">
      <button
        className="w-full py-6 flex justify-between items-start md:items-center text-left hover:text-white transition-colors focus:outline-none gap-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-serif text-base md:text-lg text-[#F5F6F7] leading-tight">{question}</span>
        <span className="text-[#6B7280] flex-shrink-0 mt-1 md:mt-0">
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mb-6' : 'max-h-0'}`}>
        <p className="text-[#9CA3AF] leading-relaxed text-sm pr-4 md:pr-8">{answer}</p>
      </div>
    </div>
  );
};

export default function FunnelMifgePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

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
    );
  }

  return (
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden">
      <CustomCursor />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>
      <Header />

      <main className="w-full overflow-x-hidden">
        <Hero />

        {/* MÉTODO JP — análisis · formación · empleo */}
        <Section id="metodo" className="py-16 md:py-24 border-y border-[#2A2D34] bg-[#111113]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-16">
              <span className="font-mono text-xs text-[#6B7280] uppercase tracking-widest border border-[#2A2D34] px-3 py-1 rounded-[2px] mb-6 inline-block">
                EL MÉTODO
              </span>
              <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl leading-tight uppercase max-w-3xl mx-auto">
                <span className="text-[#9CA3AF]">No es magia.</span> Es un sistema de <span className="text-white">3 etapas.</span>
              </h2>
              <p className="text-[#9CA3AF] text-sm md:text-base mt-6 max-w-2xl mx-auto leading-relaxed">
                El mismo sistema que usaron las +800 personas que ya consiguieron su primer trabajo remoto con nosotros.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#2A2D34] bg-[#0F0F12]">
              {[
                {
                  num: "01",
                  icon: <Target size={24} />,
                  title: "ANÁLISIS",
                  subtitle: "Test vocacional · 10 min",
                  desc: "Descubrimos exactamente en qué eres bueno, qué profesión digital encaja contigo y cuánto puedes facturar. Sin adivinar. Con datos.",
                  bullets: ["Test de aptitudes", "Mapa de profesiones", "Estimación de salario real"]
                },
                {
                  num: "02",
                  icon: <GraduationCap size={24} />,
                  title: "FORMACIÓN",
                  subtitle: "Plan 30 días personalizado",
                  desc: "Te asignamos las masterclasses específicas para tu camino. Aprendes solo lo que necesitas para empezar a trabajar. Sin paja.",
                  bullets: ["Masterclasses on-demand", "Mentoría semanal", "Proyectos reales"]
                },
                {
                  num: "03",
                  icon: <Briefcase size={24} />,
                  title: "EMPLEO",
                  subtitle: "Bolsa con ofertas reales",
                  desc: "Empresas nos contactan cada semana buscando perfiles. Te postulamos con tu CV optimizado y te preparamos para la entrevista.",
                  bullets: ["Bolsa de empleo activa", "CV + portfolio review", "Acompañamiento entrevista"]
                }
              ].map((step, i, arr) => (
                <div
                  key={step.num}
                  className={`p-6 md:p-10 ${i < arr.length - 1 ? 'border-b md:border-b-0 md:border-r border-[#2A2D34]' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-2xl md:text-3xl text-[#37ca37] font-light">{step.num}</span>
                    <div className="text-white opacity-80">{step.icon}</div>
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl text-white uppercase tracking-wide mb-1">{step.title}</h3>
                  <p className="font-mono text-[10px] md:text-xs text-[#6B7280] uppercase tracking-widest mb-4">{step.subtitle}</p>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">{step.desc}</p>
                  <ul className="space-y-2">
                    {step.bullets.map((b, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-[#D1D5DB]">
                        <Check size={12} className="text-[#37ca37] flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="text-center mt-8 text-[#6B7280] text-xs md:text-sm font-mono uppercase tracking-wider">
              → 90 días o menos. O te devolvemos hasta el último euro.
            </p>
          </div>
        </Section>

        {/* OFFER — adaptado a Free Trial */}
        <Section id="offer" className="py-16 md:py-24 border-y border-[#2A2D34]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 px-0 md:px-6 max-w-[1400px] mx-auto border-t border-b md:border border-[#2A2D34] bg-[#18181B]">
            <div className="md:col-span-7 p-6 py-10 md:p-16 border-b md:border-b-0 md:border-r border-[#2A2D34]">
               <h3 className="font-serif text-2xl md:text-4xl mb-2 uppercase leading-tight">Empieza tu carrera digital sin pagar nada</h3>
               <p className="text-[#6B7280] uppercase text-sm tracking-wider mb-8 md:mb-12">14 días gratis · cancela cuando quieras</p>
               <ul className="space-y-4">
                  {[
                    { txt: 'Masterclass: "La Profesión Digital: La Verdad Sobre el Trabajo Remoto"' },
                    { txt: 'Masterclass: "El Test" — Descubre en qué eres bueno' },
                    { txt: 'Masterclass: "El resultado" — Cómo elegir un camino profesional' },
                    { txt: 'Matrícula de 150€', badge: 'GRATIS' },
                    { txt: 'Acceso a bolsa de empleo con ofertas reales', badge: 'GRATIS' },
                    { txt: '14 días de acceso a todas las formaciones', badge: 'GRATIS' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 md:gap-4">
                      <div className="w-5 h-5 rounded-[2px] bg-[#2A2D34] flex items-center justify-center mt-1 flex-shrink-0 text-white">
                        <Check size={12} />
                      </div>
                      <span className="text-[#D1D5DB] text-sm md:text-base leading-snug">
                        {item.txt}
                        {item.badge && <span className="badge-gratis">{item.badge}</span>}
                      </span>
                    </li>
                  ))}
               </ul>
            </div>

            <div className="md:col-span-5 p-8 md:p-16 flex flex-col justify-center items-center text-center bg-[#0F0F12]">
               <span className="font-mono text-[#6B7280] text-sm uppercase tracking-wide mb-2">EMPIEZA HOY POR</span>
               <div className="text-6xl md:text-8xl font-serif text-white mb-2">0€</div>
               <p className="text-[#9CA3AF] text-sm mb-6">14 días totalmente gratis</p>
               <p className="text-[#6B7280] text-xs mb-8 max-w-[200px]">Después solo 97€/mes si te quedas. Cancela 1-click cuando quieras.</p>
               <Button
                 text="QUIERO MI PRUEBA GRATUITA"
                 href={CHECKOUT_URL}
                 size="lg"
                 variant="green"
                 icon={<ArrowUpRight size={18} />}
                 className="w-full text-xs md:text-sm"
               />
               <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[10px] text-[#4B5563] uppercase font-mono">
                  <span>Sin compromiso</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Cancela 1-click</span>
               </div>
            </div>
          </div>
        </Section>

        {/* GUARANTEE */}
        <Section className="py-16 md:py-24 bg-[#0F0F12]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col p-6 md:p-10 border border-[#2A2D34] bg-[#0F0F12] relative overflow-hidden group">
                <div className="mb-6 text-white opacity-80"><ShieldCheck size={32} /></div>
                <h4 className="font-serif text-xl md:text-2xl mb-4 text-white uppercase tracking-wide">14 DÍAS GRATIS · 0€</h4>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  Acceso completo durante 14 días sin que se te cobre nada. Cancela cuando quieras desde tu perfil. Si decides quedarte, se activa la membresía a 97€/mes.
                </p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
              <div className="flex flex-col p-6 md:p-10 border border-[#2A2D34] bg-[#0F0F12] relative overflow-hidden group">
                <div className="mb-6 text-white opacity-80"><Lock size={32} /></div>
                <h4 className="font-serif text-xl md:text-2xl mb-4 text-white uppercase tracking-wide">GARANTÍA DE 30 DÍAS</h4>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  Si después de pagar el primer mes no te convence, te devolvemos el 100% de tu dinero en los primeros 30 días. Sin preguntas.
                </p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </Section>

        {/* PLANES — qué pasa cuando se acaba el trial */}
        <Section id="planes" className="py-16 md:py-24 border-y border-[#2A2D34] bg-[#111113]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10 md:mb-14">
              <span className="font-mono text-xs text-[#6B7280] uppercase tracking-widest border border-[#2A2D34] px-3 py-1 rounded-[2px] mb-6 inline-block">
                CUANDO ACABE LA PRUEBA
              </span>
              <h2 className="font-serif text-2xl md:text-4xl leading-tight uppercase">
                Si te quedas, <span className="text-[#9CA3AF]">elige tu plan</span>
              </h2>
              <p className="text-[#9CA3AF] text-sm md:text-base mt-4 max-w-2xl mx-auto">
                Hoy no eliges. Lo eliges el día 14, cuando ya sepas si esto es para ti.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#2A2D34]">
              {/* Plan Mensual */}
              <div className="p-8 md:p-10 bg-[#0F0F12] border-b md:border-b-0 md:border-r border-[#2A2D34]">
                <div className="flex items-baseline justify-between mb-6">
                  <h3 className="font-serif text-lg md:text-xl uppercase text-white">Plan Mensual</h3>
                  <span className="font-mono text-[10px] text-[#6B7280] uppercase">Flexible</span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl md:text-6xl font-serif text-white">97€</span>
                  <span className="text-[#6B7280] text-sm">/mes</span>
                </div>
                <p className="text-[#9CA3AF] text-sm mb-6">Cancela cuando quieras. 1 click. Sin preguntas.</p>
                <ul className="space-y-3">
                  {[
                    "Acceso completo a todas las formaciones",
                    "Bolsa de empleo + ofertas reales",
                    "Mentoría semanal en grupo",
                    "Comunidad privada de profesionales digitales",
                    "Cancela 1-click cuando quieras",
                  ].map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#D1D5DB]">
                      <Check size={14} className="text-[#9CA3AF] mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Plan Anual — RECOMENDADO */}
              <div className="p-8 md:p-10 bg-[#0F0F12] relative">
                <div className="absolute top-0 right-0 bg-[#37ca37] text-[#0F0F12] font-mono text-[10px] uppercase tracking-widest px-3 py-1.5">
                  AHORRA 194€
                </div>
                <div className="flex items-baseline justify-between mb-6">
                  <h3 className="font-serif text-lg md:text-xl uppercase text-white">Plan Anual</h3>
                  <span className="font-mono text-[10px] text-[#37ca37] uppercase">Recomendado</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl md:text-6xl font-serif text-white">970€</span>
                  <span className="text-[#6B7280] text-sm">/año</span>
                </div>
                <p className="text-[#9CA3AF] text-sm mb-6">
                  Equivale a <span className="text-white font-medium">81€/mes</span> · 2 meses gratis vs mensual.
                </p>
                <ul className="space-y-3">
                  {[
                    "Todo lo del plan mensual",
                    "+ Sesión 1:1 onboarding (vale 200€)",
                    "+ Acceso anticipado a nuevas masterclasses",
                    "+ Plantillas portfolio premium",
                    "Garantía de devolución 30 días",
                  ].map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#D1D5DB]">
                      <Check size={14} className="text-[#37ca37] mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Order bump preview */}
            <div className="mt-6 border border-dashed border-[#37ca37]/40 bg-[#37ca37]/5 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <Sparkles size={24} className="text-[#37ca37] flex-shrink-0" />
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#37ca37] mb-1">BONUS BUNDLE · SOLO HOY · 20€</p>
                <p className="text-[#F5F6F7] text-sm md:text-base leading-relaxed">
                  En el checkout puedes añadir el <span className="font-semibold">Bonus Bundle Express</span>:
                  acceso a las 3 masterclasses VIP + plantilla CV optimizada para remoto + plan acelerado 7 días.
                  <span className="text-[#9CA3AF]"> No se vende por separado.</span>
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* STEPS */}
        <Section id="steps" className="py-16 md:py-24 border-y border-[#2A2D34] bg-[#0F0F12]">
          <div className="max-w-4xl mx-auto text-center px-6">
            <span className="font-mono text-xs text-[#6B7280] uppercase tracking-widest border border-[#2A2D34] px-3 py-1 rounded-[2px] mb-8 inline-block">El Proceso</span>
            <h2 className="font-serif text-2xl md:text-5xl leading-tight mb-8 uppercase break-words px-2">
              Cómo vas a conseguir tu sueldo online en 4 simples pasos
            </h2>
          </div>
          <Services />
        </Section>

        {/* BIO con MODAL — reutilizado, con CTA al checkout de mifge */}
        <BioModal checkoutUrl={CHECKOUT_URL} />

        {/* FAQ */}
        <Section id="faq" className="py-16 md:py-24 border-t border-[#2A2D34] bg-[#111113]">
          <div className="max-w-3xl mx-auto px-6">
            <h3 className="font-serif text-2xl md:text-4xl mb-12 text-center uppercase">Preguntas Frecuentes</h3>
            <div className="space-y-2">
              <FAQItem question="¿Necesito experiencia previa para empezar?" answer="No. Las formaciones están diseñadas para empezar desde cero." />
              <FAQItem question="¿Cuánto cuesta empezar?" answer="0€. Tienes 14 días totalmente gratis. Si decides quedarte, se activa tu membresía a 97€/mes. Si no, cancelas y no se te cobra nada." />
              <FAQItem question="¿Puedo cancelar cuando quiera?" answer="Sí. Cancelas con 1 clic desde tu perfil. Sin llamadas, sin emails, sin preguntas." />
              <FAQItem question="¿La bolsa de trabajo es real?" answer="Sí. Empresas nos contactan cada semana buscando perfiles." />
              <FAQItem question="¿En cuánto tiempo puedo conseguir trabajo?" answer="En 90 días o menos si sigues el proceso y te formas en serio." />
              <FAQItem question="¿Qué pasa si no me gusta?" answer="Si después de empezar a pagar no te convence, tienes 30 días de garantía de devolución." />
            </div>
            <div className="mt-16 text-center">
              <p className="text-[#9CA3AF] mb-6">¿Aún tienes dudas?</p>
              <Button text="CONTÁCTANOS" href={CONTACT_EMAIL} variant="outline" />
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
