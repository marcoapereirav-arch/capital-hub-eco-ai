"use client"

import { X, ShoppingBag, Clock } from "lucide-react"

/**
 * Popup que salta al mover un contacto a "Alumno" a mano en el CRM.
 * Da a elegir: registrar la venta AHORA (abre el formulario de venta, que da el
 * acceso a la App) o MÁS TARDE (queda como "venta por completar" en el dashboard).
 */
export function SaleStagePrompt({
  contactName,
  onNow,
  onLater,
  onClose,
}: {
  contactName?: string
  onNow: () => void
  onLater: () => void
  onClose: () => void
}) {
  const who = contactName?.trim() || "este contacto"
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-green-500/30 bg-green-500/10">
              <ShoppingBag className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">Pasa a Alumno</h3>
              <p className="text-[13px] text-muted-foreground">Registra la venta de {who}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Para darle el acceso a la App necesitamos los datos de la venta (producto, cifras, quién
          cerró). ¿Los rellenas ahora o lo dejas para más tarde?
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onNow}
            className="flex w-full items-center gap-3 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-left transition-colors hover:bg-green-500/20"
          >
            <ShoppingBag className="h-5 w-5 shrink-0 text-green-400" />
            <span>
              <span className="block text-sm font-semibold text-foreground">Rellenar ahora</span>
              <span className="block text-[12px] text-muted-foreground">Abre el formulario y le doy el acceso</span>
            </span>
          </button>

          <button
            onClick={onLater}
            className="flex w-full items-center gap-3 rounded-md border border-border bg-secondary/40 px-4 py-3 text-left transition-colors hover:bg-secondary/70"
          >
            <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span>
              <span className="block text-sm font-semibold text-foreground">Más tarde</span>
              <span className="block text-[12px] text-muted-foreground">Lo muevo a Alumno y queda en «Ventas por completar»</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
