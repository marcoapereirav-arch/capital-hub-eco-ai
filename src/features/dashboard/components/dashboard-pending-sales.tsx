"use client"

import { ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { MS_DIA, plural } from "../lib/dashboard-lecturas"

export type VentaPorCompletar = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  products: string[] | null
  sale_pending_since: string | null
}

/**
 * VENTAS POR COMPLETAR. Solo se dibuja si hay alguna: cuando no hay nada
 * pendiente, el bloque no existe, en vez de una caja vacia diciendo que no hay
 * nada.
 *
 * La novedad es la TIRA DE ANTIGUEDAD: un carril de 60 puntos que se llena con
 * los dias que la venta lleva colgada (tope 14) y pasa a ambar a partir de 7.
 * De un vistazo se ve cual se esta enfriando sin leer ninguna fecha, que es lo
 * que antes no se veia: la fecha iba en texto y ademas se escondia en el
 * telefono.
 *
 * Es el segundo y ultimo ambar permitido en toda la pantalla, y tambien lo
 * decide un dato.
 */
export function DashboardPendingSales({
  ventas,
  onRegistrar,
}: {
  ventas: VentaPorCompletar[]
  onRegistrar: (venta: VentaPorCompletar) => void
}) {
  return (
    <ul className="mt-3 divide-y divide-border pb-2">
      {ventas.map((p) => {
        const dias = p.sale_pending_since
          ? Math.max(0, Math.floor((Date.now() - new Date(p.sale_pending_since).getTime()) / MS_DIA))
          : 0
        const relleno = Math.max(6, Math.min(100, Math.round((dias / 14) * 100)))
        const enfriada = dias > 7
        return (
          <li
            key={p.id}
            className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-3 md:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] text-foreground">{p.full_name ?? p.email}</div>
              <div className="truncate text-sm text-muted-foreground">{p.email}</div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className="relative block h-2 w-[60px] overflow-hidden rounded-lg bg-muted"
                aria-hidden
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 block",
                    enfriada ? "bg-warn" : "bg-primary",
                  )}
                  style={{ width: `${relleno}%` }}
                />
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  enfriada ? "font-semibold text-warn" : "text-muted-foreground",
                )}
              >
                {p.sale_pending_since ? `${dias} ${plural(dias, "día", "días")}` : "sin fecha"}
              </span>
            </div>

            <button
              onClick={() => onRegistrar(p)}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-8 md:w-auto md:text-sm"
            >
              <ShoppingBag className="size-4" /> Registrar venta
            </button>
          </li>
        )
      })}
    </ul>
  )
}
