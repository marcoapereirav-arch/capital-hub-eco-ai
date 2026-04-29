"use client"

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Section from './components/Section';
import Services from './components/Services';
import Clients from './components/Clients';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import BioModal from './components/BioModal';
import { Check, Plus, Minus, ArrowUpRight, ShieldCheck, Lock } from 'lucide-react';
import Button from './components/Button';
import './styles.css';

const CHECKOUT_URL = "/lt8/checkout";
const CONTACT_EMAIL = "mailto:hola@capitalhub.com";

// FAQ Item Component
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

export default function FunnelLt8Page() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
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

      {/* Background Noise */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>

      <Header />

      <main className="w-full overflow-x-hidden">
        {/* HERO con VSL */}
        <Hero />

        {/* OFFER */}
        <Section id="offer" className="py-16 md:py-24 border-y border-[#2A2D34]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 px-0 md:px-6 max-w-[1400px] mx-auto border-t border-b md:border border-[#2A2D34] bg-[#18181B]">
            {/* Left Col */}
            <div className="md:col-span-7 p-6 py-10 md:p-16 border-b md:border-b-0 md:border-r border-[#2A2D34]">
               <h3 className="font-serif text-2xl md:text-4xl mb-2 uppercase leading-tight">Da el primer paso hacia tu trabajo remoto</h3>
               <p className="text-[#6B7280] uppercase text-sm tracking-wider mb-8 md:mb-12">por solo 8€</p>

               <ul className="space-y-4">
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="w-5 h-5 rounded-[2px] bg-[#2A2D34] flex items-center justify-center mt-1 flex-shrink-0 text-white">
                      <Check size={12} />
                    </div>
                    <span className="text-[#D1D5DB] text-sm md:text-base leading-snug">Masterclass: &ldquo;La Profesión Digital: La Verdad Sobre el Trabajo Remoto&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="w-5 h-5 rounded-[2px] bg-[#2A2D34] flex items-center justify-center mt-1 flex-shrink-0 text-white">
                      <Check size={12} />
                    </div>
                    <span className="text-[#D1D5DB] text-sm md:text-base leading-snug">Masterclass: &ldquo;El Test&rdquo; — Descubre en qué eres bueno</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="w-5 h-5 rounded-[2px] bg-[#2A2D34] flex items-center justify-center mt-1 flex-shrink-0 text-white">
                      <Check size={12} />
                    </div>
                    <span className="text-[#D1D5DB] text-sm md:text-base leading-snug">Masterclass: &ldquo;El resultado&rdquo; — Cómo elegir un camino profesional</span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="w-5 h-5 rounded-[2px] bg-[#2A2D34] flex items-center justify-center mt-1 flex-shrink-0 text-white">
                      <Check size={12} />
                    </div>
                    <span className="text-[#D1D5DB] text-sm md:text-base leading-snug">
                      Matrícula de 150€ <span className="badge-gratis">GRATIS</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="w-5 h-5 rounded-[2px] bg-[#2A2D34] flex items-center justify-center mt-1 flex-shrink-0 text-white">
                      <Check size={12} />
                    </div>
                    <span className="text-[#D1D5DB] text-sm md:text-base leading-snug">
                      Acceso a bolsa de empleo con ofertas reales <span className="badge-gratis">GRATIS</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4">
                    <div className="w-5 h-5 rounded-[2px] bg-[#2A2D34] flex items-center justify-center mt-1 flex-shrink-0 text-white">
                      <Check size={12} />
                    </div>
                    <span className="text-[#D1D5DB] text-sm md:text-base leading-snug">
                      14 días de acceso a todas las formaciones <span className="badge-gratis">GRATIS</span>
                    </span>
                  </li>
               </ul>
            </div>

            {/* Right Col */}
            <div className="md:col-span-5 p-8 md:p-16 flex flex-col justify-center items-center text-center bg-[#0F0F12]">
               <span className="font-mono text-[#6B7280] text-sm line-through mb-2">VALOR TOTAL: 197€</span>
               <div className="text-6xl md:text-8xl font-serif text-white mb-6">8€</div>
               <p className="text-[#9CA3AF] text-sm mb-8">Oferta limitada de lanzamiento</p>
               <Button
                 text="QUIERO MI ACCESO"
                 href={CHECKOUT_URL}
                 size="lg"
                 variant="green"
                 icon={<ArrowUpRight size={18} />}
                 className="w-full text-xs md:text-sm"
               />
               <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[10px] text-[#4B5563] uppercase font-mono">
                  <span>Pago Seguro</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Cancelación en 1 click</span>
               </div>
            </div>
          </div>
        </Section>

        {/* GUARANTEE */}
        <Section className="py-16 md:py-24 bg-[#0F0F12]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col p-6 md:p-10 border border-[#2A2D34] bg-[#0F0F12] relative overflow-hidden group">
                <div className="mb-6 text-white opacity-80">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="font-serif text-xl md:text-2xl mb-4 text-white uppercase tracking-wide">GARANTÍA DE 30 DÍAS</h4>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  Pruébalo a tu ritmo. Accede, explora y decide si es para ti. Si en los primeros 30 días no te convence, te devolvemos el 100% de tu dinero. Sin preguntas.
                </p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
              <div className="flex flex-col p-6 md:p-10 border border-[#2A2D34] bg-[#0F0F12] relative overflow-hidden group">
                <div className="mb-6 text-white opacity-80">
                  <Lock size={32} />
                </div>
                <h4 className="font-serif text-xl md:text-2xl mb-4 text-white uppercase tracking-wide">PAGO 100% SEGURO</h4>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">
                  Tu compra está protegida con encriptación bancaria. Tus datos están seguros y nunca se comparten con terceros.
                </p>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </div>
            {/* Clients placeholder retained for future logo strip */}
            <div className="hidden"><Clients /></div>
          </div>
        </Section>

        {/* STEPS */}
        <Section id="steps" className="py-16 md:py-24 border-y border-[#2A2D34] bg-[#0F0F12]">
          <div className="max-w-4xl mx-auto text-center px-6">
            <span className="font-mono text-xs text-[#6B7280] uppercase tracking-widest border border-[#2A2D34] px-3 py-1 rounded-[2px] mb-8 inline-block">
              El Proceso
            </span>
            <h2 className="font-serif text-2xl md:text-5xl leading-tight mb-8 uppercase break-words px-2">
              Cómo vas a conseguir tu sueldo online en 4 simples pasos
            </h2>
          </div>
          <Services />
        </Section>

        {/* BIO con MODAL (galería + historia Adrián) */}
        <BioModal />

        {/* FAQ */}
        <Section id="faq" className="py-16 md:py-24 border-t border-[#2A2D34] bg-[#111113]">
          <div className="max-w-3xl mx-auto px-6">
            <h3 className="font-serif text-2xl md:text-4xl mb-12 text-center uppercase">Preguntas Frecuentes</h3>
            <div className="space-y-2">
              <FAQItem
                question="¿Necesito experiencia previa para empezar?"
                answer="No. Las formaciones están diseñadas para empezar desde cero. No importa si nunca has trabajado en digital, si no tienes estudios relacionados o si vienes de otro sector. Empiezas desde la base y avanzas paso a paso."
              />
              <FAQItem
                question="¿Qué pasa después de los 14 días gratis?"
                answer="Si decides quedarte, se activa tu membresía a 44€/mes. Si no te convence, cancelas antes de que terminen los 14 días y no se te cobra nada más. Sin permanencia, sin complicaciones."
              />
              <FAQItem
                question="¿Puedo cancelar cuando quiera?"
                answer="Sí. Cancelas cuando quieras desde tu perfil. Sin llamadas, sin emails, sin preguntas. Un clic y listo."
              />
              <FAQItem
                question="¿La bolsa de trabajo es real?"
                answer="Sí. No tendría sentido montar esto si no lo fuera. Empresas nos contactan cada semana buscando perfiles que no encuentran en ningún lado. Comerciales, marketers, gente de tech, IA, etc. Son ofertas reales de empresas reales."
              />
              <FAQItem
                question="¿En cuánto tiempo puedo conseguir trabajo?"
                answer="Depende de tu dedicación, pero nuestra promesa es que en 90 días o menos puedes conseguir tu primer trabajo remoto si sigues el proceso y te formas en serio."
              />
              <FAQItem
                question="¿Qué pasa si no me gusta?"
                answer="Tienes 30 días de garantía. Si no te convence, te devolvemos el 100% de tu dinero. Sin preguntas."
              />
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
