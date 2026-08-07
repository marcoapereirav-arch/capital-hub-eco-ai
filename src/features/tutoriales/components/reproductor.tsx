"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { cn } from "@/lib/utils"
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
 *
 * Hoja inferior en telefono y ventana centrada en escritorio, decidido con
 * clases `md:` y no con JavaScript. Antes era una capa a mano con `fixed
 * inset-0` centrada: en el telefono el video se quedaba diminuto en el medio y
 * el titulo pegado al borde.
 */
export function Reproductor({ tutorial, libraryId, cdnHostname, onCerrar }: Props) {
  const [cargando, setCargando] = useState(true)
  const fuente = comoSeReproduce(tutorial, libraryId, cdnHostname)

  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar()
      }}
    >
      {/* Si el video no trae descripcion, se le dice a la ventana que NO la lleva:
          sin eso avisa por consola de que le falta, y no vamos a inventar texto. */}
      <SheetContent
        side="bottom"
        {...(tutorial.descripcion ? {} : { "aria-describedby": undefined })}
        className={cn(
          "rounded-t-xl",
          // ESCRITORIO: la misma hoja, centrada y ancha. Sin JavaScript de por medio.
          // Se repite la condicion del lado en las clases que pelean: las del kit llevan
          // `data-[side=bottom]` y pesan mas que un `md:` suelto. Sin repetirla, la ventana
          // se quedaba anclada arriba Y abajo a la vez y el video salia cortado.
          "md:data-[side=bottom]:bottom-auto md:top-1/2 md:mx-auto md:data-[side=bottom]:h-auto md:data-[side=bottom]:max-h-[90dvh] md:w-[min(1024px,calc(100vw-4rem))] md:-translate-y-1/2 md:rounded-xl md:border md:pb-4",
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold md:text-xl">{tutorial.titulo}</SheetTitle>
          {tutorial.descripcion ? (
            <SheetDescription className="line-clamp-2 text-[15px]">{tutorial.descripcion}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="px-4 pb-safe-4 md:pb-0">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-primary/25 bg-background">
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
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[15px] text-muted-foreground">
                Este tutorial todavía no tiene vídeo.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
