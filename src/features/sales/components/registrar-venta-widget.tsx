"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Euro, ShoppingBag, ClipboardList, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { RegistrarVentaModal } from "./registrar-venta-modal"
import { ParteDiarioModal } from "@/features/setter/components/parte-diario-modal"

/**
 * El boton flotante del OS.
 *
 * Marco, 2026-08-07: "haz un widget en donde yo le toque y me aparezca
 * 'Registrar venta' o me aparezca 'Parte del dia'".
 *
 * Cada quien ve solo lo que le toca, segun su rol:
 *   super_admin  ->  las dos
 *   closer       ->  Registrar venta
 *   setter       ->  Parte del dia
 *   los demas    ->  no ve el boton (antes lo veia todo el mundo)
 *
 * Si a alguien le queda UNA sola opcion, el boton la abre directo: no se obliga
 * a dar dos toques para nada.
 */

type Accion = "venta" | "parte"

const ETIQUETA: Record<Accion, string> = {
  venta: "Registrar venta",
  parte: "Registrar actividad",
}

export function RegistrarVentaWidget({ rol }: { rol: string | null }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [abierto, setAbierto] = useState<Accion | null>(null)
  const caja = useRef<HTMLDivElement>(null)

  /* El rol llega del servidor, que ya lo sabe. Nada de preguntarlo por su
     cuenta: seria una llamada mas en cada pantalla para un dato que ya esta. */
  const acciones = useMemo<Accion[]>(() => {
    if (rol === "super_admin") return ["venta", "parte"]
    if (rol === "closer") return ["venta"]
    if (rol === "setter") return ["parte"]
    return []
  }, [rol])

  // Cerrar el menu al tocar fuera o con Escape.
  useEffect(() => {
    if (!menuAbierto) return
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setMenuAbierto(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAbierto(false)
    }
    document.addEventListener("mousedown", fuera)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", fuera)
      document.removeEventListener("keydown", esc)
    }
  }, [menuAbierto])

  if (acciones.length === 0) return null

  const unaSola = acciones.length === 1

  return (
    <>
      <div
        ref={caja}
/* La altura se pone AQUI, no en una clase.
            Motivo medido en el navegador el 2026-08-08: las variables de zona
            segura (`--sab`) llegan VACIAS, asi que `calc(... + var(--sab) + ...)`
            es invalido, el navegador tira la regla entera y este boton "fijo
            abajo" acababa pegado ARRIBA del todo y tapado por otra cosa: no se
            podia pulsar en el telefono. Con `env()` directo no hay variable que
            pueda faltar. */
        style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)" }}
        className="fixed right-4 z-40 md:!bottom-6 md:right-6"
      >
        {/* El menu, encima del boton. Se sale hacia arriba para no meterse
            debajo de la barra de abajo del telefono. */}
        {menuAbierto && !unaSola && (
          <div className="absolute bottom-full right-0 mb-2 w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            {acciones.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setMenuAbierto(false)
                  setAbierto(a)
                }}
                className="flex min-h-12 w-full items-center gap-2.5 px-4 text-left text-[15px] text-foreground active:bg-muted md:min-h-11"
              >
                {a === "venta" ? (
                  <ShoppingBag className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
                )}
                {ETIQUETA[a]}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => (unaSola ? setAbierto(acciones[0]) : setMenuAbierto((v) => !v))}
          aria-haspopup={unaSola ? undefined : "menu"}
          aria-expanded={unaSola ? undefined : menuAbierto}
          title={unaSola ? ETIQUETA[acciones[0]] : "Registrar venta o actividad"}
          className={cn(
            // El verde y la tinta salen del tema, no de los verdes crudos de
            // Tailwind: si un dia cambia la marca, este boton cambia con ella.
            // La tinta encima del verde NO es capricho: el blanco da 2.11 de
            // contraste y falla; la tinta da 8.31.
            "inline-flex items-center gap-2 rounded-full",
            "bg-primary text-primary-foreground",
            "text-sm font-semibold",
            "min-h-11 px-4 md:px-5",
            "shadow-lg transition-all hover:brightness-110 active:translate-y-px",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          {unaSola ? (
            <>
              {acciones[0] === "venta" ? <ShoppingBag className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
              <span className="hidden sm:inline">{ETIQUETA[acciones[0]]}</span>
              {acciones[0] === "venta" ? (
                <Euro className="h-3.5 w-3.5 sm:hidden" />
              ) : (
                <span className="sr-only">{ETIQUETA[acciones[0]]}</span>
              )}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Registrar</span>
            </>
          )}
        </button>
      </div>

      {abierto === "venta" && <RegistrarVentaModal onClose={() => setAbierto(null)} />}
      {abierto === "parte" && <ParteDiarioModal onClose={() => setAbierto(null)} />}
    </>
  )
}
