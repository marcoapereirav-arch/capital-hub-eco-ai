"use client"

import { useState } from "react"
import { Euro, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { RegistrarVentaModal } from "./registrar-venta-modal"

/**
 * Botón flotante abajo derecha, visible desde cualquier página del OS.
 * Click → abre modal "Registrar venta".
 */
export function RegistrarVentaWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Registrar venta (Ctrl+K, V)"
        className={cn(
          "fixed right-4 z-40 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:bottom-6 md:right-6",
          // El verde y la tinta salen del tema, no de los verdes crudos de
          // Tailwind: si un dia cambia la marca, este boton cambia con ella.
          // La tinta encima del verde NO es capricho: el blanco da 2.11 de
          // contraste y falla; la tinta da 8.31.
          "inline-flex items-center gap-2 rounded-full",
          "bg-primary text-primary-foreground",
          "text-sm font-semibold",
          "min-h-11 px-4 md:px-5",
          "shadow-lg transition-all hover:brightness-110 active:translate-y-px",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        )}
      >
        <ShoppingBag className="h-4 w-4" />
        <span className="hidden sm:inline">Registrar venta</span>
        <Euro className="h-3.5 w-3.5 sm:hidden" />
      </button>

      {open && <RegistrarVentaModal onClose={() => setOpen(false)} />}
    </>
  )
}
