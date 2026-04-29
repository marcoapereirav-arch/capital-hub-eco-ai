"use client"

import React, { useState, useEffect } from 'react';
import Header from '@/features/public-pages/funnel-lt8/components/Header';
import Section from '@/features/public-pages/funnel-lt8/components/Section';
import Footer from '@/features/public-pages/funnel-lt8/components/Footer';
import CustomCursor from '@/features/public-pages/funnel-lt8/components/CustomCursor';
import BioModal from '@/features/public-pages/funnel-lt8/components/BioModal';
import Button from '@/features/public-pages/funnel-lt8/components/Button';
import { Check, Plus, Minus, ArrowUpRight, ShieldCheck, Lock, Target, GraduationCap, Briefcase } from 'lucide-react';
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

        {/* Divisor visual entre Hero y Método — línea con marcador central */}
        <div className="relative h-px bg-[#2A2D34]">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[#0F0F12] font-mono text-[9px] uppercase tracking-[0.3em] text-[#4B5563]">
            ↓
          </span>
        </div>

        {/* MÉTODO — 3 etapas, copy directo al avatar, cero invenciones */}
        <Section id="metodo" className="py-24 md:py-32 bg-[#0B0B0E]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10 md:mb-12">
              <span className="font-mono text-xs text-[#6B7280] uppercase tracking-widest border border-[#2A2D34] px-3 py-1 rounded-[2px] mb-5 inline-block">
                CÓMO FUNCIONA
              </span>
              <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl leading-tight uppercase max-w-3xl mx-auto">
                Te ayudamos en <span className="text-white">3 pasos</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#2A2D34] bg-[#0F0F12]">
              {[
                {
                  num: "01",
                  icon: <Target size={22} />,
                  title: "TE DECIMOS EN QUÉ ERES BUENO",
                  desc: "Haces un test corto y descubrimos qué profesión digital encaja contigo: IA, marketing o comercial digital.",
                },
                {
                  num: "02",
                  icon: <GraduationCap size={22} />,
                  title: "TE FORMAS EN ESA RAMA",
                  desc: "Te asignamos la formación de tu rama. Aprendes solo lo que necesitas para trabajar en ese campo concreto.",
                },
                {
                  num: "03",
                  icon: <Briefcase size={22} />,
                  title: "TE AYUDAMOS A CONSEGUIR TRABAJO",
                  desc: "Tenemos empresas que nos piden perfiles cada semana. Te postulamos y te preparamos para la entrevista.",
                }
              ].map((step, i, arr) => (
                <div
                  key={step.num}
                  className={`p-6 md:p-8 ${i < arr.length - 1 ? 'border-b md:border-b-0 md:border-r border-[#2A2D34]' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-2xl md:text-3xl text-[#37ca37] font-light">{step.num}</span>
                    <div className="text-white opacity-70">{step.icon}</div>
                  </div>
                  <h3 className="font-serif text-base md:text-lg text-white uppercase tracking-wide leading-tight mb-2">{step.title}</h3>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* OFFER — adaptado a Free Trial */}
        <Section id="offer" className="py-16 md:py-24 bg-[#0F0F12]">
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

        {/* PROCESO MIFGE — 4 pasos coherentes con free trial, sin "8€", sin flechas */}
        <Section id="proceso" className="py-16 md:py-24 bg-[#0B0B0E]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12 md:mb-14">
              <span className="font-mono text-xs text-[#6B7280] uppercase tracking-widest border border-[#2A2D34] px-3 py-1 rounded-[2px] mb-6 inline-block">
                EL PROCESO
              </span>
              <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl leading-tight uppercase max-w-3xl mx-auto">
                Tu primer sueldo online <span className="text-white">en 4 pasos</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#2A2D34]">
              {[
                {
                  num: "01",
                  title: "Activas tu prueba gratis",
                  desc: "Te registras hoy. 14 días con acceso completo. Sin pagar nada hoy.",
                },
                {
                  num: "02",
                  title: "Eliges tu rama",
                  desc: "Hacemos el test contigo y eliges una rama: IA, marketing digital o comercial digital.",
                },
                {
                  num: "03",
                  title: "Te formamos para esa rama",
                  desc: "Aprendes solo lo necesario para trabajar en ese campo. Plan paso a paso.",
                },
                {
                  num: "04",
                  title: "Cobras tu primer sueldo",
                  desc: "Te conectamos con empresas que buscan tu perfil. Cobras desde casa, con tu horario.",
                },
              ].map((s, i, arr) => (
                <div
                  key={s.num}
                  className={`p-6 md:p-8 bg-[#18181B] ${i < arr.length - 1 ? 'border-b lg:border-b-0 lg:border-r border-[#2A2D34]' : ''}`}
                >
                  <div className="font-mono text-2xl md:text-3xl text-[#37ca37] mb-3">{s.num}</div>
                  <h4 className="font-serif text-base md:text-lg text-white leading-tight mb-2">{s.title}</h4>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* BIO con MODAL — reutilizado, con CTA al checkout de mifge */}
        <BioModal checkoutUrl={CHECKOUT_URL} />

        {/* FAQ */}
        <Section id="faq" className="py-16 md:py-24 bg-[#0F0F12]">
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
