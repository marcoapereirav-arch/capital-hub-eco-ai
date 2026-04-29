import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Button from '@/features/public-pages/funnel-lt8/components/Button';

const CHECKOUT_URL = "/mifge/checkout";

export default function Hero() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0F0F12]">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover grayscale opacity-30"
        >
          <source src="/videos/hero-funnel-lt8.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#0F0F12]/85"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-[#0F0F12]/60"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 h-screen flex flex-col justify-center pt-20 pb-8 md:pt-24 md:pb-12">
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center">

            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 border border-[#2A2D34] bg-[#18181B] px-3 py-1.5 rounded-[2px] mb-3 md:mb-4 max-w-full z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0"></span>
                <span className="text-[8px] sm:text-[9px] md:text-[10px] text-[#9CA3AF] uppercase tracking-wide whitespace-normal text-center leading-tight">
                    PARA QUIEN QUIERE UN TRABAJO REMOTO DE 1.800€-2.500€/MES Y NO SABE POR DÓNDE EMPEZAR
                </span>
            </div>

            {/* Headline — más compacto */}
            <h1 className="hero-title text-xl sm:text-3xl md:text-5xl lg:text-6xl leading-[1.15] mb-3 md:mb-4 tracking-tight uppercase break-words w-full px-2 text-center">
                <span className="h1-light">CONSIGUE TU </span>
                <span className="h1-bold">PRIMER TRABAJO REMOTO </span>
                <span className="h1-light">EN MENOS DE </span>
                <span className="h1-bold">90 DÍAS</span>
            </h1>

            <p className="text-[9px] sm:text-[10px] md:text-xs text-[#9CA3AF] mb-4 md:mb-5 tracking-wide uppercase px-4 leading-relaxed text-center">
                INCLUSO SI PARTES DE CERO, SIN EXPERIENCIA PREVIA
            </p>

            {/* VSL Panda — más compacto: max-w más pequeño y altura controlada */}
            <div className="w-full max-w-[560px] md:max-w-[620px] mx-auto mb-4 md:mb-5 border border-[#2A2D34] rounded-[4px] overflow-hidden bg-black">
              <div className="relative pt-[56.25%]">
                <iframe
                  id="panda-mifge-vsl"
                  src="https://player-vz-e95b06bb-77e.tv.pandavideo.com/embed/?v=6de0d9ab-d755-49c7-9e4e-ca6530119215"
                  className="border-0 absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Promesa + CTA juntos, sin grandes huecos */}
            <p className="text-base md:text-lg text-white font-medium text-center leading-tight mb-1 px-4">
                Empieza GRATIS. 14 días sin pagar nada.
            </p>
            <p className="text-[#6B7280] text-xs md:text-sm text-center mb-4 px-4">
                Cancela cuando quieras con 1 clic.
            </p>

            <Button
                text="QUIERO MI PRUEBA GRATUITA"
                href={CHECKOUT_URL}
                variant="green"
                size="lg"
                icon={<ArrowUpRight size={16} />}
                className="w-full md:w-auto md:min-w-[300px] text-xs"
            />
            <p className="text-[10px] text-[#4B5563] font-mono mt-2.5 text-center leading-relaxed whitespace-nowrap">
                Sin compromiso. Garantía 30 días desde el primer cobro.
            </p>

        </div>
      </div>
    </div>
  );
}
