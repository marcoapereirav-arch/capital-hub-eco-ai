import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Button from './Button';

const CHECKOUT_URL = "https://start.thecapitalhub.io/checkout";

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
          className="w-full h-full object-cover grayscale opacity-40"
        >
          <source src="/videos/hero-funnel-lt8.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#0F0F12]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-[#0F0F12]/50"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center pt-32 pb-20 md:pt-40 md:pb-24">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">

            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 md:gap-3 border border-[#2A2D34] bg-[#18181B] px-3 md:px-4 py-2 rounded-[2px] mb-6 md:mb-8 max-w-full z-20">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse flex-shrink-0"></span>
                <span className="text-[8px] sm:text-[9px] md:text-xs text-[#9CA3AF] uppercase tracking-wide whitespace-normal text-center leading-tight md:leading-normal">
                    PARA CUALQUIER QUE QUIERA CONSEGUIR UN TRABAJO REMOTO (1.800€/MES-2.500€/MES) Y NO SEPA POR DÓNDE EMPEZAR
                </span>
            </div>

            {/* Headline con gradiente shine */}
            <h1 className="hero-title text-2xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.2] md:leading-[1.1] mb-6 tracking-tight uppercase break-words w-full px-2">
                <span className="h1-light">CONSIGUE TU </span>
                <span className="h1-bold">PRIMER TRABAJO REMOTO </span>
                <span className="h1-light">COMO </span>
                <span className="h1-bold">PROFESIONAL DIGITAL </span>
                <span className="h1-light">EN MENOS DE </span>
                <span className="h1-bold">90 DÍAS</span>
            </h1>

            {/* Subheadline */}
            <p className="text-[9px] sm:text-xs md:text-base text-[#9CA3AF] mb-8 tracking-wide md:tracking-widest uppercase px-4 leading-relaxed">
                INCLUSO SI PARTES DE CERO / SIN EXPERIENCIA PREVIA
            </p>

            {/* VSL Panda Video */}
            <div className="w-full max-w-[720px] mx-auto my-8 border border-[#2A2D34] rounded-[4px] overflow-hidden bg-black">
              <div className="relative pt-[56.25%]">
                <iframe
                  id="panda-6de0d9ab-d755-49c7-9e4e-ca6530119215"
                  src="https://player-vz-e95b06bb-77e.tv.pandavideo.com/embed/?v=6de0d9ab-d755-49c7-9e4e-ca6530119215"
                  className="border-0 absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Price & Description */}
            <div className="flex flex-col items-center gap-2 mb-10 px-4 w-full">
                <p className="text-lg md:text-xl text-white font-medium text-center leading-tight">Empieza hoy por solo 8€.</p>
                <p className="text-[#6B7280] font-light text-center text-sm md:text-base leading-relaxed">
                    Formación paso a paso + acceso garantizado a nuestra bolsa de empleo.
                </p>
            </div>

            {/* CTA verde con shimmer */}
            <div className="flex flex-col items-center gap-4 w-full px-4">
                <Button
                    text="EMPEZAR AHORA POR 8€"
                    href={CHECKOUT_URL}
                    variant="green"
                    size="lg"
                    icon={<ArrowUpRight size={18} />}
                    className="w-full md:w-auto md:min-w-[300px] text-xs md:text-sm"
                />
            </div>

            {/* Social Proof */}
            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#2A2D34] w-full max-w-2xl px-4">
                 <p className="text-xs md:text-sm text-[#6B7280] leading-relaxed text-center">
                    <span className="text-white font-semibold block mb-1 md:mb-0 md:inline">+ de 500.000 puestos de trabajo online publicados al año en España</span>
                    <span className="block md:inline"> — Informe Estado del Mercado Laboral en España 2024, InfoJobs y Esade</span>
                 </p>
            </div>

        </div>
      </div>
    </div>
  );
}
