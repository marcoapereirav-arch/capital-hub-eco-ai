"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { comoSeReproduce, type Tutorial } from "../types"

type Props = {
  tutorial: Tutorial
  libraryId: string
  cdnHostname: string
  onCerrar: () => void
}

/**
 * El reproductor, en una capa encima de la pagina.
 *
 * Bunny y Loom se incrustan los dos con un iframe, asi que la pantalla es la
 * misma para los dos: quien mira el tutorial no tiene por que enterarse de
 * donde sale el video.
 */
export function Reproductor({ tutorial, libraryId, cdnHostname, onCerrar }: Props) {
  const [cargando, setCargando] = useState(true)
  const fuente = comoSeReproduce(tutorial, libraryId, cdnHostname)

  // Escapar cierra, como en cualquier ventana del sistema.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar()
    }
    window.addEventListener("keydown", alPulsar)
    // Con la capa abierta, el fondo no se desplaza.
    const previo = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", alPulsar)
      document.body.style.overflow = previo
    }
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F12]/95 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={tutorial.titulo}
      onClick={onCerrar}
    >
      <div
        className="flex w-full max-w-5xl flex-col gap-4"
        // Un clic dentro no cierra: solo el fondo.
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white sm:text-xl">{tutorial.titulo}</h2>
            {tutorial.descripcion ? (
              <p className="mt-1 line-clamp-2 text-sm text-white/60">{tutorial.descripcion}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el vídeo"
            className="shrink-0 rounded-lg border border-white/15 bg-white/5 p-2 text-white/70 transition hover:border-[#22C55E]/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#22C55E]/25 bg-[#0F0F12]">
          {fuente ? (
            <>
              <iframe
                src={fuente.embedUrl}
                title={tutorial.titulo}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={() => setCargando(false)}
                className="absolute inset-0 h-full w-full border-0"
              />
              {cargando ? (
                <div aria-hidden className="absolute inset-0 z-10">
                  <LoadingScreen fullscreen={false} className="absolute inset-0" />
                </div>
              ) : null}
            </>
          ) : (
            // Ficha sin vídeo: se dice, no se enseña un marco negro vacio.
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/60">
              Este tutorial todavía no tiene vídeo.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
