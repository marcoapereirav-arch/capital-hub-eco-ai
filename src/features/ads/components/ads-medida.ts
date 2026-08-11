"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type Caja = { ancho: number; alto: number }

/**
 * Mide el hueco REAL de un contenedor, en pixeles, y lo mantiene al dia.
 *
 * Existe por dos motivos.
 *
 * 1. El brandkit lo exige: un grafico con trazos no se estira con
 *    `preserveAspectRatio="none"`. Al deformar el lienzo distinto en ancho y alto, la linea
 *    sale con los angulos torcidos y los tramos finos se pierden. Se mide y se dibuja a
 *    tamano real.
 *
 * 2. Devuelve tambien el ALTO, y eso es lo que permite que el grafico sea mobile-first de
 *    verdad. El alto se decide en CSS (`h-[176px] md:h-[236px]`), no con un numero clavado
 *    dentro del componente: en el telefono un grafico de 236 puntos se come media pantalla.
 *
 * Es una REF DE FUNCION a proposito, no un `useLayoutEffect` con lista vacia: mientras
 * cargan los datos el grafico devuelve `null`, asi que en el primer pintado el hueco no
 * existe todavia. Un efecto de una sola pasada mediria cero y no volveria a mirar nunca:
 * el grafico se quedaria en blanco para siempre. La ref se dispara justo cuando el hueco
 * aparece. Esta contado en la skill del brandkit, seccion 8 bis.
 */
export function useCaja(): [(n: HTMLElement | null) => void, Caja] {
  const [caja, setCaja] = useState<Caja>({ ancho: 0, alto: 0 })
  const observador = useRef<ResizeObserver | null>(null)

  const ref = useCallback((n: HTMLElement | null) => {
    observador.current?.disconnect()
    observador.current = null
    if (!n) return
    setCaja({ ancho: n.clientWidth, alto: n.clientHeight })
    observador.current = new ResizeObserver((entradas) => {
      const r = entradas[0]?.contentRect
      if (!r) return
      // Solo se guarda si cambia de verdad: `ResizeObserver` avisa tambien de cambios de
      // decimales al hacer zoom, y guardar en cada aviso repinta sin motivo.
      setCaja((antes) =>
        Math.abs(antes.ancho - r.width) < 0.5 && Math.abs(antes.alto - r.height) < 0.5
          ? antes
          : { ancho: r.width, alto: r.height }
      )
    })
    observador.current.observe(n)
  }, [])

  useEffect(() => () => observador.current?.disconnect(), [])

  return [ref, caja]
}
