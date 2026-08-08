"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * COMO VA EL MES. El unico grafico de tiempo del panel.
 *
 * Antes habia cuatro graficos de dias distintos (llamadas, contactos, agendas y
 * "que paso cada dia"), cada uno con su forma. Marco, 2026-08-08: "no entiendo
 * ninguno de los graficos". Ahora es UNO, y contesta la unica pregunta que
 * importa mirando el tiempo: entra gente, se agenda, se cierra.
 *
 * Las decisiones que lo hacen legible sin leer nada:
 *
 *  1. EL NUMERO VA ESCRITO ENCIMA DE CADA BARRA. Siempre, sin pasar el raton.
 *     En un telefono no hay raton: un dato que solo aparece al pasar por encima
 *     no existe.
 *  2. UNA SERIE A LA VEZ, elegida con botones grandes. Tres series superpuestas
 *     en 375 puntos es una maraña; una sola se lee de un vistazo.
 *  3. EL DIA MAS ALTO MARCADO dentro del dibujo, no explicado aparte.
 *  4. UN DIA A CERO DEJA SU MARCA en el suelo: asi se ve que ese dia no hubo
 *     nada, en vez de parecer que falta el dibujo.
 */

export type FilaTramo = {
  id: string
  nombre: string
  /** Segunda linea: de donde vino, en que etapa esta, cuando fue. */
  detalle: string
}

export type Serie = {
  clave: string
  nombre: string
  /** Un valor por tramo, en el mismo orden que `tramos`. */
  valores: number[]
  /** Quien hay DENTRO de cada tramo. Al tocar la barra se abre esta lista. */
  filas: FilaTramo[][]
}

export function DashboardComoVa({
  tramos,
  series,
  cargando,
}: {
  /** Etiqueta corta ("4 ago") y larga ("lunes 4 de agosto") de cada tramo. */
  tramos: { clave: string; corta: string; larga: string }[]
  series: Serie[]
  cargando: boolean
}) {
  const [activa, setActiva] = useState(series[0]?.clave ?? "")
  /* Que barra esta abierta. Marco, 2026-08-08: "si le pincho ahi, quiero ver los
     21 contactos". Un numero sin poder abrirlo obliga a irse a otra pantalla a
     buscar quien hay detras. */
  const [abierta, setAbierta] = useState<number | null>(null)
  const serie = series.find((s) => s.clave === activa) ?? series[0]

  if (cargando) return <div className="h-[300px]" />

  if (!serie || tramos.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay movimiento</h3>
        <p className="max-w-[38ch] text-[15px] text-muted-foreground">
          Cuando entre gente o se agende una llamada, aquí se ve día a día.
        </p>
      </div>
    )
  }

  const max = Math.max(...serie.valores, 1)
  const indiceMax = serie.valores.indexOf(Math.max(...serie.valores))
  const total = serie.valores.reduce((a, b) => a + b, 0)

  return (
    <div className="px-4 pb-5 pt-2 md:px-5">
      {/* Elegir que se mira. Botones de 44px, no un selector diminuto. */}
      <div className="flex flex-wrap gap-2">
        {series.map((s) => {
          const suma = s.valores.reduce((a, b) => a + b, 0)
          const esActiva = s.clave === activa
          return (
            <button
              key={s.clave}
              type="button"
              onClick={() => {
                setActiva(s.clave)
                setAbierta(null)
              }}
              className={cn(
                "h-11 rounded-lg border px-3 text-[15px] transition-colors md:h-9 md:text-sm",
                esActiva
                  ? "border-brand bg-brand text-brand-ink font-semibold"
                  : "border-border text-muted-foreground",
              )}
            >
              {s.nombre} <span className="tabular-nums">{suma}</span>
            </button>
          )
        })}
      </div>

      {/* El dibujo. Alto fijo, una columna por tramo, numero encima. */}
      <div className="mt-5 flex h-44 items-end gap-1.5">
        {tramos.map((t, i) => {
          const valor = serie.valores[i] ?? 0
          const alto = Math.round((valor / max) * 100)
          const esMax = i === indiceMax && valor > 0
          return (
            <button
              key={t.clave}
              type="button"
              disabled={valor === 0}
              onClick={() => setAbierta(abierta === i ? null : i)}
              className="flex h-full min-w-0 flex-1 flex-col justify-end disabled:cursor-default"
              aria-label={`${t.larga}: ${valor} ${serie.nombre.toLowerCase()}`}
              aria-expanded={abierta === i}
              title={valor === 0 ? `${t.larga}: nada` : `${t.larga}: ${valor}. Toca para ver quién`}
            >
              {/* El numero, SIEMPRE escrito. */}
              <div
                className={cn(
                  "mb-1 text-center text-sm font-semibold tabular-nums",
                  valor === 0 ? "text-muted-foreground" : abierta === i || esMax ? "text-brand" : "text-foreground",
                )}
              >
                {valor}
              </div>
              <div
                className={cn(
                  "w-full rounded-t-lg transition-[height,background-color] duration-500 ease-out",
                  valor === 0
                    ? "bg-muted"
                    : abierta === i
                      ? "bg-brand ring-2 ring-brand/40"
                      : esMax
                        ? "bg-brand"
                        : "bg-brand/45 hover:bg-brand/70",
                )}
                style={{ height: valor === 0 ? "3px" : `${Math.max(4, alto)}%` }}
              />
            </button>
          )
        })}
      </div>

      {/* El eje de abajo. Solo tres marcas: si se escriben las 14, no se lee ninguna. */}
      <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2 text-sm text-muted-foreground">
        <span>{tramos[0]?.corta}</span>
        {tramos.length > 2 && <span>{tramos[Math.floor(tramos.length / 2)]?.corta}</span>}
        <span>{tramos[tramos.length - 1]?.corta}</span>
      </div>

      {/* QUIEN HAY DENTRO de la barra que se ha tocado. */}
      {abierta !== null && (serie.filas[abierta]?.length ?? 0) > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <span className="text-[15px] font-semibold text-foreground">
              {tramos[abierta]?.larga}
              <span className="ml-1.5 font-normal text-muted-foreground">
                {serie.valores[abierta]} {serie.nombre.toLowerCase()}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setAbierta(null)}
              className="h-11 rounded-lg px-2 text-sm text-muted-foreground md:h-8"
            >
              Cerrar
            </button>
          </div>
          <ul className="divide-y divide-border">
            {serie.filas[abierta].slice(0, 20).map((f) => (
              <li key={f.id} className="px-3 py-2.5">
                <div className="truncate text-[15px] text-foreground">{f.nombre}</div>
                <div className="truncate text-sm text-muted-foreground">{f.detalle}</div>
              </li>
            ))}
          </ul>
          {serie.filas[abierta].length > 20 && (
            <p className="border-t border-border px-3 py-2.5 text-sm text-muted-foreground">
              y {serie.filas[abierta].length - 20} más
            </p>
          )}
        </div>
      )}

      {/* Lo unico escrito: el total y el dia mas alto, que es lo que se busca. */}
      <p className="mt-2 text-sm text-muted-foreground">
        {total} en total
        {indiceMax >= 0 && serie.valores[indiceMax] > 0
          ? ` · el día más alto fue ${tramos[indiceMax]?.larga} con ${serie.valores[indiceMax]}`
          : ""}
        {total > 0 ? " · toca una barra para ver quién hay dentro" : ""}
      </p>
    </div>
  )
}
