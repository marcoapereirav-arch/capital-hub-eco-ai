"use client"

import { Folder, Video, FolderOpen } from "lucide-react"
import { MenuAcciones } from "./menu-acciones"
import type { Carpeta } from "../types"

type Props = {
  carpeta: Carpeta
  dentro: { carpetas: number; videos: number }
  esAdmin: boolean
  seleccionada: boolean
  onSeleccionar: () => void
  onAbrir: () => void
  onRenombrar: () => void
  onMover: () => void
  onBorrar: () => void
}

/**
 * La tarjeta de una carpeta, tipo Google Drive.
 *
 * Un clic la selecciona, dos la abren. Igual que en Drive.
 *
 * Dice de un vistazo QUE hay dentro (contando tambien lo que cuelga mas abajo),
 * porque una carpeta que no dice nada obliga a entrar para averiguarlo.
 */
export function TarjetaCarpeta({
  carpeta, dentro, esAdmin, seleccionada, onSeleccionar, onAbrir, onRenombrar, onMover, onBorrar,
}: Props) {
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
    <div
      role="button"
      tabIndex={0}
      aria-label={`Carpeta ${carpeta.nombre}`}
      /* El clic NO puede subir al fondo de la pagina: ahi vive el
         "deseleccionar", y al llegarle el mismo clic quitaba la seleccion en
         el mismo instante en que se ponia. Se veia como que no pasaba nada. */
      onClick={(e) => {
        e.stopPropagation()
        onSeleccionar()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onAbrir()
      }}
      // Con el teclado, Enter abre directamente: pedir dos pulsaciones seria
      // absurdo y dejaria la carpeta inalcanzable para quien no usa raton.
      onKeyDown={(e) => {
        if (e.key === "Enter") onAbrir()
        if (e.key === " ") {
          e.preventDefault()
          onSeleccionar()
        }
      }}
      className={`group relative flex cursor-pointer select-none items-center gap-3 rounded-lg border p-4 transition ${
        seleccionada
          ? "border-[#22C55E] bg-[#22C55E]/[0.08]"
          : "border-[#2A2D34] bg-[#15161A] hover:border-[#22C55E]/40 hover:bg-[#181A1F]"
      }`}
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/[0.10]">
        <Folder className={`h-5 w-5 text-[#4ADE80] transition ${seleccionada ? "opacity-0" : "group-hover:opacity-0"}`} />
        <FolderOpen
          className={`absolute h-5 w-5 text-[#4ADE80] transition ${seleccionada ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        />
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
