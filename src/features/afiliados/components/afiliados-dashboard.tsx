"use client"

import { useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { BarrasHorizontales, type Barra } from "./barras"
import { euros, type Afiliado, type DiaDeLaSerie, type RespuestaAfiliados } from "../types"

/**
 * Pestana DASHBOARD: los numeros exactos de Afiliados.
 *
 * Todo lo de esta pantalla obedece al filtro de fechas del OS, que vive en la pagina y se
 * pasa hacia abajo. Aqui no se fabrica ningun periodo propio (candado `check:filtros`).
 *
 * De donde sale cada cosa:
 *  · Visitas   · quien abrio el link, aunque el funnel no tenga formulario.
 *  · Contactos · quien dejo sus datos, por fecha de alta.
 *  · Ingresos  · las ventas registradas DENTRO del periodo, no el acumulado del contacto.
 */

type MetricaRanking = "contactos" | "alumnos" | "ingresos" | "visitas"

const METRICAS: { id: MetricaRanking; etiqueta: string; unidad: string }[] = [
  { id: "contactos", etiqueta: "Personas", unidad: "personas" },
  { id: "alumnos", etiqueta: "Alumnos", unidad: "alumnos" },
  { id: "ingresos", etiqueta: "Ingresos", unidad: "euros" },
  { id: "visitas", etiqueta: "Visitas", unidad: "visitas" },
]

export function AfiliadosDashboard({
  datos,
  desde,
  hasta,
}: {
  datos: RespuestaAfiliados
  desde: Date | null
  hasta: Date | null
}) {
  const [metrica, setMetrica] = useState<MetricaRanking>("contactos")

  const { totales, afiliados } = datos
  const conversion = totales.contactos > 0 ? (totales.alumnos / totales.contactos) * 100 : 0

  const barrasRanking: Barra[] = afiliados
    .filter((a) => a.stats.contactos > 0 || a.stats.visitas > 0)
    .map((a) => ({
      clave: a.slug,
      etiqueta: a.name,
      valor: a.stats[metrica],
      detalle: detalleDeAfiliado(a),
    }))

  const barrasFunnel: Barra[] = useMemo(() => {
    const acumulado = new Map<string, { etiqueta: string; valor: number }>()
    for (const a of afiliados) {
      for (const f of a.porFunnel) {
        const actual = acumulado.get(f.funnelSlug) ?? { etiqueta: f.funnelLabel, valor: 0 }
        actual.valor += f.stats[metrica]
        acumulado.set(f.funnelSlug, actual)
      }
    }
    return [...acumulado.entries()].map(([clave, v]) => ({ clave, ...v }))
  }, [afiliados, metrica])

  const barrasEvolucion = useMemo(
    () => agruparSerie(datos.serie, desde, hasta, metrica),
    [datos.serie, desde, hasta, metrica],
  )

  // Links creados que no han traido a nadie: o estan rotos o no se han repartido.
  const linksSinNadie = afiliados.flatMap((a) =>
    a.links
      .filter((l) => l.stats.visitas === 0 && l.stats.contactos === 0)
      .map((l) => ({ afiliado: a.name, funnel: l.funnelLabel })),
  )

  const unidad = METRICAS.find((m) => m.id === metrica)!.unidad
  const formato = metrica === "ingresos" ? euros : (n: number) => n.toLocaleString("es-ES")

  return (
    <div className="space-y-4">
      {/* Fila de numeros. Dos columnas en telefono, cinco en monitor. */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Numero etiqueta="Visitas al link" valor={totales.visitas.toLocaleString("es-ES")} />
        <Numero etiqueta="Personas traídas" valor={totales.contactos.toLocaleString("es-ES")} />
        <Numero etiqueta="Agendaron" valor={totales.agendados.toLocaleString("es-ES")} />
        <Numero etiqueta="Alumnos" valor={totales.alumnos.toLocaleString("es-ES")} destacado />
        {/* Ingresos ocupa la fila entera en el telefono: si no, queda solo en la ultima
            fila con un hueco al lado, y el dinero es lo que mas se mira. */}
        <Numero
          etiqueta="Ingresos"
          valor={euros(totales.ingresos)}
          destacado
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* La cadena: de la visita al alumno, con lo que se pierde en cada paso. */}
      <Cadena
        pasos={[
          { nombre: "Abrieron el link", valor: totales.visitas },
          { nombre: "Dejaron sus datos", valor: totales.contactos },
          { nombre: "Agendaron una llamada", valor: totales.agendados },
          { nombre: "Compraron", valor: totales.alumnos },
        ]}
        conversion={conversion}
      />

      {/* Que se mide en los tres graficos de abajo. No es un filtro de fechas. */}
      <div className="-mx-4 flex snap-x gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        {METRICAS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMetrica(m.id)}
            className={cn(
              "h-11 shrink-0 snap-start rounded-lg px-3 text-[15px] whitespace-nowrap transition-colors md:h-9 md:text-sm",
              metrica === m.id
                ? "bg-primary font-semibold text-primary-foreground"
                : "border border-border bg-card text-muted-foreground active:bg-muted",
            )}
          >
            {m.etiqueta}
          </button>
        ))}
      </div>

      <BarrasHorizontales
        titulo="Quién trae más"
        barras={barrasRanking}
        unidad={unidad}
        formato={formato}
        vacio="Todavía no ha entrado nadie por un link de afiliado en este periodo."
      />

      <BarrasHorizontales
        titulo="Por qué funnel entran"
        barras={barrasFunnel}
        unidad={unidad}
        formato={formato}
        vacio="Sin datos por funnel en este periodo."
      />

      <BarrasHorizontales
        titulo="Cómo va en el tiempo"
        barras={barrasEvolucion}
        unidad={unidad}
        formato={formato}
        mantenerOrden
        vacio="Sin movimiento en este periodo."
      />

      {linksSinNadie.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold text-foreground">
                {linksSinNadie.length === 1
                  ? "Hay 1 link que no ha traído a nadie"
                  : `Hay ${linksSinNadie.length} links que no han traído a nadie`}
              </h3>
              <p className="mt-1 text-[15px] text-muted-foreground">
                Ni una visita en este periodo. O no se ha repartido todavía, o el enlace que
                tiene esa persona no es el correcto.
              </p>
              <ul className="mt-2 space-y-1">
                {linksSinNadie.slice(0, 10).map((l, i) => (
                  <li key={i} className="text-[15px] text-foreground">
                    {l.afiliado} <span className="text-muted-foreground">· {l.funnel}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function detalleDeAfiliado(a: Afiliado): string {
  const partes: string[] = []
  if (a.stats.alumnos > 0) partes.push(`${a.stats.alumnos} alumnos`)
  if (a.stats.ingresos > 0) partes.push(euros(a.stats.ingresos))
  if (a.stats.enJuego > 0) partes.push(`${a.stats.enJuego} en seguimiento`)
  return partes.join(" · ")
}

function Numero({
  etiqueta,
  valor,
  destacado = false,
  className,
}: {
  etiqueta: string
  valor: string
  destacado?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border p-3",
        destacado ? "bg-secondary" : "bg-card",
        className,
      )}
    >
      <p className="text-2xl font-semibold tabular-nums text-foreground">{valor}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{etiqueta}</p>
    </div>
  )
}

/**
 * La cadena de la visita al alumno. Cada paso con su numero escrito y cuanta gente se
 * queda por el camino, dibujado DENTRO y no contado aparte.
 */
function Cadena({
  pasos,
  conversion,
}: {
  pasos: { nombre: string; valor: number }[]
  conversion: number
}) {
  const arranque = Math.max(pasos[0]?.valor ?? 0, 1)

  return (
    <section className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[17px] font-semibold text-foreground">De la visita al alumno</h3>
        <p className="text-sm text-muted-foreground">
          Compra el{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {conversion.toFixed(1).replace(".", ",")}%
          </span>{" "}
          de quien deja sus datos
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {pasos.map((p, i) => {
          const anterior = i > 0 ? pasos[i - 1].valor : null
          const perdidos = anterior !== null ? anterior - p.valor : 0
          return (
            <li key={p.nombre}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                  {p.nombre}
                </span>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums text-foreground">
                  {p.valor.toLocaleString("es-ES")}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-lg bg-muted">
                <div
                  className="h-full rounded-lg bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.max((p.valor / arranque) * 100, p.valor > 0 ? 3 : 0)}%` }}
                />
              </div>
              {perdidos > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Aquí se quedan{" "}
                  <span className="tabular-nums font-semibold text-foreground">{perdidos}</span>
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * Agrupa la serie de dias en 7 tramos como mucho.
 *
 * En un telefono, treinta barras no son un grafico: son una raya, y no cabe el numero de
 * cada una. Siete tramos si caben con su cifra escrita, que es la regla del brandkit.
 */
const TRAMOS = 7

function agruparSerie(
  serie: DiaDeLaSerie[],
  desde: Date | null,
  hasta: Date | null,
  metrica: MetricaRanking,
): Barra[] {
  if (!serie.length) return []

  const dias = serie.map((d) => d.fecha).sort()
  const inicio = desde ? new Date(desde) : new Date(dias[0])
  const fin = hasta ? new Date(hasta) : new Date(dias[dias.length - 1])

  const msTotal = Math.max(fin.getTime() - inicio.getTime(), 1)
  const tramos = Math.min(TRAMOS, Math.max(1, Math.ceil(msTotal / (24 * 60 * 60 * 1000))))
  const anchoTramo = msTotal / tramos

  const cubos = Array.from({ length: tramos }, (_, i) => ({
    inicio: new Date(inicio.getTime() + i * anchoTramo),
    fin: new Date(inicio.getTime() + (i + 1) * anchoTramo),
    valor: 0,
  }))

  for (const dia of serie) {
    const t = new Date(dia.fecha + "T12:00:00").getTime()
    let indice = Math.floor((t - inicio.getTime()) / anchoTramo)
    if (indice < 0) indice = 0
    if (indice >= tramos) indice = tramos - 1
    const cubo = cubos[indice]
    if (metrica === "ingresos") cubo.valor += dia.ingresos
    else if (metrica === "alumnos") cubo.valor += dia.alumnos
    else cubo.valor += dia.contactos
  }

  return cubos.map((c, i) => ({
    clave: `tramo-${i}`,
    etiqueta: etiquetaDeTramo(c.inicio, c.fin),
    valor: c.valor,
  }))
}

function etiquetaDeTramo(inicio: Date, fin: Date): string {
  const corto = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
  const finReal = new Date(fin.getTime() - 1)
  const a = corto(inicio)
  const b = corto(finReal)
  return a === b ? a : `${a} a ${b}`
}
