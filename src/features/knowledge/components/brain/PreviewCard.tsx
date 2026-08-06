'use client'

import { useEffect, useRef } from 'react'

export interface PreviewState {
  slug: string
  title: string
  description: string | null
  /** Coordenadas del tap original. La card se sitúa cerca pero clamped al viewport. */
  x: number
  y: number
}

/**
 * Card flotante que muestra el nombre completo + descripción de un doc al
 * hacer tap único sobre su nodo del 3D (o hover prolongado). el usuario la usa
 * para verificar qué documento es ANTES de entrar y evitar abrir el
 * incorrecto (un tap más = abrir, click fuera = cerrar).
 */
export function PreviewCard({
  state,
  onOpen,
  onClose,
}: {
  state: PreviewState | null
  onOpen: (slug: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    // Delay para no atrapar el mismo tap que abrió la card.
    const t = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocClick)
      document.addEventListener('touchstart', onDocClick as unknown as EventListener)
    }, 0)
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick as unknown as EventListener)
      document.removeEventListener('keydown', onKey)
    }
  }, [state, onClose])

  if (!state) return null

  // Posicionado relativo al tap pero clamped al viewport. Offset 16px arriba/derecha
  // para no taparlo con el cursor o el dedo. El ancho se mide con el hueco REAL de la
  // ventana: en un telefono de 375 puntos, 320 clavados se salian por el borde.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const W = Math.min(320, vw - 32)
  const H = 200 // alto aproximado, suficiente para evitar overflow vertical
  const left = Math.min(Math.max(state.x + 16, 16), Math.max(16, vw - W - 16))
  const top = Math.min(Math.max(state.y - H - 16, 16), Math.max(16, vh - H - 16))

  return (
    <div
      ref={ref}
      className="fixed z-[90] rounded-lg border border-primary/35 bg-popover p-4 shadow-lg"
      style={{ left, top, width: W }}
      role="dialog"
      aria-label="Previsualización del documento"
    >
      <p className="mb-1.5 text-sm font-semibold text-primary">Documento</p>
      <h3 className="mb-2 text-base leading-snug font-semibold text-foreground">{state.title}</h3>
      {state.description && (
        <p className="mb-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          {state.description}
        </p>
      )}
      <div className="flex gap-1.5">
        <button
          onClick={() => {
            onOpen(state.slug)
            onClose()
          }}
          className="h-11 flex-1 rounded-lg border border-primary/40 bg-primary/15 px-3 text-[15px] font-semibold text-primary transition-colors md:h-9"
        >
          Abrir documento
        </button>
        <button
          onClick={onClose}
          className="h-11 shrink-0 rounded-lg border border-border px-3 text-[15px] text-muted-foreground transition-colors md:h-9"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
