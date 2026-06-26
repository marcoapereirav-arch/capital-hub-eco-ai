"use client"

import { Camera, MessageCircle, ExternalLink, CheckCircle2 } from "lucide-react"
import { FUNNEL_TEST_PERSONALIDAD } from "../config"

/**
 * Página de Gracias del Funnel Test Personalidad.
 * Brandkit Capital Hub: base monocromo B&W + verde de acento (#22C55E). Tipografía
 * normal y limpia (Inter Tight / Inter), sin labels mono espaciados.
 *
 * Hace 3 cosas (copy de Marco):
 *   1. Agradece y confirma que ya está dentro.
 *   2. Entrega el LINK del test de Equilibria (abre en pestaña nueva).
 *   3. Explica el protocolo: hacer captura del resultado y enviarla por el MISMO
 *      chat de Instagram que ya tenía abierto, o por WhatsApp de Adrián.
 *
 * Los links (test/whatsapp/instagram) llegan por props desde el server (editables
 * desde el popup ⚙️ de /webs); si no, caen al default de config.ts.
 */
type Props = {
  testUrl?: string
  whatsapp?: string
  instagram?: string
}

export function TestPersonalidadThankYou({ testUrl, whatsapp, instagram }: Props = {}) {
  const resolvedTestUrl = testUrl || FUNNEL_TEST_PERSONALIDAD.TEST_URL
  const resolvedWhatsapp = whatsapp || FUNNEL_TEST_PERSONALIDAD.WHATSAPP_NUMBER
  const resolvedInstagram = instagram || FUNNEL_TEST_PERSONALIDAD.INSTAGRAM_HANDLE
  const whatsappHref = `https://wa.me/${resolvedWhatsapp}?text=${encodeURIComponent(
    "Hola, acabo de hacer el test de personalidad. Te dejo mi resultado.",
  )}`
  const instagramHref = `https://instagram.com/${resolvedInstagram}`
  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Acento verde sutil arriba a la derecha, coherente con el landing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(640px 360px at 88% -6%, rgba(34,197,94,0.10), transparent 68%)" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 md:px-8 py-12 md:py-20 flex flex-col min-h-[100dvh]">
        {/* Marca */}
        <div className="mb-12 md:mb-16">
          <span className="text-sm font-semibold uppercase tracking-[0.15em] text-[#F5F6F7]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            Capital Hub
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {/* Confirmación */}
          <div className="inline-flex items-center gap-2 mb-5">
            <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
            <span className="text-[13px] text-[#9CA3AF]">Ya estás dentro</span>
          </div>

          <h1
            className="text-3xl md:text-4xl font-medium leading-[1.12] tracking-tight mb-4 text-white"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Gracias. Tu acceso al test está listo.
          </h1>
          <p className="text-base md:text-lg text-[#D1D5DB] leading-relaxed mb-10 max-w-xl">
            Pulsa el botón para abrir el test. Son 15 minutos y al terminar verás tu resultado en
            cuatro colores. Después seguimos contigo para decirte qué profesión digital encaja de
            verdad con tu perfil.
          </p>

          {/* CTA principal: abrir el test */}
          <a
            href={resolvedTestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tp-open group relative block w-full max-w-md h-13 px-6 py-3.5 rounded-none bg-white text-[#0F0F12] font-semibold inline-flex items-center justify-center gap-2 overflow-hidden text-base mb-3"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            <span aria-hidden className="tp-open-fill" />
            <span className="tp-open-label relative z-10">Abrir el test</span>
            <ExternalLink className="tp-open-label relative z-10 h-4 w-4" />
          </a>
          <p className="text-[13px] text-[#6B7280] mb-12 max-w-md">
            Se abre en una pestaña nueva — vuelve aquí cuando lo termines.
          </p>

          {/* Protocolo: cómo enviar el resultado */}
          <div className="border border-[#2A2D34] bg-[#18181B] p-5 md:p-6 max-w-md">
            <p className="text-[13px] text-[#9CA3AF] mb-4">
              Cuando termines, esto es lo que tienes que hacer
            </p>

            <ol className="space-y-3 mb-6">
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#22C55E] font-semibold shrink-0">1.</span>
                <span>
                  Haz <strong className="text-white">captura de pantalla</strong> de tu resultado
                  (los cuatro colores).
                </span>
              </li>
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#22C55E] font-semibold shrink-0">2.</span>
                <span>
                  Envíanosla por el <strong className="text-white">mismo chat de Instagram</strong>{" "}
                  donde ya estábamos hablando, o por el WhatsApp de Adrián.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#22C55E] font-semibold shrink-0">3.</span>
                <span>Te leemos tu resultado y te decimos el siguiente paso.</span>
              </li>
            </ol>

            <a
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 h-12 bg-white text-[#0F0F12] font-semibold hover:bg-[#F5F6F7] transition-colors mb-2"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              <Camera className="h-4 w-4" />
              <span className="flex-1 text-left text-sm">Enviar mi resultado por Instagram</span>
              <span className="text-[11px] font-semibold text-[#22C55E]">Recomendado</span>
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 h-11 border border-[#3F3F46] hover:border-[#22C55E] hover:bg-[#22C55E]/10 transition-colors text-sm text-[#F5F6F7]"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="flex-1 text-left">O por WhatsApp de Adrián</span>
            </a>
          </div>
        </div>

        <footer className="pt-12 text-[13px] text-[#6B7280]">
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>

      <style>{`
        .tp-open-fill { position:absolute; inset:0; background:#22C55E; transform: scaleX(0); transform-origin:left; transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1); }
        .tp-open:hover .tp-open-fill { transform: scaleX(1); }
        .tp-open-label { transition: color 0.3s ease; }
        .tp-open:hover .tp-open-label { color: #FFFFFF; }
        @media (prefers-reduced-motion: reduce) { .tp-open-fill { transition: none; } }
      `}</style>
    </main>
  )
}
