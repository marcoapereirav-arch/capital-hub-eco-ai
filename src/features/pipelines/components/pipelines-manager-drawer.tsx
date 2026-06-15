"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { PipelinesPage } from "./pipelines-page"

/**
 * Drawer overlay que muestra el gestor de pipelines DENTRO del entorno actual
 * (no se navega a otra pagina). Cerrar con ESC o click fuera.
 *
 * Por que un drawer y no una pagina:
 *   El usuario configura pipelines en el contexto del CRM (kanban o lista),
 *   sin perder de vista los contactos. Configurar y volver = 1 click.
 */
export function PipelinesManagerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <button
        onClick={onClose}
        className="flex-1 bg-black/60 backdrop-blur-[2px]"
        aria-label="Cerrar gestor de pipelines"
      />
      {/* Panel */}
      <div className="w-full max-w-4xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Gestor de Pipelines</h2>
            <p className="text-[11px] text-muted-foreground">Crea, edita y reordena pipelines y sus stages.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 md:p-6">
          <PipelinesPage hideHeader />
        </div>
      </div>
    </div>
  )
}
