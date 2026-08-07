"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * TODA lista del OS pasa por aqui. Nunca se pinta una lista larga entera.
 *
 * Marco, 2026-08-07: *"siempre, siempre que vayas a hacer una lista, tiene que
 * haber maximo 20. Esto lo tienes que crear en un skill o en algo para que
 * siempre se cumpla"*.
 *
 * Por eso el tamano de pagina NO es un parametro que se pueda subir: es una
 * constante de este archivo. Si un dia hay que cambiarlo, se cambia aqui y
 * cambia en todo el OS a la vez, que es justo lo que Marco pidio.
 *
 * Que resuelve, aparte del limite:
 *  - vuelve arriba al cambiar de pagina (si no, cambias de pagina y sigues a
 *    mitad de lista sin enterarte)
 *  - si un filtro deja menos paginas de las que habia, se cae sola a la ultima
 *    en vez de ensenar una pagina en blanco
 *  - dice SIEMPRE en que punto estas ("Viendo 21 a 40 de 132"), porque si no el
 *    usuario no sabe si le faltan dos o doscientos
 */

/** El maximo por pagina en TODO el OS. No se pasa por parametro a proposito. */
export const POR_PAGINA = 20

export function ListaPaginada<T>({
  items,
  children,
  claveDeFiltros,
  className,
  nombreSingular = "registro",
  nombrePlural = "registros",
}: {
  items: T[]
  /** Pinta los elementos de la pagina actual. */
  children: (pagina: T[]) => React.ReactNode
  /**
   * Cambia cuando cambian los filtros de fuera. Al cambiar, se vuelve a la
   * pagina 1: si no, filtras y te quedas en una pagina que ya no existe.
   */
  claveDeFiltros?: string
  className?: string
  nombreSingular?: string
  nombrePlural?: string
}) {
  const [pagina, setPagina] = useState(1)
  const [contenedor, setContenedor] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    setPagina(1)
  }, [claveDeFiltros])

  const totalPaginas = Math.max(1, Math.ceil(items.length / POR_PAGINA))
  // Se calcula al pintar y NO se guarda: asi nunca se ve una pagina en blanco
  // cuando un filtro reduce la lista.
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = (paginaSegura - 1) * POR_PAGINA
  const enPantalla = useMemo(
    () => items.slice(desde, desde + POR_PAGINA),
    [items, desde]
  )

  function ir(n: number) {
    setPagina(n)
    // Vuelve arriba dentro del propio contenedor, no de la pagina entera: esto
    // vive tanto suelto como dentro de una ventana emergente.
    contenedor?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const hayVarias = totalPaginas > 1

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div ref={setContenedor} className="no-overscroll min-h-0 flex-1 overflow-y-auto">
        {children(enPantalla)}
      </div>

      {hayVarias && (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
          <p className="text-sm tabular-nums text-muted-foreground">
            Viendo <span className="font-semibold text-foreground">{desde + 1}</span> a{" "}
            <span className="font-semibold text-foreground">
              {Math.min(desde + POR_PAGINA, items.length)}
            </span>{" "}
            de <span className="font-semibold text-foreground">{items.length}</span>{" "}
            {items.length === 1 ? nombreSingular : nombrePlural}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => ir(paginaSegura - 1)}
              disabled={paginaSegura <= 1}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 md:flex-none"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </button>
            <span className="shrink-0 px-1 text-sm tabular-nums text-muted-foreground">
              {paginaSegura} de {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => ir(paginaSegura + 1)}
              disabled={paginaSegura >= totalPaginas}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 md:flex-none"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
