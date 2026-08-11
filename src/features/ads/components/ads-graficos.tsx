"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useCaja } from "./ads-medida"

/** Alto del dibujo. En el telefono uno de 236 puntos se come media pantalla. */
const ALTO_LIENZO = "h-[176px] md:h-[236px]"

/**
 * Los graficos de serie del panel de Campanas: la evolucion y el embudo.
 *
 * Rehechos el 2026-08-11 contra una referencia de paneles profesionales que trajo Marco.
 * Lo que cambio y por que:
 *
 *   - FUERA la rejilla y las lineas de eje. En la referencia, 9 de cada 10 graficos no
 *     tienen ni una ni otra: el eje es texto gris diminuto flotando, sin raya. Una rejilla
 *     convierte el grafico en una hoja de calculo.
 *   - La linea va CURVADA y medida en pixeles reales, no estirada. El relleno se apaga
 *     hacia abajo hasta desaparecer.
 *   - Etiqueta flotante siempre a la vista: ficha con la fecha y la cifra, unida al dato
 *     por una linea vertical de puntos y un punto gordo sobre la curva. Es el detalle que
 *     mas separa un panel profesional de una grafica de manual.
 *   - El embudo son barras finas de progreso, no cajones. Cada tramo se mide CONTRA EL
 *     ANTERIOR, no contra el numero mayor.
 *
 * Los dos ejes siguen rotulados y cada dato tiene su numero a la vista, como manda la
 * seccion 8 bis del brandkit. Lo que se quita es el andamiaje, no la informacion.
 */

const fmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 })
const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 })
/** Para porcentajes muy pequenos, que con un decimal fijo se quedarian en cero. */
const fmtFino = new Intl.NumberFormat("es-ES", { maximumSignificantDigits: 2 })
const fmtEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })

function diaCorto(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}
function diaLargo(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

/**
 * Redondea el tope de una escala a 1, 2 o 5 por diez elevado a algo.
 *
 * Sin esto el eje salia "54,58 € / 36,02 € / 18,01 € / 0", que es el maximo del periodo
 * partido en tres. Ningun panel serio rotula asi: se rotula 60 / 40 / 20 / 0. Con el tope
 * ya redondeado, los tres cortes caen en numeros limpios solos.
 */
function escalaBonita(max: number, tramos = 3): number {
  if (!(max > 0)) return 1
  const bruto = max / tramos
  const magnitud = Math.pow(10, Math.floor(Math.log10(bruto)))
  const normal = bruto / magnitud
  const paso = (normal <= 1 ? 1 : normal <= 2 ? 2 : normal <= 5 ? 5 : 10) * magnitud
  return paso * tramos
}

/**
 * Curva suave que pasa por todos los puntos.
 *
 * Los puntos de control se recortan al rango de sus dos extremos: sin ese recorte la curva
 * se sale por arriba entre dos dias y dibuja un gasto que nunca existio.
 */
function curva(pts: { x: number; y: number }[], t = 0.2): string {
  if (pts.length === 0) return ""
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const lo = Math.min(p1.y, p2.y)
    const hi = Math.max(p1.y, p2.y)
    const recorta = (y: number) => Math.min(Math.max(y, lo), hi)
    const c1x = p1.x + (p2.x - p0.x) * t
    const c1y = recorta(p1.y + (p2.y - p0.y) * t)
    const c2x = p2.x - (p3.x - p1.x) * t
    const c2y = recorta(p2.y - (p3.y - p1.y) * t)
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

/* ───────────────────────── evolucion ───────────────────────── */

export type Dia = { fecha: string; gasto: number; leads: number }

export function Evolucion({ dias }: { dias: Dia[] }) {
  const [foco, setFoco] = useState<number | null>(null)
  const [caja, medida] = useCaja()

  if (dias.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-[15px] font-semibold text-foreground">Gasto y leads, día a día</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">Sin actividad en el periodo elegido.</p>
      </section>
    )
  }

  // El tamano lo manda el CSS y se lee de vuelta: asi el telefono decide su propio alto.
  const listo = medida.ancho > 0 && medida.alto > 0
  const H = Math.max(medida.alto, 1)
  const W = Math.max(medida.ancho, 1)
  const ARRIBA = 30 // hueco para que la curva nunca toque el borde de la tarjeta
  const ABAJO = 10
  const alto = Math.max(H - ARRIBA - ABAJO, 1)

  const topeG = escalaBonita(Math.max(...dias.map((d) => d.gasto), 0))
  const topeL = Math.max(...dias.map((d) => d.leads), 1)
  // Se deja un margen a los lados: sin el, el punto del ultimo dia queda partido por la
  // mitad contra el borde y la curva parece cortada a hueso.
  const LADO = 5
  const px = (i: number) =>
    dias.length > 1 ? LADO + (i / (dias.length - 1)) * Math.max(W - LADO * 2, 1) : W / 2
  const py = (g: number) => ARRIBA + (1 - g / topeG) * alto

  const puntos = dias.map((d, i) => ({ x: px(i), y: py(d.gasto) }))
  const linea = curva(puntos)
  const area = `${linea} L${px(dias.length - 1)},${H} L${px(0)},${H} Z`

  const iMax = dias.reduce((a, d, i) => (d.gasto > dias[a].gasto ? i : a), 0)
  const iVisto = foco ?? iMax
  const visto = dias[iVisto]
  const totalG = dias.reduce((s, d) => s + d.gasto, 0)
  const totalL = dias.reduce((s, d) => s + d.leads, 0)

  const paso = dias.length > 1 ? W / (dias.length - 1) : W
  const anchoBarra = Math.max(3, Math.min(18, paso * 0.34))
  const altoLeads = alto * 0.44

  // La ficha flotante se pega al borde si el dia enfocado es el primero o el ultimo.
  const xFicha = Math.min(Math.max(px(iVisto), 74), Math.max(W - 74, 74))
  const yPunto = py(visto.gasto)
  const fichaArriba = yPunto > 58

  function seguir(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    if (r.width === 0) return
    const rel = (e.clientX - r.left) / r.width
    const i = Math.round(rel * (dias.length - 1))
    setFoco(Math.min(Math.max(i, 0), dias.length - 1))
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-1 pt-4">
        <h2 className="text-[15px] font-semibold text-foreground">Gasto y leads, día a día</h2>
        <span className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <i className="h-1.5 w-4 rounded-full bg-brand" />
            {fmtEur.format(totalG)}
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <i className="h-2.5 w-1.5 rounded-full bg-muted-foreground/50" />
            {totalL} leads
          </span>
        </span>
      </header>

      <div className="flex gap-2 px-3 pt-3 md:gap-2.5 md:px-4">
        {/* Eje de la izquierda: solo texto, sin raya y sin rejilla. */}
        <div
          className={cn(
            "flex shrink-0 flex-col justify-between text-right text-sm text-muted-foreground tabular-nums",
            ALTO_LIENZO
          )}
          style={{ paddingTop: ARRIBA - 8, paddingBottom: ABAJO }}
        >
          {/* TERCIOS EXACTOS, no 0,66 y 0,33: con esos, un tope redondeado de 60 daba
              "39,60 €" y "19,80 €" y se perdia todo lo ganado al redondear la escala. */}
          {[1, 2 / 3, 1 / 3].map((f) => (
            <span key={f}>{fmtEur.format(topeG * f)}</span>
          ))}
          <span>0</span>
        </div>

        <div
          ref={caja}
          className={cn("relative min-w-0 flex-1 touch-pan-y", ALTO_LIENZO)}
          onPointerMove={seguir}
          onPointerDown={seguir}
          onPointerLeave={() => setFoco(null)}
        >
          {listo && (
            <svg
              width={W}
              height={H}
              className="block"
              role="img"
              aria-label={`Gasto y leads día a día. ${fmtEur.format(totalG)} y ${totalL} leads en total.`}
            >
              <defs>
                {/* Llega hasta abajo. Apagandose a cero a media altura quedaba una nube
                    flotando sin base. */}
                <linearGradient id="ev-relleno" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="ev-trazo" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-brand)" />
                  <stop offset="100%" stopColor="var(--color-brand-soft)" />
                </linearGradient>
              </defs>

              {/* Leads: columnas finas detras de la curva. */}
              {dias.map((d, i) => {
                const h = (d.leads / topeL) * altoLeads
                if (h <= 0) return null
                return (
                  <rect
                    key={`b${d.fecha}`}
                    x={px(i) - anchoBarra / 2}
                    y={H - ABAJO - h}
                    width={anchoBarra}
                    height={h}
                    rx={anchoBarra / 2}
                    className={i === iVisto ? "fill-brand-soft/70" : "fill-muted-foreground/25"}
                  />
                )
              })}

              <path d={area} fill="url(#ev-relleno)" />
              <path
                d={linea}
                fill="none"
                stroke="url(#ev-trazo)"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* La vertical de puntos que une la ficha con el dato. */}
              <line
                x1={px(iVisto)}
                x2={px(iVisto)}
                y1={py(visto.gasto)}
                y2={H - ABAJO}
                strokeDasharray="2 4"
                strokeWidth="1"
                strokeLinecap="round"
                className="stroke-muted-foreground/60"
              />
              {/* Punto fijo del ultimo dia, para que la serie termine en algo y no en un
                  corte seco. Se calla cuando el dia enfocado ya es ese. */}
              {iVisto !== dias.length - 1 && (
                <circle
                  cx={px(dias.length - 1)}
                  cy={py(dias[dias.length - 1].gasto)}
                  r="2.5"
                  className="fill-brand-soft"
                />
              )}
              <circle cx={px(iVisto)} cy={py(visto.gasto)} r="7" className="fill-brand/20" />
              <circle
                cx={px(iVisto)}
                cy={py(visto.gasto)}
                r="3.5"
                className="fill-brand stroke-card"
                strokeWidth="2"
              />
            </svg>
          )}

          {/* Ficha flotante. Va en HTML: dentro del dibujo la letra se deforma. */}
          {listo && (
            <div
              className={cn(
                "pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-md",
                // Si el punto esta pegado al techo no cabe encima: la ficha se pone debajo.
                // Sin esto, el dia de mas gasto (que es el que sale marcado por defecto)
                // dejaba la ficha cortada por el borde de la tarjeta.
                fichaArriba && "-translate-y-full"
              )}
              style={{ left: xFicha, top: fichaArriba ? yPunto - 12 : yPunto + 14 }}
            >
              <p className="whitespace-nowrap text-sm text-muted-foreground">
                {diaCorto(visto.fecha)}
              </p>
              <p className="whitespace-nowrap text-[15px] font-semibold text-foreground tabular-nums">
                {fmtEur.format(visto.gasto)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Eje de abajo: fechas, tambien sin raya. */}
      <div className="flex justify-between px-4 pb-1 pt-2 text-sm text-muted-foreground">
        <span>{diaCorto(dias[0].fecha)}</span>
        {dias.length > 2 && <span>{diaCorto(dias[Math.floor(dias.length / 2)].fecha)}</span>}
        <span>{diaCorto(dias[dias.length - 1].fecha)}</span>
      </div>

      {/* En un telefono no hay cursor: el dato del dia enfocado se escribe siempre. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-4 py-2.5">
        {/* `capitalize` pone mayuscula a CADA palabra y salia "5 De Agosto". */}
        <span className="text-sm text-muted-foreground first-letter:uppercase">
          {diaLargo(visto.fecha)}
        </span>
        <span className="text-[15px] font-semibold text-foreground tabular-nums">
          {fmtEur.format(visto.gasto)}
        </span>
        <span className="text-[15px] font-semibold text-foreground tabular-nums">
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

/**
 * El embudo, en barras finas de progreso.
 *
 * Cada tramo se mide CONTRA EL ANTERIOR. Medido contra el numero mayor, como las
 * impresiones son mil veces los leads, los tres ultimos pasos salian como rayas.
 */
export function Embudo({ pasos }: { pasos: PasoEmbudo[] }) {
  const primero = pasos[0]?.valor ?? 0
  const ultimo = pasos[pasos.length - 1]?.valor ?? 0
  // "0,037% llega al final" no le dice nada a nadie. "1 de cada 2.702 acaba en lead" si.
  const cadaCuantos = ultimo > 0 ? Math.round(primero / ultimo) : null
  const deQue = (pasos[0]?.nombre ?? "").toLowerCase()
  const enQue = (pasos[pasos.length - 1]?.nombre ?? "").toLowerCase().replace(/s$/, "")

  let peor = -1
  let peorTasa = 101
  pasos.forEach((p, i) => {
    if (i === 0) return
    const prev = pasos[i - 1].valor
    const t = prev > 0 ? (p.valor / prev) * 100 : 100
    if (t < peorTasa) {
      peorTasa = t
      peor = i
    }
  })

  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 className="text-[15px] font-semibold text-foreground">Embudo</h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {cadaCuantos
            ? `1 de cada ${fmt.format(cadaCuantos)} ${deQue} acaba en ${enQue}`
            : `Todavía sin ${(pasos[pasos.length - 1]?.nombre ?? "").toLowerCase()}`}
        </span>
      </header>

      {/* Estrecha de verdad, paso a paso. Antes eran cuatro barras del mismo ancho apiladas
          y de embudo no tenian nada. Lo que se ESTRECHA es el carril; lo que se rellena
          dentro es cuanta gente pasa del paso anterior a este, que es el dato util. */}
      <div className="mt-4 flex flex-1 flex-col justify-center gap-4">
        {pasos.map((p, i) => {
          const prev = i > 0 ? pasos[i - 1].valor : null
          const tasa = prev && prev > 0 ? (p.valor / prev) * 100 : null
          const relleno = tasa === null ? 100 : Math.max(Math.min(tasa, 100), 4)
          const carril = 100 - i * (36 / Math.max(pasos.length - 1, 1))
          const esPeor = i === peor && pasos.length > 2
          return (
            <div key={p.nombre} className="mx-auto w-full" style={{ maxWidth: `${carril}%` }}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-muted-foreground">{p.nombre}</span>
                <span className="shrink-0 text-[19px] font-bold leading-none tracking-tight text-foreground tabular-nums">
                  {fmt.format(p.valor)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/50">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    esPeor ? "bg-warn" : i === pasos.length - 1 ? "bg-brand" : "bg-brand/45"
                  )}
                  style={{ width: `${relleno}%` }}
                />
              </div>
              {tasa !== null && (
                <p
                  className={cn(
                    "mt-1.5 text-sm tabular-nums",
                    esPeor ? "text-warn" : "text-muted-foreground"
                  )}
                >
                  {tasa > 100 ? (
                    <>sube {fmtDec.format(tasa - 100)}%: aquí se cuentan visitas, no personas</>
                  ) : (
                    <>
                      pasa el {fmtDec.format(tasa)}%{esPeor && ", la mayor caída"}
                    </>
                  )}
                </p>
              )}
            </div>
          )
        })}
      </div>
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
