"use client"

import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Carpeta } from "../types"

type Props = {
  camino: Carpeta[]
  onIr: (carpetaId: string | null) => void
}

/**
 * Las migas de pan: Tutoriales / Carpeta / Subcarpeta.
 *
 * En movil el camino largo no se encoge (quedaria ilegible): se desplaza a lo
 * ancho dentro de su propia barra, sin arrastrar la pagina entera con el.
 */
export function Migas({ camino, onIr }: Props) {
  return (
    <nav aria-label="Dónde estás" className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ol className="flex w-max items-center gap-1 text-[15px]">
        <li>
          <button
            type="button"
            onClick={() => onIr(null)}
            className={cn(
              "flex h-11 items-center gap-1.5 rounded-lg px-2 transition-colors md:h-9",
              camino.length === 0
                ? "text-foreground"
                : "text-muted-foreground active:bg-muted md:hover:bg-muted md:hover:text-foreground",
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            Tutoriales
          </button>
        </li>

        {camino.map((c, i) => {
          const ultima = i === camino.length - 1
          return (
            <li key={c.id} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              <button
                type="button"
                onClick={() => onIr(c.id)}
                aria-current={ultima ? "page" : undefined}
                className={cn(
                  "h-11 max-w-[45vw] truncate rounded-lg px-2 transition-colors md:h-9 md:max-w-none",
                  ultima
                    ? "font-medium text-foreground"
                    : "text-muted-foreground active:bg-muted md:hover:bg-muted md:hover:text-foreground",
                )}
              >
                {c.nombre}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
