import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Button from './Button';

export default function Hero() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0F0F12]">
      {/* Video Background with Heavy Overlay */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover grayscale opacity-40"
        >
          <source src="https://www.orfeoai.com/wp-content/uploads/2025/compressed.mp4" type="video/mp4" />
        </video>
        {/* Monochrome Overlays */}
        <div className="absolute inset-0 bg-[#0F0F12]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-[#0F0F12]/50"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center pt-32 pb-20 md:pt-40 md:pb-24">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 md:gap-3 border border-[#2A2D34] bg-[#18181B] px-3 md:px-4 py-2 rounded-[2px] mb-6 md:mb-8 max-w-full z-20">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse flex-shrink-0"></span>
                <span className="text-[8px] sm:text-[9px] md:text-xs font-mono text-[#9CA3AF] uppercase tracking-wide whitespace-normal text-center leading-tight md:leading-normal">
                    PARA CUALQUIER QUE QUIERA CONSEGUIR UN TRABAJO REMOTO (1.800€/MES-2.500€/MES) Y NO SEPA POR DÓNDE EMPEZAR
                </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-2xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.2] md:leading-[1.1] mb-6 text-white tracking-tight uppercase break-words w-full px-2">
                Consigue tu primer trabajo remoto como profesional digital en menos de 90 días
            </h1>

            {/* Subheadline */}
            <p className="font-mono text-[9px] sm:text-xs md:text-base text-[#9CA3AF] mb-8 tracking-wide md:tracking-widest uppercase px-4 leading-relaxed whitespace-nowrap">
                INCLUSO SI PARTES DE CERO / SIN EXPERIENCIA PREVIA
            </p>

            {/* Price & Description */}
            <div className="flex flex-col items-center gap-2 mb-10 px-4 w-full">
                <p className="text-lg md:text-xl text-white font-medium text-center leading-tight">Empieza hoy por solo 8€.</p>
                <p className="text-[#6B7280] font-light text-center text-sm md:text-base leading-relaxed max-w-sm md:max-w-none mx-auto">
                    Formación paso a paso + acceso garantizado a nuestra bolsa de empleo.
                </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4 w-full px-4">
                <Button 
                    text="EMPEZAR AHORA POR 8€" 
                    href="#offer" 
                    size="lg" 
                    icon={<ArrowUpRight size={18} />} 
                    className="w-full md:w-auto min-w-0 md:min-w-[300px] text-xs md:text-sm py-4 md:py-5"
                />
                <p className="text-[10px] text-[#4B5563] font-mono mt-2 text-center max-w-[280px] md:max-w-xs leading-relaxed mx-auto">
                    14 días gratis. Después 44€/mes. Cancela cuando quieras. Garantía de devolución de 30 días.
                </p>
            </div>

            {/* Social Proof */}
            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#2A2D34] w-full max-w-lg px-4">
                 <p className="text-xs md:text-sm text-[#6B7280] leading-relaxed">
                    <span className="text-white font-semibold block md:inline mb-1 md:mb-0">+ de 450 puestos de trabajo online</span> demandados mensualmente según <span className="underline decoration-1 underline-offset-4 whitespace-nowrap">El País</span>
                 </p>
            </div>

        </div>
      </div>
    </div>
  );
}