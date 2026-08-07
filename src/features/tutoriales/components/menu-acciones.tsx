"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MoreVertical, Pencil, FolderInput, Trash2, type LucideIcon } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type Props = {
  etiqueta: string
  onRenombrar: () => void
  onMover: () => void
  onBorrar: () => void
}

type Opcion = { texto: string; icono: LucideIcon; accion: () => void; peligro: boolean }

const ANCHO = 176
const ALTO_APROX = 156

/**
 * Renombrar, mover y borrar.
 *
 * Dos presentaciones del MISMO contenido, elegidas con clases y nunca con
 * JavaScript: en telefono una hoja inferior (un desplegable flotante no se
 * acierta con el dedo y se sale por el borde), y en escritorio el menu de
 * siempre, que se pinta FUERA de la tarjeta (en el body) con posicion fija
 * porque la tarjeta recorta lo que se sale.
 */
export function MenuAcciones({ etiqueta, onRenombrar, onMover, onBorrar }: Props) {
  const opciones: Opcion[] = [
    { texto: "Renombrar", icono: Pencil, accion: onRenombrar, peligro: false },
    { texto: "Mover a", icono: FolderInput, accion: onMover, peligro: false },
    { texto: "Borrar", icono: Trash2, accion: onBorrar, peligro: true },
  ]

  return (
    <>
      <div className="md:hidden">
        <MenuHoja etiqueta={etiqueta} opciones={opciones} />
      </div>
      <div className="hidden md:block">
        <MenuFlotante etiqueta={etiqueta} opciones={opciones} />
      </div>
    </>
  )
}

function MenuHoja({ etiqueta, opciones }: { etiqueta: string; opciones: Opcion[] }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setAbierto(true)
        }}
        // El menu no puede heredar el doble clic de la tarjeta: si no, abrir el
        // menu abriria tambien la carpeta.
        onDoubleClick={(e) => e.stopPropagation()}
        aria-label={`Opciones de ${etiqueta}`}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-muted"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent side="bottom" aria-describedby={undefined} className="rounded-t-xl">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
          <SheetHeader>
            <SheetTitle className="text-[17px] font-semibold">Opciones</SheetTitle>
          </SheetHeader>
          <div className="pb-safe-4">
            {opciones.map(({ texto, icono: Icono, accion, peligro }) => (
              <button
                key={texto}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setAbierto(false)
                  accion()
                }}
                className={cn(
                  "flex h-12 w-full items-center gap-3 px-4 text-left text-[15px] transition-colors active:bg-muted",
                  peligro ? "text-destructive" : "text-foreground",
                )}
              >
                <Icono className="h-4 w-4 shrink-0" />
                {texto}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MenuFlotante({ etiqueta, opciones }: { etiqueta: string; opciones: Opcion[] }) {
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

  return (
    <>
      <button
        ref={boton}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setAbierto((v) => !v)
        }}
        onDoubleClick={(e) => e.stopPropagation()}
        aria-label={`Opciones de ${etiqueta}`}
        aria-expanded={abierto}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {abierto && sitio
        ? createPortal(
            <div
              ref={menu}
              style={{ position: "fixed", top: sitio.top, left: sitio.left, width: ANCHO }}
              className="z-[60] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
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
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                    peligro
                      ? "text-destructive hover:bg-destructive/10"
                      : "text-foreground hover:bg-muted",
                  )}
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
