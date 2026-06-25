"use client"

import { CheckCircle2, ExternalLink, Play } from "lucide-react"
import { FUNNEL_RESERVAR, bunnyEmbedUrl } from "../config"

/**
 * Página /reservar/gracias — post-booking (gracias-agenda).
 *
 * Copy basado en el vídeo de Adrián (Video-Adri-Post-Agenda):
 *  1) conéctate sin distracciones (sitio tranquilo, papel/boli, auriculares, 100%)
 *  2) llega con tu ruta más o menos clara (haz el test + mira las 3 rutas)
 *  + puntualidad.
 *
 * Vídeo: iframe de Bunny si hay VIDEO_GUID; si no, placeholder (pendiente de subir).
 * Botón: "aún no has hecho el test" → abre el test en ventana nueva.
 */
type Props = { videoGuid?: string; libraryId?: string; testUrl?: string }

export function ThanksAgenda({ videoGuid, libraryId, testUrl }: Props = {}) {
  const guid = videoGuid ?? FUNNEL_RESERVAR.VIDEO_GUID
  const lib = libraryId ?? FUNNEL_RESERVAR.BUNNY_LIBRARY_ID
  const test = testUrl ?? FUNNEL_RESERVAR.TEST_URL

  return (
    <main
      className="min-h-[100dvh] text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mx-auto max-w-2xl px-5 md:px-8 py-10 md:py-16">
        <header className="mb-10 md:mb-14">
          <span
            className="text-[11px] uppercase tracking-[0.4em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 500 }}
          >
            CAPITAL&nbsp;HUB
          </span>
        </header>

        {/* Confirmación */}
        <div className="mb-5 inline-flex items-center gap-2 text-white">
          <CheckCircle2 className="h-5 w-5" />
          <span
            className="text-[10px] uppercase tracking-[0.3em] text-[#9CA3AF]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Sesión agendada
          </span>
        </div>

        <h1
          className="mb-3 text-3xl md:text-4xl font-medium leading-[1.12] tracking-[-0.01em] text-white"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Tu sesión está reservada.
        </h1>
        <p className="mb-8 max-w-xl text-base md:text-lg leading-relaxed text-[#C7CBD1]">
          Antes de la llamada, mira este vídeo. En 2 minutos tienes todo lo que necesitas para
          sacarle el máximo partido a la sesión.
        </p>

        {/* Vídeo */}
        <div className="mb-10 overflow-hidden border border-[#2A2D34] bg-[#141418]">
          {guid ? (
            <div className="relative" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={bunnyEmbedUrl(guid, lib)}
                loading="lazy"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-[#6B7280]">
              <Play className="h-8 w-8" />
              <span
                className="text-[10px] uppercase tracking-[0.25em]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Vídeo en breve
              </span>
            </div>
          )}
        </div>

        {/* 2 claves para aprovechar la llamada */}
        <h2
          className="mb-5 text-lg md:text-xl font-medium tracking-[-0.01em] text-white"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Cómo sacarle el máximo partido
        </h2>

        <div className="mb-8 space-y-4">
          <div className="border-l-2 border-white pl-5">
            <p
              className="mb-1.5 text-[10px] uppercase tracking-[0.25em] text-[#9CA3AF]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              01 — Conéctate sin distracciones
            </p>
            <p className="text-base leading-relaxed text-[#C7CBD1]">
              Busca un sitio tranquilo donde nadie te moleste. Ten papel y boli para tus dudas, ponte
              auriculares y está al 100%. Nada de hacerlo desde el coche o a medias.
            </p>
          </div>
          <div className="border-l-2 border-[#2A2D34] pl-5">
            <p
              className="mb-1.5 text-[10px] uppercase tracking-[0.25em] text-[#9CA3AF]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              02 — Llega con tu ruta más o menos clara
            </p>
            <p className="text-base leading-relaxed text-[#C7CBD1]">
              Haz el test de personalidad y echa un ojo a las 3 rutas — <strong className="text-white">Marketing</strong>,{" "}
              <strong className="text-white">Comercial digital</strong> o{" "}
              <strong className="text-white">Inteligencia Artificial</strong>. No hace falta tenerlo
              decidido al 100%, pero sí una idea de por dónde quieres ir.
            </p>
          </div>
        </div>

        {/* CTA: hacer el test si aún no */}
        <a
          href={test}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 inline-flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-none bg-white px-6 text-[15px] font-semibold text-[#0F0F12] transition-colors hover:bg-[#F5F6F7]"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          ¿Aún no has hecho el test? Hazlo aquí
          <ExternalLink className="h-4 w-4" />
        </a>

        {/* Puntualidad */}
        <div className="border border-[#2A2D34] bg-[#141418] p-5">
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#9CA3AF]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Importante
          </p>
          <p className="text-sm leading-relaxed text-[#C7CBD1]">
            Sé puntual. Las plazas son limitadas: si no puedes asistir, cancela con tiempo para que
            otra persona pueda cogerla.
          </p>
        </div>

        <footer
          className="pt-10 text-[10px] uppercase tracking-[0.25em] text-[#4B5159]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>
    </main>
  )
}
