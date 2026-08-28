"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { CAMPOS_PARTE, type BarraDia, type CampoParte, type DiaHistorial } from "../types"
import { diaDelMes, fechaCorta, fechaLarga, hora } from "../formato"

/**
 * Actividad dia a dia.
 *
 * Un dibujo codifica UNA sola cosa (brandkit, seccion 8 bis): aqui, la metrica elegida.
 * Por eso hay un selector de las cuatro y NO una barra apilada: conversaciones, ofertas y
 * agendadas se solapan entre si, y sumarlas daria un total que no significa nada. Entre
 * PERSONAS si se suma: son conversaciones distintas.
 *
 * Una barra = UN dia. Con dos personas salian antes dos barras rotuladas igual, pegadas,
 * sin forma de saber cual era cual.
 *
 * Se mide el hueco real y se dibuja en pixeles, con `viewBox` igual al tamaño medido. La
 * medida entra por REF DE FUNCION porque el componente puede devolver `null` mientras
 * cargan los datos: un `useLayoutEffect` con lista vacia mediria cero y el grafico se
 * quedaria en blanco para siempre (fallo ya cometido en el panel de Ads).
 *
 * En el telefono el grafico se REHACE, no se encoge: barras horizontales con el numero al
 * final, porque a 375 puntos las etiquetas de un eje de abajo no caben.
 */

const ALTO_ESCRITORIO = 250
const ALTO_FILA_MOVIL = 32

/** Escala redondeada. Un eje que dice "5,33" es un maximo partido en tres, no una escala. */
function escalaRedonda(max: number): number {
  if (max <= 0) return 1
  const pasos = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]
  for (const p of pasos) if (max <= p) return p
  const exp = Math.floor(Math.log10(max))
  const base = Math.pow(10, exp)
  for (const m of [1, 2, 5, 10]) if (max <= m * base) return m * base
  return 10 * base
}

export function ActividadGrafico({
  barras,
  campo,
  onCampo,
  onAbrirDia,
}: {
  /** De mas antiguo a mas reciente. Una por dia. */
  barras: BarraDia[]
  campo: CampoParte
  onCampo: (c: CampoParte) => void
  onAbrirDia: (dia: DiaHistorial) => void
}) {
  const [ancho, setAncho] = useState(0)
  const [sobre, setSobre] = useState<string | null>(null)

  /* Ref de funcion: se dispara justo cuando el hueco aparece en la pagina. */
  const medir = useCallback((nodo: HTMLDivElement | null) => {
    if (!nodo) return
    setAncho(nodo.getBoundingClientRect().width)
    const observador = new ResizeObserver((entradas) => {
      const w = entradas[0]?.contentRect.width ?? 0
      if (w > 0) setAncho(w)
    })
    observador.observe(nodo)
  }, [])

  /* Al cambiar de metrica o de periodo, la ficha flotante deja de tener sentido. */
  useEffect(() => setSobre(null), [campo, barras])

  const etiqueta = CAMPOS_PARTE.find((c) => c.clave === campo)
  const maximoReal = Math.max(0, ...barras.map((b) => (b.registrado ? b.valor : 0)))
  const tope = escalaRedonda(maximoReal)
  const mejor = maximoReal > 0 ? barras.find((b) => b.registrado && b.valor === maximoReal) : undefined
  const barraSobre = sobre ? barras.find((b) => b.fecha === sobre) : undefined

  const esAncho = ancho >= 620
  const n = Math.max(1, barras.length)

  /* Un dia con UN solo parte se abre de un toque. Con varios no se elige por el usuario:
     se dice quien hay y se manda a la lista, que si distingue por persona. */
  function abrir(b: BarraDia) {
    if (b.partes.length === 1) onAbrirDia(b.partes[0])
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-foreground">Actividad día a día</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {etiqueta?.etiqueta}. Toca un día para ver quién lo registró y qué cambió.
          </p>
        </div>
      </div>

      {/* Selector de metrica. Una tira que se desliza en telefono, con media ficha
          asomando para que se vea que hay mas. */}
      <div className="-mx-0 flex snap-x gap-1.5 overflow-x-auto border-b border-border px-4 py-3 md:px-5">
        {CAMPOS_PARTE.map((c) => (
          <button
            key={c.clave}
            type="button"
            onClick={() => onCampo(c.clave)}
            className={cn(
              "h-11 shrink-0 snap-start rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-colors md:h-9",
              campo === c.clave
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {c.corto}
          </button>
        ))}
      </div>

      <div className="relative p-4 md:p-5">
        {/* La ficha flotante: dice en palabras normales que es ese dia. */}
        <div className="mb-3 rounded-lg border border-border bg-popover px-3 py-2 text-sm" aria-live="polite">
          {barraSobre ? (
            barraSobre.registrado ? (
              <span className="text-foreground">
                <span className="font-semibold first-letter:uppercase">{fechaLarga(barraSobre.fecha)}</span>
                {": "}
                {barraSobre.valor} {etiqueta?.corto.toLowerCase()}
                {barraSobre.partes.length === 1 ? (
                  <>
                    . Lo registró {barraSobre.partes[0].creadoPor ?? "alguien del equipo"} a las{" "}
                    {hora(barraSobre.partes[0].creadoEl)}
                    {barraSobre.partes[0].correcciones > 0 ? ", y se corrigió después." : "."}
                  </>
                ) : (
                  <>
                    {" entre "}
                    {barraSobre.partes.length} personas:{" "}
                    {barraSobre.partes.map((p) => `${p.persona} ${p[campo]}`).join(" · ")}.
                  </>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground first-letter:uppercase">
                  {fechaLarga(barraSobre.fecha)}
                </span>
                {": "}nadie registró actividad ese día.
              </span>
            )
          ) : (
            <span className="text-muted-foreground">
              Toca un día para abrir su ficha. En el ordenador, pasa el cursor para leerlo en palabras.
            </span>
          )}
        </div>

        <div ref={medir} className="w-full">
          {ancho > 0 && (esAncho ? dibujoAncho() : dibujoEstrecho())}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Eje de abajo: los días del periodo, del más antiguo al más reciente. Eje de la
          izquierda: {etiqueta?.corto.toLowerCase()}, de 0 a {tope}. Un día sin registrar sale
          como una raya, no como un cero.
        </p>
      </div>
    </section>
  )

  // ---------------------------------------------------------------------------
  // ESCRITORIO: barras verticales, el numero encima
  // ---------------------------------------------------------------------------
  function dibujoAncho() {
    const izq = 42
    const der = 8
    const arriba = 30
    const abajo = 38
    const alto = ALTO_ESCRITORIO
    const util = alto - arriba - abajo
    const banda = (ancho - izq - der) / n
    const grosor = Math.max(4, Math.min(34, banda * 0.7))
    /* Cada cuantas etiquetas de dia se escribe una, para que no se pisen. */
    const saltoEtiqueta = Math.max(1, Math.ceil(n / Math.max(1, Math.floor((ancho - izq - der) / 34))))

    return (
      <svg
        width={ancho}
        height={alto}
        viewBox={`0 0 ${ancho} ${alto}`}
        role="img"
        aria-label={`${etiqueta?.etiqueta} por día, de 0 a ${tope}`}
      >
        <defs>
          <linearGradient id="parte-barra-fuerte" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="parte-barra-suave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.42" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {/* El eje de la izquierda es TEXTO FLOTANDO. Cero rejilla y cero raya de eje. */}
        {[tope, tope / 2, 0].map((v) => (
          <text
            key={v}
            x={izq - 8}
            y={arriba + util - (v / tope) * util + 4}
            textAnchor="end"
            className="fill-muted-foreground text-sm tabular-nums"
          >
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </text>
        ))}

        {barras.map((d, i) => {
          const v = d.registrado ? d.valor : 0
          const h = tope > 0 ? (v / tope) * util : 0
          const x = izq + i * banda + (banda - grosor) / 2
          const y = arriba + util - h
          const esMejor = mejor?.fecha === d.fecha
          const activo = sobre === d.fecha

          return (
            <g
              key={d.fecha}
              onMouseEnter={() => setSobre(d.fecha)}
              onMouseLeave={() => setSobre(null)}
              onClick={() => abrir(d)}
              className={d.partes.length === 1 ? "cursor-pointer" : undefined}
            >
              {/* Banda invisible: agranda la zona que responde al puntero. */}
              <rect x={izq + i * banda} y={arriba} width={banda} height={util + 10} fill="transparent" />

              {d.registrado ? (
                h > 0 ? (
                  <rect
                    x={x}
                    y={y}
                    width={grosor}
                    height={h}
                    rx={3}
                    fill={esMejor ? "url(#parte-barra-fuerte)" : "url(#parte-barra-suave)"}
                    stroke={activo ? "var(--color-brand)" : "transparent"}
                    strokeWidth={1}
                  />
                ) : (
                  /* Registrado pero en cero: una raya llena, que es distinto de no registrar. */
                  <rect x={x} y={arriba + util - 2} width={grosor} height={2} rx={1} fill="var(--color-brand)" opacity={0.5} />
                )
              ) : (
                <rect x={x} y={arriba + util - 1} width={grosor} height={1} fill="var(--color-border)" />
              )}

              {/* El numero, siempre escrito. Un dia sin parte lleva un guion, no un cero. */}
              <text
                x={izq + i * banda + banda / 2}
                y={d.registrado ? Math.min(y - 6, arriba + util - 6) : arriba + util - 8}
                textAnchor="middle"
                className={cn(
                  "text-sm tabular-nums",
                  d.registrado ? (esMejor ? "fill-foreground font-semibold" : "fill-muted-foreground") : "fill-muted-foreground",
                )}
              >
                {d.registrado ? v : "-"}
              </text>

              {i % saltoEtiqueta === 0 && (
                <text
                  x={izq + i * banda + banda / 2}
                  y={alto - 14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-sm tabular-nums"
                >
                  {diaDelMes(d.fecha)}
                </text>
              )}
            </g>
          )
        })}

        <text x={izq} y={alto - 2} className="fill-muted-foreground text-sm">
          Día del mes
        </text>
      </svg>
    )
  }

  // ---------------------------------------------------------------------------
  // TELEFONO: barras horizontales, el numero al final
  // ---------------------------------------------------------------------------
  function dibujoEstrecho() {
    const izq = 76
    const der = 40
    const alto = n * ALTO_FILA_MOVIL + 8
    const largo = Math.max(10, ancho - izq - der)

    return (
      <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={etiqueta?.etiqueta}>
        <defs>
          <linearGradient id="parte-barra-h-fuerte" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="parte-barra-h-suave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {barras.map((d, i) => {
          const v = d.registrado ? d.valor : 0
          const w = tope > 0 ? (v / tope) * largo : 0
          const y = i * ALTO_FILA_MOVIL + 4
          const grosor = ALTO_FILA_MOVIL * 0.62
          const esMejor = mejor?.fecha === d.fecha

          return (
            <g key={d.fecha} onClick={() => abrir(d)} className={d.partes.length === 1 ? "cursor-pointer" : undefined}>
              <rect x={0} y={y} width={ancho} height={ALTO_FILA_MOVIL} fill="transparent" />
              <text x={0} y={y + grosor / 2 + 5} className="fill-muted-foreground text-sm">
                {fechaCorta(d.fecha)}
              </text>
              {d.registrado ? (
                w > 1 ? (
                  <rect
                    x={izq}
                    y={y}
                    width={w}
                    height={grosor}
                    rx={3}
                    fill={esMejor ? "url(#parte-barra-h-fuerte)" : "url(#parte-barra-h-suave)"}
                  />
                ) : (
                  <rect x={izq} y={y + grosor / 2 - 1} width={3} height={2} rx={1} fill="var(--color-brand)" opacity={0.5} />
                )
              ) : (
                <rect x={izq} y={y + grosor / 2} width={largo} height={1} fill="var(--color-border)" />
              )}
              <text
                x={izq + (d.registrado ? Math.max(w, 4) : largo) + 6}
                y={y + grosor / 2 + 5}
                className={cn(
                  "text-sm tabular-nums",
                  esMejor ? "fill-foreground font-semibold" : "fill-muted-foreground",
                )}
              >
                {d.registrado ? v : "-"}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }
}
