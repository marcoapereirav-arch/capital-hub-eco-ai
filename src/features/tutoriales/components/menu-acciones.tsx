"use client"

import { useEffect, useRef, useState } from "react"
import { MoreVertical, Pencil, FolderInput, Trash2 } from "lucide-react"

type Props = {
  etiqueta: string
  onRenombrar: () => void
  onMover: () => void
  onBorrar: () => void
}

/** Renombrar, mover y borrar. Lo que uno espera de un Drive. */
export function MenuAcciones({ etiqueta, onRenombrar, onMover, onBorrar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    const escapar = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false)
    document.addEventListener("mousedown", fuera)
    window.addEventListener("keydown", escapar)
    return () => {
      document.removeEventListener("mousedown", fuera)
      window.removeEventListener("keydown", escapar)
    }
  }, [abierto])

  const opciones = [
    { texto: "Renombrar", icono: Pencil, accion: onRenombrar, peligro: false },
    { texto: "Mover a", icono: FolderInput, accion: onMover, peligro: false },
    { texto: "Borrar", icono: Trash2, accion: onBorrar, peligro: true },
  ]

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setAbierto((v) => !v)
        }}
        aria-label={`Opciones de ${etiqueta}`}
        aria-expanded={abierto}
        // Siempre visible, no solo al pasar el raton: en el movil no hay raton.
        className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {abierto ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-[#2A2D34] bg-[#15161A] py-1 shadow-xl">
          {opciones.map(({ texto, icono: Icono, accion, peligro }) => (
            <button
              key={texto}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setAbierto(false)
                accion()
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition ${
                peligro ? "text-red-400 hover:bg-red-500/10" : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icono className="h-3.5 w-3.5 shrink-0" />
              {texto}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
