"use client"

import { Folder, Video, FolderOpen } from "lucide-react"
import { MenuAcciones } from "./menu-acciones"
import type { Carpeta } from "../types"

type Props = {
  carpeta: Carpeta
  dentro: { carpetas: number; videos: number }
  esAdmin: boolean
  onAbrir: () => void
  onRenombrar: () => void
  onMover: () => void
  onBorrar: () => void
}

/**
 * La tarjeta de una carpeta, tipo Google Drive.
 *
 * Dice de un vistazo QUE hay dentro (contando tambien lo que cuelga mas abajo),
 * porque una carpeta que no dice nada obliga a entrar para averiguarlo.
 * La forma la distingue del video: la carpeta es ancha y baja, el video lleva
 * portada grande. No hace falta leer para saber cual es cual.
 */
export function TarjetaCarpeta({ carpeta, dentro, esAdmin, onAbrir, onRenombrar, onMover, onBorrar }: Props) {
  const vacia = dentro.carpetas === 0 && dentro.videos === 0

  const resumen = vacia
    ? "Vacía"
    : [
        dentro.carpetas > 0 ? `${dentro.carpetas} ${dentro.carpetas === 1 ? "carpeta" : "carpetas"}` : null,
        dentro.videos > 0 ? `${dentro.videos} ${dentro.videos === 1 ? "vídeo" : "vídeos"}` : null,
      ]
        .filter(Boolean)
        .join(" · ")

  return (
    <div className="group relative flex items-center gap-3 rounded-lg border border-[#2A2D34] bg-[#15161A] p-4 transition hover:border-[#22C55E]/40 hover:bg-[#181A1F]">
      <button
        type="button"
        onClick={onAbrir}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`Abrir la carpeta ${carpeta.nombre}`}
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/[0.10]">
          <Folder className="h-5 w-5 text-[#4ADE80] transition group-hover:opacity-0" />
          <FolderOpen className="absolute h-5 w-5 text-[#4ADE80] opacity-0 transition group-hover:opacity-100" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{carpeta.nombre}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45">
            {dentro.videos > 0 ? <Video className="h-3 w-3" /> : null}
            {resumen}
          </span>
          {carpeta.descripcion ? (
            <span className="mt-0.5 block truncate text-xs text-white/35">{carpeta.descripcion}</span>
          ) : null}
        </span>
      </button>

      {esAdmin ? (
        <MenuAcciones
          etiqueta={`la carpeta ${carpeta.nombre}`}
          onRenombrar={onRenombrar}
          onMover={onMover}
          onBorrar={onBorrar}
        />
      ) : null}
    </div>
  )
}
