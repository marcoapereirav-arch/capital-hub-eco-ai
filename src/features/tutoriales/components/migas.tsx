"use client"

import { ChevronRight, Home } from "lucide-react"
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
    <nav aria-label="Dónde estás" className="-mx-1 mb-5 overflow-x-auto px-1">
      <ol className="flex w-max items-center gap-1 text-sm">
        <li>
          <button
            type="button"
            onClick={() => onIr(null)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition ${
              camino.length === 0
                ? "text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            Tutoriales
          </button>
        </li>

        {camino.map((c, i) => {
          const ultima = i === camino.length - 1
          return (
            <li key={c.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
              <button
                type="button"
                onClick={() => onIr(c.id)}
                aria-current={ultima ? "page" : undefined}
                className={`max-w-[45vw] truncate rounded-lg px-2 py-1.5 transition sm:max-w-none ${
                  ultima ? "font-medium text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
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
