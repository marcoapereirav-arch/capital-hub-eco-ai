import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

const guarantees = [
    { 
        title: "GARANTÍA DE 30 DÍAS", 
        text: "Pruébalo a tu ritmo. Accede, explora y decide si es para ti. Si en los primeros 30 días no te convence, te devolvemos el 100% de tu dinero. Sin preguntas.",
        icon: <ShieldCheck size={32} />
    },
    { 
        title: "PAGO 100% SEGURO", 
        text: "Tu compra está protegida con encriptación bancaria. Tus datos están seguros y nunca se comparten con terceros.",
        icon: <Lock size={32} />
    }
];

export default function Clients() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {guarantees.map((item, index) => (
          <div 
            key={index} 
            className="flex flex-col p-6 md:p-10 border border-[#2A2D34] bg-[#0F0F12] relative overflow-hidden group"
          >
             <div className="mb-6 text-white opacity-80">
                {item.icon}
             </div>
             <h4 className="font-serif text-xl md:text-2xl mb-4 text-white uppercase tracking-wide">{item.title}</h4>
             <p className="text-[#9CA3AF] text-sm leading-relaxed">{item.text}</p>
             
             {/* Glow effect on hover */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
        ))}
      </div>
    </div>
  );
}