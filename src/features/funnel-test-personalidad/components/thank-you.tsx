"use client"

import { Sparkles, Camera, MessageCircle, ExternalLink, CheckCircle2 } from "lucide-react"
import { FUNNEL_TEST_PERSONALIDAD, whatsappLink, instagramDmLink } from "../config"

/**
 * Thank you page del Funnel Test Personalidad.
 *
 * Flujo que comunica al lead:
 *  1. Abrir el test (botón principal, abre en nueva pestaña)
 *  2. Cuando termines → mandanos screenshot por IG (preferido) o WhatsApp
 *
 * Decision Marco: preferimos Instagram porque ahi se sigue la conversacion natural
 * con el setter. WhatsApp queda como segunda opcion.
 */
export function TestPersonalidadThankYou() {
  return (
    <main className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-violet-900/10 pointer-events-none" />
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-5 py-12 md:py-16 flex flex-col min-h-[100dvh]">
        <div className="flex items-center gap-2 mb-12 md:mb-16">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
            Capital Hub
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {/* Confirmacion */}
          <div className="inline-flex items-center gap-2 text-emerald-400 mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Listo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold leading-[1.15] tracking-tight mb-4">
            Tu test está esperando.
          </h1>
          <p className="text-base md:text-lg text-zinc-300 leading-relaxed mb-10 max-w-xl">
            Pulsa el botón de abajo para abrir el test. Tarda 3 minutos. Cuando termines,
            <strong className="text-white"> mándanos la captura del resultado por Instagram</strong> y
            te decimos qué camino encaja contigo.
          </p>

          {/* CTA principal: abrir el test */}
          <a
            href={FUNNEL_TEST_PERSONALIDAD.TEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full max-w-md h-12 rounded-md bg-violet-500 hover:bg-violet-400 text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors text-base mb-3"
          >
            Abrir el test
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-zinc-500 mb-10 max-w-md">
            Se abre en una pestaña nueva — vuelve aquí cuando lo termines.
          </p>

          {/* Como enviar el resultado */}
          <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-5 max-w-md">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">
              Cuando termines, escríbenos
            </p>

            <a
              href={instagramDmLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 h-12 rounded-md bg-white text-black font-semibold hover:bg-zinc-200 transition-colors mb-2"
            >
              <Camera className="h-4 w-4" />
              <span className="flex-1 text-left text-sm">Mándanos screenshot por Instagram</span>
              <span className="text-[10px] font-mono text-zinc-500">recomendado</span>
            </a>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 h-11 rounded-md border border-zinc-700 hover:bg-zinc-900/70 transition-colors text-sm"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span className="flex-1 text-left">O por WhatsApp si prefieres</span>
            </a>
          </div>
        </div>

        <footer className="pt-12 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>
    </main>
  )
}
