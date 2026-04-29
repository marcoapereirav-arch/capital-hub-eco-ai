import React from 'react';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    step: "01",
    title: "Accedes a Capital Hub por 8€",
    desc: "Desbloqueas las masterclasses y 14 días de acceso completo. Descubres qué profesión digital encaja contigo."
  },
  {
    step: "02",
    title: "Eliges tu profesión y te formas",
    desc: "Si te gusta conectar con personas → Comercial PRO. Si prefieres algo más analítico → Marketing Digital."
  },
  {
    step: "03",
    title: "Te postulas a trabajos reales",
    desc: "Empresas nos contactan cada semana buscando perfiles. Comercial: 1.500€-2.500€/mes. Marketing: 1.500€/mes fijos."
  },
  {
    step: "04",
    title: "¡Cobras tu primer sueldo!",
    desc: "Comercial: 10 ventas = 1.600€/mes. Marketing: 2 clientes = 1.500€/mes. Todo desde casa."
  }
];

export default function Services() {
  return (
    <div className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((item, index) => (
          <div 
            key={index} 
            className="group relative flex flex-col p-6 md:p-8 border border-[#2A2D34] bg-[#18181B] hover:border-white transition-colors duration-300 min-h-[250px] md:min-h-[300px]"
          >
            <div className="text-3xl md:text-4xl font-mono text-[#2A2D34] group-hover:text-white transition-colors mb-6 md:mb-8">
                {item.step}
            </div>
            
            <h4 className="font-serif text-xl mb-4 text-[#F5F6F7] leading-snug">
                {item.title}
            </h4>
            
            <p className="text-[#6B7280] text-sm leading-relaxed mt-auto">
              {item.desc}
            </p>

            <div className="absolute top-6 right-6 md:top-8 md:right-8 text-[#2A2D34] group-hover:text-white transition-colors">
                <ArrowRight size={20} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}