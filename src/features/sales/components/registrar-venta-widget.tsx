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
          "inline-flex items-center gap-2 rounded-full",
          "bg-gradient-to-br from-green-500 to-green-600",
          "text-black font-mono uppercase tracking-wider text-xs font-bold",
          "px-4 py-3 md:px-5 md:py-3.5",
          "shadow-lg hover:shadow-xl hover:scale-105 transition-all",
          "border-2 border-green-400/50"
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
