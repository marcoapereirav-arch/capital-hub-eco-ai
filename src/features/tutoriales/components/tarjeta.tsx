"use client"

import { Play, Eye, EyeOff, Clock, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { MenuAcciones } from "./menu-acciones"
import { comoSeReproduce, duracionLegible, type Tutorial } from "../types"

type Props = {
  tutorial: Tutorial
  libraryId: string
  cdnHostname: string
  esAdmin: boolean
  seleccionado: boolean
  onSeleccionar: () => void
  onAbrir: () => void
  onPublicar: (publicar: boolean) => void
  onRenombrar: () => void
  onMover: () => void
  onBorrar: () => void
}

/**
 * La ficha de un video.
 *
 * Un clic la selecciona, dos la reproducen. Igual que en Drive, y que las
 * carpetas: si abrir una carpeta necesita dos clics y abrir un video uno, la
 * misma pantalla estaria enseñando dos reglas distintas.
 *
 * Visual por delante del texto: miniatura grande y duracion a la vista.
 */
export function Tarjeta({
  tutorial, libraryId, cdnHostname, esAdmin, seleccionado,
  onSeleccionar, onAbrir, onPublicar, onRenombrar, onMover, onBorrar,
}: Props) {
  const fuente = comoSeReproduce(tutorial, libraryId, cdnHostname)
  const duracion = duracionLegible(tutorial.duracion_seg)
  const sinVideo = !fuente
  const borrador = tutorial.status === "draft"

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Vídeo ${tutorial.titulo}`}
      /* Igual que en las carpetas: el clic no sube al fondo, que es donde vive
         el "deseleccionar". Si subiera, seleccionar y deseleccionar ocurririan
         en el mismo clic y no se veria nada. */
      onClick={(e) => {
        e.stopPropagation()
        onSeleccionar()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!sinVideo) onAbrir()
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !sinVideo) onAbrir()
        if (e.key === " ") {
          e.preventDefault()
          onSeleccionar()
        }
      }}
      className={cn(
        "group relative flex cursor-pointer select-none flex-col overflow-hidden rounded-lg border transition-colors",
        seleccionado
          ? "border-primary bg-primary/10"
          : "border-border bg-background md:hover:border-primary/40",
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-card">
        {fuente?.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fuente.posterUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-300 md:group-hover:scale-[1.03]"
          />
        ) : (
          // Ficha sin video: en vez de un hueco gris, superficie de marca con icono.
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <Video className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        {!sinVideo ? (
          <>
            <div className="absolute inset-0 bg-background/20 transition md:group-hover:bg-background/40" />
            <span
              className={cn(
                "absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition",
                seleccionado ? "scale-110" : "md:group-hover:scale-110",
              )}
            >
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </span>
          </>
        ) : null}

        {duracion ? (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-sm bg-background/85 px-2 py-1 text-sm font-medium tabular-nums text-foreground">
            <Clock className="h-3.5 w-3.5" />
            {duracion}
          </span>
        ) : null}

        {borrador ? (
          <span className="absolute left-2 top-2 rounded-sm bg-warn px-2 py-1 text-sm font-semibold text-warn-foreground">
            Borrador
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">{tutorial.titulo}</h3>
        {tutorial.descripcion ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tutorial.descripcion}</p>
        ) : null}
        {sinVideo ? (
          <p className="mt-1 text-sm text-warn">Todavía sin vídeo. Súbelo o pega un link de Loom.</p>
        ) : null}
      </div>

      {esAdmin ? (
        <div className="flex items-center gap-2 border-t border-border px-4 py-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPublicar(borrador)
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            disabled={sinVideo && borrador}
            className="flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors active:bg-muted disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:hover:bg-muted md:hover:text-foreground"
          >
            {borrador ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {borrador ? "Publicar" : "Ocultar"}
          </button>
          <div className="ml-auto">
            <MenuAcciones
              etiqueta={tutorial.titulo}
              onRenombrar={onRenombrar}
              onMover={onMover}
              onBorrar={onBorrar}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
