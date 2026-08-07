"use client"

import { useState } from "react"

export type PasoEmbudo = {
  stage: string
  label: string
  count: number
  conversionFromPrev: number | null
}

export type SalidaEmbudo = {
  stage: string
  label: string
  count: number
}

/**
 * Embudo del pipeline activo, dibujado con barras HORIZONTALES.
 *
 * Antes era un cono de bloques rellenos con el color crudo de cada etapa
 * (naranja, azul, cyan) y un degradado encima. Dos problemas: el acento de la
 * marca es el verde y nada mas, y en 375 puntos el nombre de la etapa vivia en
 * una columna fija de 128 puntos que lo cortaba a la mitad.
 *
 * Con barras horizontales el nombre va a la izquierda con todo el ancho que
 * necesita y la barra crece a la derecha. El color que el usuario eligio para
 * su etapa sigue a la vista, pero como punto de identificacion (que es lo que
 * significa) y no como relleno de medio grafico.
 *
 * El numero va SIEMPRE escrito al final de la barra: en un telefono no hay
 * raton, asi que un dato que solo se vea al pasar por encima no existe. Al
 * tocar una fila se fija la lectura larga debajo.
 */
export function DashboardFunnel({
  main,
  branches,
  colorOf,
}: {
  main: PasoEmbudo[]
  branches: SalidaEmbudo[]
  colorOf: (stage: string) => string
}) {
  const [fijada, setFijada] = useState<string | null>(null)
  const max = Math.max(...main.map((s) => s.count), 1)

  if (main.length === 0) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-5 py-8 text-center">
        <p className="text-[15px] text-muted-foreground">Sin stages en este funnel.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-5 md:px-5">
      {/* Los dos ejes rotulados: a la izquierda que es cada fila, a la derecha
          que mide la barra. Sin esto el grafico obliga a adivinar. */}
      <div className="flex items-baseline justify-between gap-2 pb-2 text-sm text-muted-foreground">
        <span>Etapa</span>
        <span>Contactos</span>
      </div>

      <ul className="space-y-3">
        {main.map((s) => {
          const color = colorOf(s.stage)
          const ancho = Math.max(2, Math.round((s.count / max) * 100))
          const abierta = fijada === s.stage
          return (
            <li key={s.stage}>
              <button
                type="button"
                onClick={() => setFijada(abierta ? null : s.stage)}
                className="block w-full min-h-11 text-left"
                aria-expanded={abierta}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
                    {s.label}
                  </span>
                  <span className="shrink-0 text-[15px] font-semibold tabular-nums text-foreground">
                    {s.count}
                  </span>
                  {s.conversionFromPrev !== null && (
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {s.conversionFromPrev}%
                    </span>
                  )}
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-lg bg-muted">
                  <div
                    className="funnel-in h-full rounded-lg bg-primary"
                    style={{ width: `${ancho}%` }}
                  />
                </div>
              </button>
              {abierta && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {s.label}: {s.count} contactos
                  {s.conversionFromPrev !== null
                    ? ` · ${s.conversionFromPrev}% de la etapa anterior`
                    : ""}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      {branches.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Salidas del embudo</p>
          <div className="grid grid-cols-2 gap-2">
            {branches.map((b) => (
              <div key={b.stage} className="rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorOf(b.stage) }}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate text-sm text-muted-foreground">
                    {b.label}
                  </span>
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {b.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
