import React from 'react';
import { ArrowRight } from 'lucide-react';

type Block = { line: string; highlight?: string }
type Step = { step: string; title: string; blocks: Block[] }

const steps: Step[] = [
  {
    step: "01",
    title: "Accedes a Capital Hub por 8€",
    blocks: [
      { line: "Desbloqueas las masterclasses y 14 días de acceso completo." },
      { line: "Descubres qué profesión digital encaja contigo." },
    ],
  },
  {
    step: "02",
    title: "Eliges tu profesión y te formas",
    blocks: [
      { line: "Si te gusta conectar con personas", highlight: "→ Comercial PRO. Aprendes a cerrar ventas por videollamada." },
      { line: "Si prefieres algo más analítico", highlight: "→ Marketing Digital. Aprendes a gestionar anuncios para negocios." },
    ],
  },
  {
    step: "03",
    title: "Te postulas a trabajos reales",
    blocks: [
      { line: "Empresas nos contactan cada semana buscando perfiles como el tuyo." },
      { line: "Una empresa de formación busca comercial", highlight: "→ Cobras 1.500€ - 2.500€/mes." },
      { line: "Una clínica dental busca gestor de anuncios", highlight: "→ Cobras 1.500€/mes fijos por clínica." },
    ],
  },
  {
    step: "04",
    title: "¡Cobras tu primer sueldo!",
    blocks: [
      { line: "Comercial: 10 ventas de 2.000€", highlight: "→ 8% = 1.600€/mes." },
      { line: "Marketing: 2 clientes a 750€", highlight: "→ 1.500€/mes." },
      { line: "Todo esto desde tu casa y con tu propio horario." },
    ],
  },
];

export default function Services() {
  return (
    <div className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((item, index) => (
          <div
            key={index}
            className="group relative flex flex-col p-6 md:p-8 border border-[#2A2D34] bg-[#18181B] hover:border-white transition-colors duration-300 min-h-[280px] md:min-h-[320px]"
          >
            <div className="text-3xl md:text-4xl font-mono text-[#2A2D34] group-hover:text-white transition-colors mb-6 md:mb-8">
                {item.step}
            </div>

            <h4 className="font-serif text-xl mb-4 text-[#F5F6F7] leading-snug">
                {item.title}
            </h4>

            <div className="text-[#6B7280] text-sm leading-relaxed mt-auto space-y-3">
              {item.blocks.map((b, i) => (
                <div key={i}>
                  <span className="block">{b.line}</span>
                  {b.highlight && (
                    <span className="block text-white font-medium mt-0.5">{b.highlight}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute top-6 right-6 md:top-8 md:right-8 text-[#2A2D34] group-hover:text-white transition-colors">
                <ArrowRight size={20} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
