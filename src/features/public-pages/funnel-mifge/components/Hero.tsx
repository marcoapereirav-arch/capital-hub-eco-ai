import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Button from '@/features/public-pages/funnel-lt8/components/Button';

// Si la env Whop directa está configurada, va a Whop. Si no, pasa por /mifge/checkout
// (que es un loader que redirige a Whop también, o sirve como fallback).
const CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_MES || "/mifge/checkout";

export default function Hero() {
  return (
    <>
      {/* Resource hints del VSL Panda — React 19 los hoist al <head> automáticamente.
          Resultado: cuando el iframe se monta, CSS+config+playlist ya están en cache. */}
      <link rel="preload" href="https://player-vz-e95b06bb-77e.tv.pandavideo.com.br/embed/css/plyr.css" as="style" />
      <link rel="preload" href="https://player-vz-e95b06bb-77e.tv.pandavideo.com.br/embed/css/styles.css" as="style" />
      <link rel="preload" href="https://player-vz-e95b06bb-77e.tv.pandavideo.com.br/embed/css/pb.css" as="style" />
      <link rel="preload" href="https://config.tv.pandavideo.com.br/vz-e95b06bb-77e/6de0d9ab-d755-49c7-9e4e-ca6530119215.json" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="https://config.tv.pandavideo.com.br/vz-e95b06bb-77e/config.json" as="fetch" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://b-vz-e95b06bb-77e.tv.pandavideo.com.br" />
      <link rel="preload" href="https://b-vz-e95b06bb-77e.tv.pandavideo.com.br/6de0d9ab-d755-49c7-9e4e-ca6530119215/playlist.m3u8" as="fetch" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://player-vz-e95b06bb-77e.tv.pandavideo.com" />

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

      <div className="relative z-10 container mx-auto px-6 min-h-screen flex flex-col justify-center pt-20 pb-20 md:pt-24 md:pb-24">
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

            {/* VSL Panda — compacto */}
            <div className="w-full max-w-[560px] md:max-w-[620px] mx-auto mb-4 md:mb-5 border border-[#2A2D34] rounded-[4px] overflow-hidden bg-black">
              <div className="relative pt-[56.25%]">
                <iframe
                  id="panda-mifge-vsl"
                  src="https://player-vz-e95b06bb-77e.tv.pandavideo.com/embed/?v=6de0d9ab-d755-49c7-9e4e-ca6530119215"
                  className="border-0 absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  {...({ fetchpriority: "high" } as Record<string, string>)}
                />
              </div>
            </div>

            {/* Promesa + CTA juntos */}
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

            {/* Social proof — RESTAURADO. Dato InfoJobs/Esade. Da contexto del mercado. */}
            <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-[#2A2D34] w-full max-w-2xl px-4">
                <p className="text-xs md:text-sm text-[#6B7280] leading-relaxed text-center">
                    <span className="text-white font-semibold block mb-1 md:mb-0 md:inline">+ de 500.000 puestos de trabajo online publicados al año en España</span>
                    <span className="block md:inline"> — Informe Estado del Mercado Laboral en España 2024, InfoJobs y Esade</span>
                </p>
            </div>

        </div>
      </div>
    </div>
    </>
  );
}
