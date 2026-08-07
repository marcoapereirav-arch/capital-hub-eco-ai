"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Los gráficos del panel de Campañas.
 *
 * Reglas que cumplen (brandkit + os-movil-primero):
 *   - El número va SIEMPRE escrito, no escondido tras el cursor. En un teléfono no hay
 *     cursor, así que un dato que solo aparece al pasar el ratón no existe.
 *   - Barras horizontales en el embudo: en 375px las etiquetas de un eje inferior no caben.
 *   - Los dos ejes rotulados y título sin jerga.
 *   - Todo por tokens del tema. Ni un color escrito a mano.
 */

const fmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 })
const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 })

function eur(n: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

/* ───────────────────────── embudo ───────────────────────── */

export type PasoEmbudo = { nombre: string; valor: number; explica: string }

/**
 * Embudo en barras horizontales. Cada paso lleva su número dentro y, entre uno y el
 * siguiente, el porcentaje que se queda por el camino. Esa caída es el dato que dice dónde
 * se atasca el dinero, así que va escrita, no deducida.
 */
export function Embudo({ pasos }: { pasos: PasoEmbudo[] }) {
  const tope = Math.max(...pasos.map((p) => p.valor), 1)

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <h3 className="text-[17px] font-semibold text-foreground">De la impresión al lead</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Cuánta gente pasa de un paso al siguiente. El porcentaje es lo que se queda por el
        camino.
      </p>

      <ul className="mt-4 space-y-3">
        {pasos.map((p, i) => {
          const anterior = i > 0 ? pasos[i - 1].valor : null
          const pasan = anterior && anterior > 0 ? (p.valor / anterior) * 100 : null
          const ancho = Math.max((p.valor / tope) * 100, p.valor > 0 ? 6 : 0)

          return (
            <li key={p.nombre}>
              {/* Un paso puede salir por encima del 100%: los pasos no cuentan lo mismo.
                  "Salieron" cuenta PERSONAS distintas y "cargaron la página" cuenta VISITAS,
                  así que una persona que entra dos veces suma dos visitas. Decir entonces
                  "se pierden -16%" es un sinsentido, así que se dice lo que de verdad pasa. */}
              {pasan !== null && (
                <p className="mb-1.5 pl-1 text-sm text-muted-foreground">
                  {pasan > 100 ? (
                    <>
                      salen{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {fmtDec.format(pasan - 100)}%
                      </span>{" "}
                      más que en el paso anterior, porque aquí se cuentan visitas y arriba
                      personas: quien vuelve a entrar suma otra vez
                    </>
                  ) : (
                    <>
                      pasan{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {fmtDec.format(pasan)}%
                      </span>
                      , se pierden{" "}
                      <span className="tabular-nums">{fmtDec.format(100 - pasan)}%</span>
                    </>
                  )}
                </p>
              )}

              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-[15px] font-medium text-foreground">{p.nombre}</span>
                <span className="text-[17px] font-semibold text-foreground tabular-nums">
                  {fmt.format(p.valor)}
                </span>
              </div>

              <div
                className="mt-1.5 h-8 w-full overflow-hidden rounded-lg bg-muted"
                role="img"
                aria-label={`${p.nombre}: ${fmt.format(p.valor)}`}
              >
                <div
                  className="h-full rounded-lg bg-brand transition-[width] duration-500"
                  style={{ width: `${ancho}%` }}
                />
              </div>

              <p className="mt-1 text-sm text-muted-foreground">{p.explica}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ───────────────────── evolución diaria ───────────────────── */

export type Dia = { fecha: string; gasto: number; leads: number }

function diaCorto(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

/**
 * Gasto por día en barras, con los leads marcados encima.
 *
 * Se dibuja con barras y no con una línea a propósito: una línea estirada a lo ancho pierde
 * tramos si el lienzo se deforma (ya pasó, está en los errores del brandkit). Las barras se
 * miden solas con porcentajes y no se rompen a ningún ancho.
 *
 * En el teléfono no hay cursor, así que se toca una barra y su dato se fija debajo.
 */
export function EvolucionDiaria({ dias }: { dias: Dia[] }) {
  const [elegido, setElegido] = useState<number | null>(null)

  if (dias.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-4 md:p-5">
        <h3 className="text-[17px] font-semibold text-foreground">Gasto día a día</h3>
        <p className="mt-2 text-[15px] text-muted-foreground">
          No hay días con actividad en el periodo elegido.
        </p>
      </section>
    )
  }

  const topeGasto = Math.max(...dias.map((d) => d.gasto), 0.01)
  const totalGasto = dias.reduce((s, d) => s + d.gasto, 0)
  const totalLeads = dias.reduce((s, d) => s + d.leads, 0)
  const diaCaro = dias.reduce((a, b) => (b.gasto > a.gasto ? b : a), dias[0])
  const visto = elegido !== null ? dias[elegido] : null

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[17px] font-semibold text-foreground">Gasto día a día</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{eur(totalGasto)}</span> en
          total, <span className="font-semibold text-foreground tabular-nums">{totalLeads}</span>{" "}
          leads
        </p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Cada barra es un día. Toca una para ver su dato. El día más caro fue el{" "}
        {diaCorto(diaCaro.fecha)} con {eur(diaCaro.gasto)}.
      </p>

      {/* Eje de arriba rotulado con el tope, para que la altura signifique algo */}
      <p className="mt-4 text-sm text-muted-foreground tabular-nums">{eur(topeGasto)}</p>

      <div className="mt-1 flex h-40 items-end gap-[2px] border-b border-border md:h-48">
        {dias.map((d, i) => {
          const alto = Math.max((d.gasto / topeGasto) * 100, d.gasto > 0 ? 3 : 0)
          const activo = elegido === i
          return (
            <button
              key={d.fecha}
              type="button"
              onClick={() => setElegido(activo ? null : i)}
              title={`${diaCorto(d.fecha)}: ${eur(d.gasto)} · ${d.leads} leads`}
              aria-label={`${diaCorto(d.fecha)}: ${eur(d.gasto)}, ${d.leads} leads`}
              className="group relative flex h-full min-w-0 flex-1 items-end"
            >
              <span
                className={cn(
                  "w-full rounded-t-lg transition-colors",
                  activo ? "bg-brand" : "bg-brand/60 group-hover:bg-brand"
                )}
                style={{ height: `${alto}%` }}
              />
              {/* Los días con leads llevan marca: es lo que de verdad se busca */}
              {d.leads > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 mx-auto h-1.5 w-1.5 rounded-full bg-foreground"
                  style={{ bottom: `calc(${alto}% + 3px)` }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-sm text-muted-foreground">
        <span>{diaCorto(dias[0].fecha)}</span>
        <span>{diaCorto(dias[dias.length - 1].fecha)}</span>
      </div>

      {/* El dato del día tocado, fijo. Nunca solo al pasar el cursor. */}
      <div className="mt-3 min-h-[52px] rounded-lg border border-border bg-muted/40 px-3 py-2">
        {visto ? (
          <p className="text-[15px] text-foreground">
            <span className="font-semibold">{diaCorto(visto.fecha)}</span>:{" "}
            <span className="tabular-nums">{eur(visto.gasto)}</span> y{" "}
            <span className="tabular-nums">{visto.leads}</span>{" "}
            {visto.leads === 1 ? "lead" : "leads"}
          </p>
        ) : (
          <p className="text-[15px] text-muted-foreground">
            Toca una barra para ver el gasto y los leads de ese día. El punto encima de una
            barra significa que ese día entraron leads.
          </p>
        )}
      </div>
    </section>
  )
}

/* ─────────────────── comparativa por campaña ─────────────────── */

export type BarraCampana = { nombre: string; gasto: number; leads: number; costePorLead: number }

/**
 * Comparación entre campañas en barras horizontales: el nombre a la izquierda y la barra
 * creciendo a la derecha. En 375px es la única forma de que el nombre de la campaña se lea.
 * Máximo 7, el resto se agrupa: 30 barras en un teléfono no son un gráfico.
 */
export function ComparativaCampanas({ campanas }: { campanas: BarraCampana[] }) {
  if (campanas.length === 0) return null

  const orden = [...campanas].sort((a, b) => b.gasto - a.gasto)
  const visibles = orden.slice(0, 7)
  const resto = orden.slice(7)
  const otros =
    resto.length > 0
      ? {
          nombre: `Otras ${resto.length}`,
          gasto: resto.reduce((s, c) => s + c.gasto, 0),
          leads: resto.reduce((s, c) => s + c.leads, 0),
          costePorLead: 0,
        }
      : null
  const lista = otros ? [...visibles, otros] : visibles
  const tope = Math.max(...lista.map((c) => c.gasto), 0.01)

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <h3 className="text-[17px] font-semibold text-foreground">En qué se va el dinero</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Gasto por campaña, de mayor a menor. Al lado, los leads que trajo cada una.
      </p>

      <ul className="mt-4 space-y-3">
        {lista.map((c) => (
          <li key={c.nombre}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                {c.nombre}
              </span>
              <span className="shrink-0 text-[15px] font-semibold text-foreground tabular-nums">
                {eur(c.gasto)}
              </span>
            </div>
            <div className="mt-1.5 h-6 w-full overflow-hidden rounded-lg bg-muted">
              <div
                className="h-full rounded-lg bg-brand transition-[width] duration-500"
                style={{ width: `${Math.max((c.gasto / tope) * 100, c.gasto > 0 ? 4 : 0)}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {c.leads} {c.leads === 1 ? "lead" : "leads"}
              {c.leads > 0 && c.gasto > 0 && <> · {eur(c.gasto / c.leads)} por lead</>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
