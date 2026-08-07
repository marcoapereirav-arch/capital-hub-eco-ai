"use client"

import { createPortal } from "react-dom"
import { X, ShoppingBag, Clock } from "lucide-react"

/**
 * Pinta la ventana en el `body`, nunca anidada donde vive el boton que la abre.
 *
 * Por que: este aviso se lanza desde la ficha del contacto, que es una hoja lateral
 * con desenfoque. Por norma de CSS, un padre con desenfoque o `transform` pasa a ser
 * el marco de referencia de todo lo que es `fixed`, asi que la ventana dejaba de
 * cubrir la pantalla: se encogia, se descolocaba y se solapaba con la ficha.
 */
function enElBody(nodo: React.ReactNode) {
  if (typeof document === "undefined") return null
  return createPortal(nodo, document.body)
}

/**
 * Popup que salta al mover un contacto a "Alumno" a mano en el CRM.
 * Da a elegir: registrar la venta AHORA (abre el formulario de venta, que da el
 * acceso a la App) o MÁS TARDE (queda como "venta por completar" en el dashboard).
 *
 * En telefono es una hoja inferior corta: cabecera fija con la salida siempre a la
 * vista, un solo sitio que se desplaza, y las dos opciones abajo con sitio para la
 * franja de gestos. En monitor, ventana centrada.
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
  return enElBody(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-stage-prompt-titulo"
        onClick={(e) => e.stopPropagation()}
        // El alto deja fuera la zona del reloj: con `vh` la cabecera se metia debajo
        // del reloj del iPhone y la X no se podia tocar.
        className="flex max-h-[calc(100dvh-var(--sat)-2rem)] w-full min-h-0 max-w-md flex-col overflow-hidden rounded-t-xl border border-border bg-background md:max-h-[85dvh] md:rounded-xl"
      >
        {/* Cabecera fija, con la salida SIEMPRE a la vista y a 44 puntos. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
              <ShoppingBag className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2
                id="sale-stage-prompt-titulo"
                className="truncate text-base font-extrabold text-foreground"
              >
                Pasa a Alumno
              </h2>
              <p className="truncate text-sm text-muted-foreground">Registra la venta de {who}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="tap-target -mr-2 inline-flex shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-secondary active:text-foreground"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* UN solo sitio que se desplaza. */}
        <div className="no-overscroll min-h-0 flex-1 overflow-y-auto p-4">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Para darle el acceso a la App necesitamos los datos de la venta (producto, cifras, quién
            cerró). ¿Los rellenas ahora o lo dejas para más tarde?
          </p>
        </div>

        {/* Pie fijo, con sitio para la franja de gestos del telefono. */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-background p-3 pb-[calc(0.75rem+var(--sab))] md:pb-3">
          <button
            type="button"
            onClick={onNow}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg bg-primary px-4 py-3 text-left transition-opacity active:opacity-90"
          >
            <ShoppingBag className="h-5 w-5 shrink-0 text-primary-foreground" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-primary-foreground">
                Rellenar ahora
              </span>
              <span className="block text-sm text-primary-foreground">
                Abre el formulario y le doy el acceso
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onLater}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors active:bg-secondary"
          >
            <Clock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-foreground">Más tarde</span>
              <span className="block text-sm text-muted-foreground">
                Lo muevo a Alumno y queda en «Ventas por completar»
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
