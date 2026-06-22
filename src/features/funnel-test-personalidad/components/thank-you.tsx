"use client"

import { Camera, MessageCircle, ExternalLink, CheckCircle2 } from "lucide-react"
import { FUNNEL_TEST_PERSONALIDAD, whatsappLink, instagramDmLink } from "../config"

/**
 * Página de Gracias del Funnel Test Personalidad.
 * Brandkit Capital Hub: paleta minimalista B&W.
 *
 * Hace 3 cosas (copy de Marco):
 *   1. Agradece y confirma que ya está dentro.
 *   2. Entrega el LINK del test de Equilibria (abre en pestaña nueva).
 *   3. Explica el protocolo: hacer captura del resultado y enviarla por el MISMO
 *      chat de Instagram que ya tenía abierto, o por WhatsApp de Adrián.
 */
export function TestPersonalidadThankYou() {
  return (
    <main
      className="min-h-[100dvh] text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-12 md:py-20 flex flex-col min-h-[100dvh]">
        {/* Marca */}
        <div className="mb-12 md:mb-16">
          <span
            className="text-[11px] uppercase tracking-[0.25em] text-[#9CA3AF]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Capital Hub
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {/* Confirmación */}
          <div className="inline-flex items-center gap-2 text-white mb-5">
            <CheckCircle2 className="h-5 w-5" />
            <span
              className="text-[10px] uppercase tracking-[0.3em] text-[#9CA3AF]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Ya estás dentro
            </span>
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
            href={FUNNEL_TEST_PERSONALIDAD.TEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-md h-13 px-6 py-3.5 rounded-none bg-white hover:bg-[#F5F6F7] text-[#0F0F12] font-semibold inline-flex items-center justify-center gap-2 transition-colors text-base mb-3"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Abrir el test
            <ExternalLink className="h-4 w-4" />
          </a>
          <p
            className="text-[10px] uppercase tracking-[0.2em] text-[#6B7280] mb-12 max-w-md"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Se abre en una pestaña nueva — vuelve aquí cuando lo termines.
          </p>

          {/* Protocolo: cómo enviar el resultado */}
          <div className="border border-[#2A2D34] bg-[#18181B] p-5 md:p-6 max-w-md">
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-[#9CA3AF] mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Cuando termines, esto es lo que tienes que hacer
            </p>

            <ol className="space-y-3 mb-6">
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-white font-semibold shrink-0">1.</span>
                <span>
                  Haz <strong className="text-white">captura de pantalla</strong> de tu resultado
                  (los cuatro colores).
                </span>
              </li>
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-white font-semibold shrink-0">2.</span>
                <span>
                  Envíanosla por el <strong className="text-white">mismo chat de Instagram</strong>{" "}
                  donde ya estábamos hablando, o por el WhatsApp de Adrián.
                </span>
              </li>
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-white font-semibold shrink-0">3.</span>
                <span>Te leemos tu resultado y te decimos el siguiente paso.</span>
              </li>
            </ol>

            <a
              href={instagramDmLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 h-12 bg-white text-[#0F0F12] font-semibold hover:bg-[#F5F6F7] transition-colors mb-2"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              <Camera className="h-4 w-4" />
              <span className="flex-1 text-left text-sm">Enviar mi resultado por Instagram</span>
              <span
                className="text-[9px] uppercase tracking-[0.2em] text-[#6B7280]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                recomendado
              </span>
            </a>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 h-11 border border-[#3F3F46] hover:border-white hover:bg-[#2A2D34]/40 transition-colors text-sm text-[#F5F6F7]"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="flex-1 text-left">O por WhatsApp de Adrián</span>
            </a>
          </div>
        </div>

        <footer
          className="pt-12 text-[10px] uppercase tracking-[0.2em] text-[#6B7280]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>
    </main>
  )
}
