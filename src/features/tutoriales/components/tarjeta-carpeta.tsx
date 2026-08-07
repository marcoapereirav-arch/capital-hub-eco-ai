"use client"

import { Folder, Video, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
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
      className={cn(
        "group relative flex min-h-14 cursor-pointer select-none items-center gap-3 rounded-lg border p-4 transition-colors",
        seleccionada
          ? "border-primary bg-primary/10"
          : "border-border bg-card md:hover:border-primary/40",
      )}
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Folder className={cn("h-5 w-5 text-primary transition", seleccionada ? "opacity-0" : "md:group-hover:opacity-0")} />
        <FolderOpen
          className={cn(
            "absolute h-5 w-5 text-primary transition",
            seleccionada ? "opacity-100" : "opacity-0 md:group-hover:opacity-100",
          )}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-foreground">{carpeta.nombre}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          {dentro.videos > 0 ? <Video className="h-3.5 w-3.5 shrink-0" /> : null}
          {resumen}
        </span>
        {carpeta.descripcion ? (
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">{carpeta.descripcion}</span>
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
