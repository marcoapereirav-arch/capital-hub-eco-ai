"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * El mosaico de metricas del panel.
 *
 * Por que se rehizo (Marco, 2026-08-07): la version anterior era una pila de
 * tarjetas iguales, todas del mismo tamaño, una debajo de otra. Se lee como una
 * hoja de calculo, no como un panel: nada pesa mas que nada, el ojo no sabe
 * donde empezar y el dinero, que es lo primero que se mira, ocupaba lo mismo que
 * el ticket medio.
 *
 * Ahora hay jerarquia de verdad:
 *   - una pieza GRANDE con el dinero y su curva, que manda en la pantalla
 *   - dos ANILLOS para los porcentajes, porque un porcentaje se entiende antes
 *     viendolo lleno que leyendolo
 *   - piezas pequeñas para los conteos, con su comparacion
 *
 * Reglas que respeta:
 *   - color solo del tema: fondo, tarjeta, borde, texto y el verde de marca
 *   - esquinas 4px en pieza y 6px en panel. Cero esquinas rectas
 *   - Inter Tight, jerarquia por PESO y tamaño, nunca por otra fuente
 *   - el numero SIEMPRE escrito. En un telefono no hay raton: un dato que solo
 *     aparece al pasar por encima no existe
 *   - un porcentaje sin base es un guion, nunca un cero
 *   - movil primero: el mosaico se rehace a dos columnas, no se encoge
 */

export type Metrica = {
  clave: string
  etiqueta: string
  /** null = no se puede calcular. Se pinta un guion, jamas un cero. */
  valor: number | null
  formato: "euro" | "numero" | "porcentaje"
  delta?: { texto: string; sube: boolean } | null
  pie?: string
}

function texto(valor: number | null, formato: Metrica["formato"], eur: (n: number) => string) {
  if (valor === null) return "—"
  if (formato === "euro") return eur(valor)
  if (formato === "porcentaje") return `${Math.round(valor)}%`
  return String(Math.round(valor))
}

// ---------------------------------------------------------------------------
// Anillo de porcentaje
// ---------------------------------------------------------------------------

function Anillo({
  pct,
  etiqueta,
  pie,
  cargando,
}: {
  pct: number | null
  etiqueta: string
  pie: string
  cargando: boolean
}) {
  /* Circulo dentro de un viewBox CUADRADO: no hay deformacion posible, que fue
     el fallo de la curva que se estiro y perdio tramos. */
  const R = 42
  const CIRC = 2 * Math.PI * R
  const relleno = pct === null ? 0 : Math.max(0, Math.min(100, pct))

  return (
    <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{etiqueta}</div>
      <div className="my-2 flex items-center justify-center">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="size-24 -rotate-90" role="img" aria-label={`${etiqueta}: ${pct === null ? "sin datos" : `${pct}%`}`}>
            <circle cx="50" cy="50" r={R} fill="none" strokeWidth="8" className="stroke-muted" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - (relleno / 100) * CIRC}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold tabular-nums text-foreground">
              {cargando ? "…" : pct === null ? "—" : `${Math.round(pct)}%`}
            </span>
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{pie}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Curva del dinero, dibujada con cajas (no hay lienzo que se pueda deformar)
// ---------------------------------------------------------------------------

function Curva({
  puntos,
  eur,
}: {
  puntos: { etiqueta: string; etiquetaLarga: string; valor: number }[]
  eur: (n: number) => string
}) {
  const [activo, setActivo] = useState<number | null>(null)
  const max = Math.max(...puntos.map((p) => p.valor), 1)
  const punto = activo !== null ? puntos[activo] : null

  return (
    <div>
      <div className="flex h-20 items-end gap-px">
        {puntos.map((p, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setActivo(i)}
            onFocus={() => setActivo(i)}
            onClick={() => setActivo(activo === i ? null : i)}
            className="group flex h-full min-w-0 flex-1 flex-col justify-end"
            aria-label={`${p.etiquetaLarga}: ${eur(p.valor)}`}
          >
            <span
              className={cn(
                "block w-full rounded-sm transition-colors",
                activo === i ? "bg-primary" : "bg-primary/40",
              )}
              style={{ height: `${Math.max(2, Math.round((p.valor / max) * 100))}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between text-sm text-muted-foreground">
        <span>{puntos[0]?.etiqueta}</span>
        <span>{puntos[puntos.length - 1]?.etiqueta}</span>
      </div>
      <p className="mt-1 min-h-[1.25rem] text-sm text-foreground">
        {punto ? `${punto.etiquetaLarga}: ${eur(punto.valor)}` : ""}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pieza pequeña
// ---------------------------------------------------------------------------

function Pieza({ m, cargando, eur }: { m: Metrica; cargando: boolean; eur: (n: number) => string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{m.etiqueta}</div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {cargando ? "…" : texto(m.valor, m.formato, eur)}
      </div>
      {!cargando && m.delta ? (
        <div
          className={cn(
            "mt-1 text-sm font-semibold tabular-nums",
            m.delta.sube ? "text-primary" : "text-muted-foreground",
          )}
        >
          {m.delta.texto} vs periodo anterior
        </div>
      ) : (
        !cargando && m.pie && <div className="mt-1 text-sm text-muted-foreground">{m.pie}</div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

export function DashboardMetricas({
  titular,
  piezas,
  anillos,
  curva,
  cargando,
  eur,
}: {
  /** La pieza grande: el dinero. Manda en la pantalla. */
  titular: { etiqueta: string; valor: number; delta?: { texto: string; sube: boolean } | null; pie: string }
  piezas: Metrica[]
  anillos: { clave: string; etiqueta: string; pct: number | null; pie: string }[]
  curva: { etiqueta: string; etiquetaLarga: string; valor: number }[]
  cargando: boolean
  eur: (n: number) => string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* LA PIEZA GRANDE: el dinero, con su curva dentro. */}
      <div className="col-span-2 rounded-xl border border-border bg-card p-5 lg:col-span-2 lg:row-span-2">
        <div className="text-sm text-muted-foreground">{titular.etiqueta}</div>
        <div className="mt-1 text-[40px] font-black leading-none tracking-tight tabular-nums text-foreground sm:text-[52px]">
          {cargando ? "…" : eur(titular.valor)}
        </div>
        {!cargando && titular.delta && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
              titular.delta.sube ? "text-primary" : "text-muted-foreground",
            )}
          >
            {titular.delta.texto} vs periodo anterior
          </div>
        )}
        <div className="mt-1 text-sm text-muted-foreground">{titular.pie}</div>
        <div className="mt-4">
          {cargando ? <div className="h-20" /> : <Curva puntos={curva} eur={eur} />}
        </div>
      </div>

      {/* LOS ANILLOS: un porcentaje se entiende antes viendolo lleno. */}
      {anillos.map((a) => (
        <Anillo key={a.clave} pct={a.pct} etiqueta={a.etiqueta} pie={a.pie} cargando={cargando} />
      ))}

      {/* LAS PIEZAS PEQUEÑAS: los conteos. */}
      {piezas.map((m) => (
        <Pieza key={m.clave} m={m} cargando={cargando} eur={eur} />
      ))}
    </div>
  )
}
