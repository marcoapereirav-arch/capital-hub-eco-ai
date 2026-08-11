"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { POR_PAGINA } from "@/components/ui/lista-paginada"

/**
 * VER QUIEN HAY DENTRO, EN UNA VENTANA Y DE VEINTE EN VEINTE.
 *
 * Marco, 2026-08-08, y queda como regla por defecto para siempre:
 * *"cuando toco una barra, no quiero que esa vaina se despliegue hacia abajo. Quiero
 * ver un pop-up donde me muestre todos los contactos y recuerda siempre: nunca me
 * muestras mas de veinte contactos. Si hay mas de veinte, se mueve con una flecha en
 * la otra"*.
 *
 * Son DOS reglas, y las dos viven aqui para no volver a discutirlas:
 *
 *  1. NINGUNA LISTA SE DESPLIEGA HACIA ABAJO. Un acordeon empuja la pantalla entera:
 *     tocas una barra y lo que estabas mirando se va de la vista. Una ventana no
 *     mueve nada de sitio, se cierra donde estabas, y en el telefono entra desde
 *     abajo, que es donde alcanza el pulgar.
 *
 *  2. NUNCA MAS DE VEINTE A LA VEZ. Da igual que hoy sean ocho: manana seran
 *     ochocientos. Por eso el tamano de pagina NO es un parametro que un sitio de
 *     llamada pueda subir. Se toma prestado de `lista-paginada.tsx`, que es la misma
 *     regla para las listas EN LINEA: un solo numero en todo el OS, un solo criterio,
 *     y el dia que cambie, cambia en los dos sitios a la vez.
 *
 * Dos detalles que parecen menores y no lo son:
 *
 *  - SE DIBUJA EN EL BODY con un portal. Si se anidara donde se usa, cualquier padre
 *    con `transform`, `filter` o recorte se convierte en el marco de referencia de lo
 *    fijo y la ventana aparece encajada dentro de una tarjeta, medio tapada.
 *  - EL LADO SE DECIDE CON CLASES, nunca con JavaScript. `useIsMobile()` devuelve
 *    falso hasta que monta, asi que preguntarle pinta primero la version de monitor y
 *    luego salta: se ve el brinco. `items-end` + `md:items-center` no brinca.
 */

/** Una fila de la ventana. Dos lineas: quien es, y lo que hace falta saber de el. */
export type FilaLista = {
  id: string
  nombre: string
  detalle: string
}

export function ListaEnVentana({
  titulo,
  subtitulo,
  filas,
  onClose,
}: {
  /** De que es esta lista. Sale arriba, en grande. */
  titulo: string
  /** Segunda linea de la cabecera: el tramo, el filtro, la fecha. */
  subtitulo?: string
  filas: FilaLista[]
  onClose: () => void
}) {
  const [pagina, setPagina] = useState(1)
  /* Los portales solo existen en el navegador. Se pinta despues de montar para que el
     servidor y el navegador dibujen lo mismo y React no se queje. */
  const [montado, setMontado] = useState(false)
  const cajon = useRef<HTMLDivElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    setMontado(true)
  }, [])

  // Escape cierra, como cualquier ventana del sistema.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", alPulsar)
    return () => document.removeEventListener("keydown", alPulsar)
  }, [onClose])

  /* Mientras la ventana esta abierta, la pagina de detras NO se mueve. Sin esto, al
     llegar al final de la lista el dedo sigue empujando y lo que baja es la pantalla
     de atras: parece que la ventana se ha ido sola. Se devuelve como estaba al cerrar,
     que si no la pagina queda congelada para siempre. */
  useEffect(() => {
    const body = document.body
    const antes = body.style.overflow
    body.style.overflow = "hidden"
    return () => {
      body.style.overflow = antes
    }
  }, [])

  const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA))
  /* Se calcula al pintar y NO se guarda: asi nunca se ve una pagina en blanco si la
     lista de fuera se encoge mientras la ventana esta abierta. */
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = (paginaSegura - 1) * POR_PAGINA
  const hasta = Math.min(desde + POR_PAGINA, filas.length)
  const enPantalla = useMemo(
    () => filas.slice(desde, desde + POR_PAGINA),
    [filas, desde]
  )

  function ir(n: number) {
    setPagina(Math.min(Math.max(1, n), totalPaginas))
    // Vuelve arriba: cambiar de pagina y seguir a mitad de lista despista.
    cajon.current?.scrollTo({ top: 0 })
  }

  const hayVarias = totalPaginas > 1

  if (!montado) return null

  return createPortal(
    <div
      /* Tocar el fondo cierra. Se mira que el toque haya empezado y terminado EN el
         fondo: si no, arrastrar para seleccionar texto dentro de la lista y soltar
         fuera cerraria la ventana sin querer. */
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-end justify-center overscroll-none bg-black/70 p-0 md:items-center md:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        /* `min-w-0` es obligatorio: esto es un hijo flexible, y un hijo flexible nace
           con `min-width: auto`, o sea que su ancho minimo es el de su contenido y no
           encoge por debajo. Un nombre largo sin espacios bastaria para empujar la
           ventana mas alla del borde de la pantalla. */
        className="flex max-h-[85dvh] w-full min-w-0 flex-col rounded-t-xl border border-border bg-popover md:max-w-md md:rounded-xl"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
          <div className="min-w-0">
            <h2 id={idTitulo} className="truncate text-base font-semibold text-foreground">
              {titulo}
            </h2>
            {subtitulo && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitulo}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-muted md:size-9 md:hover:bg-muted md:hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {/* `overflow-x-hidden` va escrito a proposito. Regla de CSS que se olvida: en
            cuanto un eje deja de ser `visible`, el otro deja de serlo tambien y pasa a
            `auto` solo. Con `overflow-y-auto` a secas, esta caja se convertiria en un
            carrusel lateral sin que nadie lo pidiera. */}
        <div
          ref={cajon}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          {filas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <h3 className="text-[15px] font-semibold text-foreground">Aquí no hay nadie</h3>
              <p className="max-w-[38ch] text-sm text-muted-foreground">
                En cuanto entre alguien, aparece en esta lista.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {enPantalla.map((f) => (
                <li key={f.id} className="min-w-0 px-4 py-2.5 md:px-5">
                  <div className="truncate text-[15px] text-foreground">{f.nombre}</div>
                  <div className="truncate text-sm text-muted-foreground">{f.detalle}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* El pie dice SIEMPRE cuantos hay: si no, no se sabe si faltan dos o
            doscientos. Las flechas solo se pintan cuando hay a donde ir; con veinte o
            menos no hay nada que paginar y una fila de flechas apagadas solo estorba.
            El hueco de abajo esquiva la barra del iPhone. */}
        {filas.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] md:px-5 md:pb-2.5">
            <p className="min-w-0 text-sm tabular-nums text-muted-foreground">
              {hayVarias ? (
                <>
                  <span className="font-semibold text-foreground">{desde + 1}</span> a{" "}
                  <span className="font-semibold text-foreground">{hasta}</span> de{" "}
                  <span className="font-semibold text-foreground">{filas.length}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{filas.length}</span> en total
                </>
              )}
            </p>

            {hayVarias && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => ir(paginaSegura - 1)}
                  disabled={paginaSegura <= 1}
                  aria-label="Ver los anteriores"
                  className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors active:bg-muted disabled:pointer-events-none disabled:opacity-40 md:hover:bg-muted"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => ir(paginaSegura + 1)}
                  disabled={paginaSegura >= totalPaginas}
                  aria-label="Ver los siguientes"
                  className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors active:bg-muted disabled:pointer-events-none disabled:opacity-40 md:hover:bg-muted"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
