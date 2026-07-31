"use client"

import { Play, Eye, EyeOff, Clock, Video } from "lucide-react"
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
      className={`group relative flex cursor-pointer select-none flex-col overflow-hidden rounded-lg border transition ${
        seleccionado
          ? "border-[#22C55E] bg-[#22C55E]/[0.06]"
          : "border-[#2A2D34] bg-[#0F0F12] hover:border-[#22C55E]/40"
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#15161A]">
        {fuente?.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fuente.posterUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          // Ficha sin video: en vez de un hueco gris, fondo de marca con icono.
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#15161A] to-[#0F0F12]">
            <Video className="h-10 w-10 text-[#2A2D34]" />
          </div>
        )}

        {!sinVideo ? (
          <>
            <div className="absolute inset-0 bg-[#0F0F12]/20 transition group-hover:bg-[#0F0F12]/40" />
            <span
              className={`absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#22C55E] text-[#0F0F12] shadow-lg transition ${
                seleccionado ? "scale-110" : "group-hover:scale-110"
              }`}
            >
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </span>
          </>
        ) : null}

        {duracion ? (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-[#0F0F12]/85 px-2 py-1 text-xs font-medium text-white">
            <Clock className="h-3 w-3" />
            {duracion}
          </span>
        ) : null}

        {borrador ? (
          <span className="absolute left-2 top-2 rounded bg-amber-500/90 px-2 py-1 text-xs font-semibold text-[#0F0F12]">
            Borrador
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-semibold leading-snug text-white">{tutorial.titulo}</h3>
        {tutorial.descripcion ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-white/55">{tutorial.descripcion}</p>
        ) : null}
        {sinVideo ? (
          <p className="mt-1 text-xs text-amber-400/90">Todavía sin vídeo. Súbelo o pega un link de Loom.</p>
        ) : null}
      </div>

      {esAdmin ? (
        <div className="flex items-center gap-2 border-t border-[#2A2D34] px-4 py-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPublicar(borrador)
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            disabled={sinVideo && borrador}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {borrador ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
