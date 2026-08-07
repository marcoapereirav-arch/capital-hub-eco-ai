"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { FilaDesglose } from "@/lib/meta/panel"

/**
 * Los gráficos del panel de Campañas.
 *
 * Se rehicieron enteros el 2026-08-07. La version anterior eran cajas de color con un
 * parrafo debajo de cada una, y Marco lo llamo por su nombre: "lo que veo son barras y ya
 * esta". Lo que cambio:
 *
 *   - El grafico principal es un grafico de verdad: area con degradado, rejilla, los DOS
 *     ejes rotulados, linea vertical del dia enfocado y tarjeta flotante con sus cifras.
 *   - El embudo mide cada tramo CONTRA EL ANTERIOR. Antes se medía contra el numero mayor,
 *     y como las impresiones son mil veces los leads, los tres ultimos pasos eran rayas.
 *   - Cero parrafos. Un panel se escanea, no se lee.
 *
 * Todo por tokens del tema y `tabular-nums` en cada cifra.
 */

const fmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 })
const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 })
const fmtEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })

function diaCorto(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}
function diaLargo(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  })
}

/* ───────────────────────── evolución ───────────────────────── */

export type Dia = { fecha: string; gasto: number; leads: number }

/**
 * Gasto y leads por día.
 *
 * Se dibuja midiendo en porcentajes sobre un `viewBox` fijo y con `preserveAspectRatio`
 * por defecto: una linea estirada con `none` pierde tramos si el lienzo se deforma, y eso
 * ya rompio una vez (esta en los errores del brandkit).
 */
export function Evolucion({ dias }: { dias: Dia[] }) {
  const [foco, setFoco] = useState<number | null>(null)

  if (dias.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-[15px] font-semibold text-foreground">Evolución</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sin actividad en el periodo elegido.
        </p>
      </section>
    )
  }

  // Lienzo fijo. Todo se calcula sobre estas medidas.
  // El lienzo es SOLO el area del dibujo: los ejes y las fechas van en HTML alrededor.
  const W = 920, H = 240
  const topeG = Math.max(...dias.map((d) => d.gasto), 1)
  const topeL = Math.max(...dias.map((d) => d.leads), 1)
  const paso = dias.length > 1 ? W / (dias.length - 1) : 0
  const px = (i: number) => (dias.length > 1 ? i * paso : W / 2)
  const py = (g: number) => H - (g / topeG) * H

  const linea = dias.map((d, i) => `${px(i)},${py(d.gasto)}`).join(" L")
  const area = `M${linea} L${px(dias.length - 1)},${H} L${px(0)},${H} Z`

  const iMax = dias.reduce((a, d, i) => (d.gasto > dias[a].gasto ? i : a), 0)
  const visto = foco !== null ? dias[foco] : dias[iMax]
  const iVisto = foco !== null ? foco : iMax
  const totalG = dias.reduce((s, d) => s + d.gasto, 0)
  const totalL = dias.reduce((s, d) => s + d.leads, 0)

  const anchoBarra = Math.max(6, Math.min(34, paso * 0.42))

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <h2 className="text-[15px] font-semibold text-foreground">Evolución</h2>
        <span className="inline-flex items-center gap-2 rounded border border-border bg-muted/40 px-2 py-1 text-sm text-muted-foreground">
          <i className="h-2 w-2 rounded-sm bg-brand" />
          Gasto
        </span>
        <span className="inline-flex items-center gap-2 rounded border border-border bg-muted/40 px-2 py-1 text-sm text-muted-foreground">
          <i className="h-2 w-2 rounded-sm bg-muted-foreground/60" />
          Leads
        </span>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {fmtEur.format(totalG)} · {totalL} leads
        </span>
      </header>

      {/* Las etiquetas de los ejes van en HTML, FUERA del dibujo.
          Dentro del SVG se encogen con el lienzo: a 375px un texto de 12 acaba en 5px y
          no se lee. En HTML miden lo mismo en cualquier pantalla. */}
      <div className="px-3 pb-1 pt-4">
        <div className="flex gap-2">
          <div className="flex w-[52px] shrink-0 flex-col justify-between py-px text-right text-sm text-muted-foreground tabular-nums">
            {[1, 0.75, 0.5, 0.25, 0].map((f) => (
              <span key={f}>{f === 0 ? "0" : fmtEur.format(topeG * f)}</span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="block h-[180px] w-full md:h-[240px]"
              role="img"
              aria-label={`Gasto y leads por día. Total ${fmtEur.format(totalG)} y ${totalL} leads.`}
            >
              <defs>
                <linearGradient id="ev-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line key={f} x1={0} x2={W} y1={f * H} y2={f * H} stroke="currentColor"
                      strokeWidth="1" vectorEffect="non-scaling-stroke" className="text-border" />
              ))}

              {dias.map((d, i) => {
                const h = (d.leads / topeL) * H
                return h > 0 ? (
                  <rect key={d.fecha} x={px(i) - anchoBarra / 2} y={H - h} width={anchoBarra}
                        height={h} className="fill-muted-foreground/30" />
                ) : null
              })}

              <line x1={px(iVisto)} x2={px(iVisto)} y1={0} y2={H} strokeDasharray="4 4"
                    strokeWidth="1" vectorEffect="non-scaling-stroke" className="stroke-brand/50" />

              <path d={area} fill="url(#ev-area)" />
              <path d={`M${linea}`} fill="none" strokeWidth="2.4" vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round" strokeLinecap="round" className="stroke-brand" />

              {dias.map((d, i) => (
                <rect key={`z${d.fecha}`} x={px(i) - paso / 2} y={0} width={paso || W} height={H}
                      fill="transparent" className="cursor-pointer"
                      onMouseEnter={() => setFoco(i)} onClick={() => setFoco(i)}>
                  <title>{`${diaLargo(d.fecha)}: ${fmtEur.format(d.gasto)}, ${d.leads} leads`}</title>
                </rect>
              ))}
            </svg>

            {/* El punto del día enfocado, en HTML para que no se deforme con el lienzo */}
            <span
              aria-hidden
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-[3px] ring-card"
              style={{ left: `${(px(iVisto) / W) * 100}%`, top: `${(py(visto.gasto) / H) * 100}%` }}
            />
          </div>

          <div className="flex w-[22px] shrink-0 flex-col justify-between py-px text-sm text-muted-foreground tabular-nums">
            {[1, 0.5, 0].map((f) => (
              <span key={f}>{Math.round(topeL * f)}</span>
            ))}
          </div>
        </div>

        <div className="ml-[60px] mr-[30px] mt-1.5 flex justify-between text-sm text-muted-foreground">
          <span>{diaCorto(dias[0].fecha)}</span>
          {dias.length > 2 && <span>{diaCorto(dias[Math.floor(dias.length / 2)].fecha)}</span>}
          <span>{diaCorto(dias[dias.length - 1].fecha)}</span>
        </div>
      </div>

      {/* El dato del día, siempre escrito. En un teléfono no hay cursor. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-4 py-2.5">
        <span className="text-sm text-muted-foreground">{diaLargo(visto.fecha)}</span>
        <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-foreground tabular-nums">
          <i className="h-2 w-2 rounded-sm bg-brand" />
          {fmtEur.format(visto.gasto)}
        </span>
        <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-foreground tabular-nums">
          <i className="h-2 w-2 rounded-sm bg-muted-foreground/60" />
          {visto.leads} {visto.leads === 1 ? "lead" : "leads"}
        </span>
        {visto.leads > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {fmtEur.format(visto.gasto / visto.leads)} por lead
          </span>
        )}
      </div>
    </section>
  )
}

/* ───────────────────────── embudo ───────────────────────── */

export type PasoEmbudo = { nombre: string; valor: number }

export function Embudo({ pasos }: { pasos: PasoEmbudo[] }) {
  const primero = pasos[0]?.valor ?? 0
  const ultimo = pasos[pasos.length - 1]?.valor ?? 0
  const puntaAPunta = primero > 0 ? (ultimo / primero) * 100 : 0

  // El tramo mas flojo se señala DENTRO del dibujo, no se cuenta aparte.
  let peor = -1, peorTasa = 101
  pasos.forEach((p, i) => {
    if (i === 0) return
    const prev = pasos[i - 1].valor
    const t = prev > 0 ? (p.valor / prev) * 100 : 100
    if (t < peorTasa) { peorTasa = t; peor = i }
  })

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <h2 className="text-[15px] font-semibold text-foreground">Embudo</h2>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {fmtDec.format(puntaAPunta)}% de punta a punta
        </span>
      </header>

      <div className="p-3 md:p-4">
        {pasos.map((p, i) => {
          const prev = i > 0 ? pasos[i - 1].valor : null
          const tasa = prev && prev > 0 ? (p.valor / prev) * 100 : null
          const ancho = tasa === null ? 100 : Math.max(Math.min(tasa, 100), 16)
          const esPeor = i === peor && pasos.length > 2
          return (
            <div key={p.nombre}>
              {tasa !== null && (
                <p className={cn(
                  "flex h-6 items-center justify-end gap-1.5 text-sm tabular-nums",
                  esPeor ? "font-semibold text-warn" : "text-muted-foreground"
                )}>
                  {tasa > 100 ? (
                    <>sube {fmtDec.format(tasa - 100)}%, aquí se cuentan visitas</>
                  ) : (
                    <>
                      siguen <span className="font-semibold">{fmtDec.format(tasa)}%</span>
                      {esPeor && " · la caída más fuerte"}
                    </>
                  )}
                </p>
              )}
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 flex-1 items-center overflow-hidden rounded bg-muted/40 pl-2.5">
                  <span className={cn("absolute inset-y-0 left-0 rounded",
                    esPeor ? "bg-warn/25" : i === pasos.length - 1 ? "bg-brand/50" : "bg-brand/25")}
                    style={{ width: `${ancho}%` }} />
                  <span className="relative text-sm font-medium text-foreground">{p.nombre}</span>
                </div>
                <span className="w-[64px] shrink-0 text-right md:w-[72px] text-[15px] font-semibold text-foreground tabular-nums">
                  {fmt.format(p.valor)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ───────────────────── desglose en barras ───────────────────── */

export function Desglose({
  titulo,
  filas,
  etiqueta,
  nota,
}: {
  titulo: string
  filas: FilaDesglose[]
  /** Traduce la clave cruda de Meta a algo legible. */
  etiqueta: (clave: string) => string
  nota?: string
}) {
  if (filas.length === 0) return null
  // Cinco como mucho: un desglose con veinte filas deja de ser un resumen. Lo demas se ve
  // en la tabla de abajo, que si pagina de 20 en 20.
  const visibles = filas.slice(0, 5)
  const tope = Math.max(...visibles.map((f) => f.gasto), 0.01)
  const mejor = filas.filter((f) => f.leads > 0).sort((a, b) => a.gasto / a.leads - b.gasto / b.leads)[0]

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-[15px] font-semibold text-foreground">{titulo}</h2>
      </header>

      <div className="flex flex-col gap-3.5 p-3 md:p-4">
        {visibles.map((f) => {
          const porLead = f.leads > 0 ? f.gasto / f.leads : null
          const esMejor = mejor && f.clave === mejor.clave
          const sinLeads = f.leads === 0
          return (
            <div key={f.clave}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {etiqueta(f.clave)}
                </span>
                <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                  {fmtEur.format(f.gasto)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                <span className={cn("block h-full rounded-full",
                  sinLeads ? "bg-destructive/70" : esMejor ? "bg-brand" : "bg-brand/50")}
                  style={{ width: `${Math.max((f.gasto / tope) * 100, 3)}%` }} />
              </div>
              <p className={cn("mt-1 text-sm tabular-nums",
                sinLeads ? "text-destructive" : "text-muted-foreground")}>
                {sinLeads ? (
                  <>sin un solo lead</>
                ) : (
                  <>
                    {f.leads} {f.leads === 1 ? "lead" : "leads"} ·{" "}
                    <span className={esMejor ? "font-semibold text-brand" : undefined}>
                      {fmtEur.format(porLead!)} por lead
                    </span>
                  </>
                )}
              </p>
            </div>
          )
        })}
      </div>

      {nota && (
        <p className="border-t border-border px-4 py-2.5 text-sm text-muted-foreground">{nota}</p>
      )}
    </section>
  )
}

export const ETIQUETA_PLATAFORMA: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
  audience_network: "Red de socios",
  messenger: "Messenger",
}
