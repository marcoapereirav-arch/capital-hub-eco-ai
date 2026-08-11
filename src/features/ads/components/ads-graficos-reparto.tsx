"use client"

import { cn } from "@/lib/utils"
import type { FilaDesglose } from "@/lib/meta/panel"

/**
 * Los graficos de REPARTO del panel de Campanas: en que se va el dinero, donde se muestra,
 * cuanto cuesta un lead y que dia de la semana responde la gente.
 *
 * Formas sacadas de la referencia que trajo Marco el 2026-08-11: rosco grueso con hueco
 * entre porciones, anillos de progreso, medidor de aguja y barras en capsula con el numero
 * escrito ENCIMA de la barra en vez de un eje vertical.
 *
 * COLOR: la referencia usa una rampa monocroma del acento, nunca varios colores mezclados.
 * Aqui esa rampa es el verde de marca a distintas opacidades. El ambar se reserva para
 * avisar, como manda el brandkit.
 */

const fmtEur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })
const fmtDec = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 })

/** Rampa monocroma del verde. Sirve para el rosco y para las leyendas. */
const RAMPA = [
  "bg-brand",
  "bg-brand/70",
  "bg-brand/50",
  "bg-brand/34",
  "bg-brand/22",
  "bg-muted-foreground/30",
]
const RAMPA_TRAZO = [
  "stroke-brand",
  "stroke-brand/70",
  "stroke-brand/50",
  "stroke-brand/34",
  "stroke-brand/22",
  "stroke-muted-foreground/30",
]

export type Porcion = { clave: string; nombre: string; valor: number }

/* ───────────────────── rosco: en que se va el dinero ───────────────────── */

export function Reparto({ porciones, unidad = "campañas" }: { porciones: Porcion[]; unidad?: string }) {
  const conGasto = porciones.filter((p) => p.valor > 0).sort((a, b) => b.valor - a.valor)
  const total = conGasto.reduce((s, p) => s + p.valor, 0)

  if (total <= 0) return null

  // Cinco porciones y el resto junto: un rosco de veinte trozos no se lee.
  const visibles = conGasto.slice(0, 5)
  const resto = conGasto.slice(5).reduce((s, p) => s + p.valor, 0)
  const trozos = resto > 0 ? [...visibles, { clave: "otras", nombre: "Las demás", valor: resto }] : visibles

  // El aro es FINO a proposito: con el grosor de antes el hueco central se quedaba en 112
  // puntos y la cifra de dinero llegaba a rozar el trazo. Ahora el hueco mide 121 y la
  // cifra vive dentro de una caja del 72% del ancho, asi que nunca lo toca.
  const R = 68
  const GROSOR = 15
  const VUELTA = 2 * Math.PI * R
  const HUECO = trozos.length > 1 ? 4 : 0

  let acumulado = 0

  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-foreground">En qué se va el dinero</h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {conGasto.length} {unidad}
        </span>
      </header>

      <div className="relative mx-auto mt-4 w-full max-w-[168px]">
        <svg viewBox="0 0 168 168" className="block w-full" role="img" aria-label="Reparto del gasto por campaña">
          <circle cx="84" cy="84" r={R} fill="none" strokeWidth={GROSOR} className="stroke-muted/40" />
          {trozos.map((p, i) => {
            const parte = p.valor / total
            const largo = Math.max(VUELTA * parte - HUECO, 1)
            const desfase = -VUELTA * acumulado
            acumulado += parte
            return (
              <circle
                key={p.clave}
                cx="84"
                cy="84"
                r={R}
                fill="none"
                strokeWidth={GROSOR}
                strokeDasharray={`${largo} ${VUELTA - largo}`}
                strokeDashoffset={desfase}
                transform="rotate(-90 84 84)"
                className={RAMPA_TRAZO[i] ?? RAMPA_TRAZO[5]}
              />
            )
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="w-[72%] text-center text-[22px] font-bold leading-none tracking-tight text-foreground tabular-nums">
            {fmtEur.format(total)}
          </span>
          <span className="mt-2 text-sm text-muted-foreground">gastado</span>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-2">
        {trozos.map((p, i) => (
          <li key={p.clave} className="flex items-center gap-2.5">
            <i className={cn("h-2 w-2 shrink-0 rounded-full", RAMPA[i] ?? RAMPA[5])} />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{p.nombre}</span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {fmtDec.format((p.valor / total) * 100)}%
            </span>
            <span className="w-[58px] shrink-0 text-right text-sm font-semibold text-foreground tabular-nums">
              {fmtEur.format(p.valor)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ───────────────────── anillos: donde se muestra ───────────────────── */

export function Anillos({
  titulo,
  filas,
  etiqueta,
}: {
  titulo: string
  filas: FilaDesglose[]
  etiqueta: (clave: string) => string
}) {
  const total = filas.reduce((s, f) => s + f.gasto, 0)
  if (total <= 0) return null

  const visibles = filas.slice(0, 3)
  const mejor = filas
    .filter((f) => f.leads > 0)
    .sort((a, b) => a.gasto / a.leads - b.gasto / b.leads)[0]

  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <h2 className="text-[15px] font-semibold text-foreground">{titulo}</h2>

      <div className="mt-4 flex flex-1 items-center justify-around gap-2">
        {visibles.map((f) => {
          const parte = f.gasto / total
          const porLead = f.leads > 0 ? f.gasto / f.leads : null
          const esMejor = Boolean(mejor && f.clave === mejor.clave)
          // Aro fino y hueco ancho, por lo mismo que el rosco: la cifra tiene que respirar.
          const R = 33
          const VUELTA = 2 * Math.PI * R
          return (
            <div key={f.clave} className="flex min-w-0 flex-col items-center gap-2">
              <div className="relative w-[78px]">
                <svg viewBox="0 0 78 78" className="block w-full" aria-hidden>
                  <circle cx="39" cy="39" r={R} fill="none" strokeWidth="5" className="stroke-muted/50" />
                  <circle
                    cx="39"
                    cy="39"
                    r={R}
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${VUELTA * parte} ${VUELTA}`}
                    transform="rotate(-90 39 39)"
                    className={esMejor ? "stroke-brand" : "stroke-brand/45"}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-foreground tabular-nums">
                  {Math.round(parte * 100)}%
                </span>
              </div>
              <span className="max-w-full truncate text-sm font-medium text-foreground">
                {etiqueta(f.clave)}
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  porLead === null ? "text-destructive" : esMejor ? "text-brand" : "text-muted-foreground"
                )}
              >
                {porLead === null ? "sin leads" : `${fmtEur.format(porLead)} por lead`}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ───────────────────── medidor: coste por lead ───────────────────── */

/** Punto del arco para una fraccion de 0 (izquierda) a 1 (derecha). */
function enElArco(cx: number, cy: number, r: number, f: number) {
  const a = Math.PI * (1 - Math.min(Math.max(f, 0), 1))
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
}

/**
 * Coste por lead, en medidor.
 *
 * La escala NO se inventa: va de cero al doble de la referencia, y la referencia es el
 * coste por lead del periodo anterior, que es un dato real. La raya de fuera marca donde
 * estabas. Verde si esta por debajo, ambar si se paso.
 *
 * La cifra va DENTRO del arco, y por eso el indicador es un trozo corto pegado al arco en
 * vez de una aguja desde el centro: una aguja larga cruzaria el numero por encima.
 */
export function Medidor({
  valor,
  referencia,
  titulo,
  pieReferencia,
}: {
  valor: number
  referencia: number | null
  titulo: string
  pieReferencia: string
}) {
  const tope = referencia && referencia > 0 ? referencia * 2 : Math.max(valor * 1.6, 0.01)
  const f = Math.min(valor / tope, 1)
  const fRef = referencia && referencia > 0 ? Math.min(referencia / tope, 1) : null
  const peor = fRef !== null && valor > referencia!

  const CX = 100
  const CY = 100
  const R = 82
  const ini = enElArco(CX, CY, R, 0)
  const fin = enElArco(CX, CY, R, 1)
  const hasta = enElArco(CX, CY, R, f)
  const aguja = { de: enElArco(CX, CY, R - 26, f), a: enElArco(CX, CY, R - 9, f) }
  const marca =
    fRef !== null ? { de: enElArco(CX, CY, R + 3, fRef), a: enElArco(CX, CY, R + 13, fRef) } : null

  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <h2 className="text-[15px] font-semibold text-foreground">{titulo}</h2>

      <div className="relative mx-auto mt-4 w-full max-w-[204px]">
        <svg viewBox="0 0 200 108" className="block w-full" role="img" aria-label={titulo}>
          <path
            d={`M${ini.x},${ini.y} A${R},${R} 0 0 1 ${fin.x},${fin.y}`}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-muted/50"
          />
          {f > 0.01 && (
            /* La bandera de arco largo va SIEMPRE a cero: un medidor es media vuelta como
               mucho, y con la bandera a uno el navegador dibuja el camino de vuelta. */
            <path
              d={`M${ini.x},${ini.y} A${R},${R} 0 0 1 ${hasta.x},${hasta.y}`}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={peor ? "stroke-warn" : "stroke-brand"}
            />
          )}
          {marca && (
            <line
              x1={marca.de.x}
              y1={marca.de.y}
              x2={marca.a.x}
              y2={marca.a.y}
              strokeWidth="2"
              strokeLinecap="round"
              className="stroke-muted-foreground"
            />
          )}
          <line
            x1={aguja.de.x}
            y1={aguja.de.y}
            x2={aguja.a.x}
            y2={aguja.a.y}
            strokeWidth="3"
            strokeLinecap="round"
            className="stroke-foreground"
          />
        </svg>

        {/* La cifra, centrada dentro del arco y con su propio hueco: nunca toca el trazo. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
          <span
            className={cn(
              "block text-[28px] font-bold leading-none tracking-tight tabular-nums",
              peor ? "text-warn" : "text-foreground"
            )}
          >
            {fmtEur.format(valor)}
          </span>
          <span className="mt-1.5 block text-sm text-muted-foreground">por lead</span>
        </div>
      </div>

      <div className="mx-auto mt-2 flex w-full max-w-[204px] justify-between text-sm text-muted-foreground tabular-nums">
        <span>0</span>
        <span>{fmtEur.format(tope)}</span>
      </div>

      <p className="mt-auto pt-3 text-sm text-muted-foreground">{pieReferencia}</p>
    </section>
  )
}

/* ───────────────────── barras: que dia responde la gente ───────────────────── */

/** Corto para el eje, largo para la frase: "el mié es el que más trae" se lee fatal. */
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const DIAS_LARGOS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

export function PorDiaDeSemana({ dias }: { dias: { fecha: string; gasto: number; leads: number }[] }) {
  if (dias.length < 7) return null

  const acumulado = DIAS_SEMANA.map((nombre, i) => ({
    nombre,
    largo: DIAS_LARGOS[i],
    leads: 0,
    gasto: 0,
    veces: 0,
  }))
  for (const d of dias) {
    // getDay() da 0 para domingo. Aqui la semana empieza en lunes, como en el resto del OS.
    const i = (new Date(`${d.fecha}T12:00:00`).getDay() + 6) % 7
    acumulado[i].leads += d.leads
    acumulado[i].gasto += d.gasto
    acumulado[i].veces += 1
  }

  const tope = Math.max(...acumulado.map((a) => a.leads), 1)
  const totalLeads = acumulado.reduce((s, a) => s + a.leads, 0)
  if (totalLeads === 0) return null

  const mejor = acumulado.reduce((a, b) => (b.leads > a.leads ? b : a))
  const conLeads = acumulado.filter((a) => a.leads > 0)
  const barato = conLeads.length > 1
    ? conLeads.reduce((a, b) => (b.gasto / b.leads < a.gasto / a.leads ? b : a))
    : null

  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-foreground">Qué día entran los leads</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{totalLeads} leads</span>
      </header>

      {/* El numero va ENCIMA de cada barra: hace de eje vertical y se lee de un vistazo. */}
      <div className="mt-5 flex flex-1 items-stretch gap-1" style={{ minHeight: 132 }}>
        {acumulado.map((a) => {
          const alto = (a.leads / tope) * 78
          const esMejor = a.nombre === mejor.nombre && a.leads > 0
          return (
            <div key={a.nombre} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full flex-1 justify-center">
                <div className="relative h-full w-2 rounded-full bg-muted/40 md:w-2.5">
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-0 rounded-full",
                      esMejor ? "bg-brand" : a.leads > 0 ? "bg-brand/45" : "bg-muted-foreground/20"
                    )}
                    style={{ height: `${Math.max(alto, a.leads > 0 ? 4 : 2)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "absolute inset-x-0 text-center text-sm tabular-nums",
                    esMejor ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}
                  style={{ bottom: `calc(${Math.max(alto, 4)}% + 5px)` }}
                >
                  {a.leads}
                </span>
              </div>
              <span
                className={cn(
                  "text-sm",
                  esMejor ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {a.nombre}
              </span>
            </div>
          )
        })}
      </div>

      {/* Frases cortas y con el dato dentro. Nada de "es el que más trae, con 6 de 25". */}
      <p className="mt-3 border-t border-border pt-2.5 text-sm text-muted-foreground">
        <span className="font-semibold capitalize text-foreground">{mejor.largo}</span>, el que
        más: {mejor.leads} {mejor.leads === 1 ? "lead" : "leads"}.
        {barato && barato.nombre !== mejor.nombre && (
          <>
            {" "}
            <span className="capitalize">{barato.largo}</span>, el más barato:{" "}
            {fmtEur.format(barato.gasto / barato.leads)} por lead.
          </>
        )}
      </p>
    </section>
  )
}

/* ───────────────────── barras horizontales: edad ───────────────────── */

export function Desglose({
  titulo,
  filas,
  etiqueta,
}: {
  titulo: string
  filas: FilaDesglose[]
  etiqueta: (clave: string) => string
}) {
  if (filas.length === 0) return null
  const visibles = filas.slice(0, 6)
  const tope = Math.max(...visibles.map((f) => f.gasto), 0.01)
  const mejor = filas
    .filter((f) => f.leads > 0)
    .sort((a, b) => a.gasto / a.leads - b.gasto / b.leads)[0]

  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <h2 className="text-[15px] font-semibold text-foreground">{titulo}</h2>

      <div className="mt-4 flex flex-1 flex-col justify-center gap-3">
        {visibles.map((f) => {
          const porLead = f.leads > 0 ? f.gasto / f.leads : null
          const esMejor = Boolean(mejor && f.clave === mejor.clave)
          return (
            <div key={f.clave}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-foreground">{etiqueta(f.clave)}</span>
                <span
                  className={cn(
                    "shrink-0 text-sm tabular-nums",
                    porLead === null
                      ? "text-destructive"
                      : esMejor
                        ? "font-semibold text-brand"
                        : "text-muted-foreground"
                  )}
                >
                  {porLead === null ? "sin leads" : `${fmtEur.format(porLead)} por lead`}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      porLead === null ? "bg-destructive/60" : esMejor ? "bg-brand" : "bg-brand/45"
                    )}
                    style={{ width: `${Math.max((f.gasto / tope) * 100, 3)}%` }}
                  />
                </div>
                <span className="w-[54px] shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                  {fmtEur.format(f.gasto)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
