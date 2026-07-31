"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MoreVertical, Pencil, FolderInput, Trash2 } from "lucide-react"

type Props = {
  etiqueta: string
  onRenombrar: () => void
  onMover: () => void
  onBorrar: () => void
}

const ANCHO = 176
const ALTO_APROX = 132

/**
 * Renombrar, mover y borrar.
 *
 * El menu se pinta FUERA de la tarjeta (en el body) y con posicion fija.
 * Antes colgaba dentro de la tarjeta, y como la tarjeta recorta lo que se sale
 * (`overflow-hidden`, necesario para que la portada respete las esquinas), el
 * menu salia cortado. Sacarlo del recorte es la unica forma de que se vea
 * entero sin renunciar a las esquinas redondeadas.
 */
export function MenuAcciones({ etiqueta, onRenombrar, onMover, onBorrar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [sitio, setSitio] = useState<{ top: number; left: number } | null>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!abierto || !boton.current) return

    const colocar = () => {
      const r = boton.current!.getBoundingClientRect()
      // Se abre hacia abajo salvo que no quepa: entonces hacia arriba. Y nunca
      // se sale por la derecha en pantallas estrechas.
      const cabeDebajo = window.innerHeight - r.bottom > ALTO_APROX + 8
      setSitio({
        top: cabeDebajo ? r.bottom + 6 : r.top - ALTO_APROX - 6,
        left: Math.max(8, Math.min(r.right - ANCHO, window.innerWidth - ANCHO - 8)),
      })
    }

    colocar()
    // Si se desplaza la pagina, el menu se cierra en vez de quedarse flotando
    // lejos del boton al que pertenece.
    const cerrar = () => setAbierto(false)
    window.addEventListener("scroll", cerrar, true)
    window.addEventListener("resize", colocar)
    return () => {
      window.removeEventListener("scroll", cerrar, true)
      window.removeEventListener("resize", colocar)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node
      if (!boton.current?.contains(t) && !menu.current?.contains(t)) setAbierto(false)
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
    <>
      <button
        ref={boton}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setAbierto((v) => !v)
        }}
        // El menu no puede heredar el doble clic de la tarjeta: si no, abrir el
        // menu abriria tambien la carpeta.
        onDoubleClick={(e) => e.stopPropagation()}
        aria-label={`Opciones de ${etiqueta}`}
        aria-expanded={abierto}
        className="shrink-0 rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {abierto && sitio
        ? createPortal(
            <div
              ref={menu}
              style={{ position: "fixed", top: sitio.top, left: sitio.left, width: ANCHO }}
              className="z-[60] overflow-hidden rounded-lg border border-[#2A2D34] bg-[#15161A] py-1 shadow-xl"
            >
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
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
