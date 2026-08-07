"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

export type PuntoIngresos = { date: string; revenue: number }

/**
 * Ingresos de los ultimos 30 dias.
 *
 * Se mide el hueco real con ResizeObserver y se dibuja en pixeles, con el
 * viewBox igual al tamano real. La version anterior usaba un lienzo fijo de
 * 640x220 estirado a lo ancho: en un telefono las etiquetas de los dias se
 * apretaban unas encima de otras y el trazo perdia grosor.
 *
 * Reglas de grafico que cumple: los dos ejes rotulados, el numero del pico
 * siempre escrito (en un telefono no hay raton, no puede haber un dato que solo
 * se vea al pasar por encima) y la etiqueta se fija al tocar.
 */
export function DashboardRevenueChart({
  data,
  formatoEuro,
}: {
  data: PuntoIngresos[]
  formatoEuro: (n: number) => string
}) {
  const caja = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(0)
  const [activo, setActivo] = useState<number | null>(null)

  useEffect(() => {
    const el = caja.current
    if (!el) return
    setAncho(Math.round(el.getBoundingClientRect().width))
    const observador = new ResizeObserver((entradas) => {
      for (const e of entradas) setAncho(Math.round(e.contentRect.width))
    })
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  // Mientras no se ha medido, se reserva el alto para que la tarjeta no salte.
  if (data.length === 0) {
    return <div ref={caja} className="h-[200px] w-full md:h-[260px]" />
  }

  const esTelefono = ancho > 0 && ancho < 480
  const alto = esTelefono ? 200 : 260
  // Sitio para la marca de euros mas larga. Con la letra a 14 (el suelo del
  // proyecto, y el zoom con los dedos esta desactivado) la etiqueta crece unos
  // 4 puntos y con 62 se salia por la izquierda.
  const padIzq = 68
  const padDer = 12
  const padArriba = 30
  const padAbajo = 46
  const anchoPlot = Math.max(1, ancho - padIzq - padDer)
  const altoPlot = Math.max(1, alto - padArriba - padAbajo)

  const valores = data.map((d) => d.revenue)
  const maximo = Math.max(...valores, 1) * 1.12
  const ultimo = Math.max(1, data.length - 1)
  const x = (i: number) => padIzq + (i / ultimo) * anchoPlot
  const y = (v: number) => padArriba + altoPlot - (v / maximo) * altoPlot
  const trazo = valores
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ")

  const marcas = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maximo * t))
  const cadaCuantas = Math.max(1, Math.ceil(data.length / (esTelefono ? 4 : 7)))

  const indicePico = valores.reduce((mejor, v, i) => (v > valores[mejor] ? i : mejor), 0)
  const hayPico = valores[indicePico] > 0

  const fechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })

  const fechaLarga = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })

  /** Un solo manejador para dedo y raton: pointer cubre los dos. */
  function apuntar(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = e.clientX - rect.left
    const i = Math.round(((rel - padIzq) / anchoPlot) * ultimo)
    setActivo(Math.max(0, Math.min(data.length - 1, i)))
  }

  const izquierdaEtiqueta =
    activo !== null ? Math.min(Math.max(x(activo), 78), Math.max(78, ancho - 78)) : 0

  return (
    <div
      ref={caja}
      // El alto minimo evita que la tarjeta salte entre la primera pasada (aun
      // sin medir) y la segunda (ya con el ancho real del hueco).
      className="relative min-h-[200px] w-full touch-pan-y select-none md:min-h-[260px]"
      onPointerDown={apuntar}
      // Con el dedo, la lectura se ve MIENTRAS se mantiene pulsado y se va al
      // levantar. Antes solo se limpiaba con raton, asi que en el telefono la
      // etiqueta se quedaba encima para siempre. Y el movimiento se atiende
      // solo con raton: `e.buttons > 0` tambien vale 1 con el dedo apoyado, asi
      // que al deslizar para bajar por la pagina la lectura saltaba de dia en
      // dia y secuestraba el gesto.
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") apuntar(e)
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse") setActivo(null)
      }}
      onPointerCancel={() => setActivo(null)}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setActivo(null)
      }}
    >
      {ancho > 0 && (
        <svg
          width={ancho}
          height={alto}
          viewBox={`0 0 ${ancho} ${alto}`}
          className="block w-full"
          role="img"
          aria-label="Ingresos por dia de los ultimos 30 dias"
        >
          {/* Eje vertical rotulado */}
          <text
            x={0}
            y={14}
            className="fill-muted-foreground"
            style={{ fontSize: 14 }}
          >
            Ingresos
          </text>

          {marcas.map((valor, i) => {
            const yy = y(valor)
            return (
              <g key={i}>
                <line
                  x1={padIzq}
                  x2={ancho - padDer}
                  y1={yy}
                  y2={yy}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={padIzq - 8}
                  y={yy + 4}
                  textAnchor="end"
                  className="fill-muted-foreground tabular-nums"
                  style={{ fontSize: 14 }}
                >
                  {valor}
                  {"€"}
                </text>
              </g>
            )
          })}

          <path
            d={`${trazo} L${x(ultimo)} ${y(0)} L${x(0)} ${y(0)} Z`}
            className="fill-primary/10"
          />
          <path
            d={trazo}
            fill="none"
            className="stroke-primary"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* El pico lleva su numero escrito siempre: es el dato que se busca. */}
          {hayPico && (
            <g>
              <circle cx={x(indicePico)} cy={y(valores[indicePico])} r={3.5} className="fill-primary" />
              <text
                x={Math.min(Math.max(x(indicePico), padIzq + 24), ancho - padDer - 24)}
                y={Math.max(14, y(valores[indicePico]) - 10)}
                textAnchor="middle"
                className="fill-foreground tabular-nums"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                {formatoEuro(valores[indicePico])}
              </text>
            </g>
          )}

          {data.map((d, i) =>
            i % cadaCuantas === 0 ? (
              <text
                key={d.date}
                x={x(i)}
                y={alto - padAbajo + 20}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 14 }}
              >
                {fechaCorta(d.date)}
              </text>
            ) : null,
          )}

          {/* Eje horizontal rotulado */}
          <text
            x={ancho - padDer}
            y={alto - 6}
            textAnchor="end"
            className="fill-muted-foreground"
            style={{ fontSize: 14 }}
          >
            Dia
          </text>

          {activo !== null && data[activo] && (
            <g>
              <line
                x1={x(activo)}
                x2={x(activo)}
                y1={padArriba}
                y2={padArriba + altoPlot}
                className="stroke-primary/60"
                strokeWidth={1}
              />
              <circle
                cx={x(activo)}
                cy={y(data[activo].revenue)}
                r={5}
                className="fill-primary stroke-background"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      )}

      {activo !== null && data[activo] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2"
          style={{ left: izquierdaEtiqueta }}
        >
          <div className="text-sm font-semibold text-foreground">
            {fechaLarga(data[activo].date)}
          </div>
          <div className="mt-1 flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-primary">
            <span className="h-1.5 w-4 rounded-full bg-primary" />
            Ingresos {formatoEuro(data[activo].revenue)}
          </div>
        </div>
      )}
    </div>
  )
}
