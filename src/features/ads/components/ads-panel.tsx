"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ArrowDown, ArrowUp, Loader2, Minus } from "lucide-react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { cn } from "@/lib/utils"
import { metricaPorId, type Metrica } from "@/lib/meta/metricas"
import type { FilaCampana, FilaConjunto, FilaDesglose } from "@/lib/meta/panel"
import { Desglose, Embudo, ETIQUETA_PLATAFORMA, Evolucion } from "./ads-graficos"
import { ListaCampanas, pintaValor } from "./ads-campanas"
import { SelectorMetricas, leerElegidas } from "./ads-selector-metricas"
import { SelectorAlcance, type Alcance } from "./ads-selector-alcance"

/**
 * El panel de Campañas.
 *
 * Orden a propósito: primero el filtro, después los GRÁFICOS y al final la tabla. La
 * filosofía es visual primero y números después, así que lo que se ve al entrar es el
 * embudo y la evolución, no una rejilla de cifras.
 *
 * El filtro de fechas es el del OS (`PeriodFilter`) y manda sobre todo lo de abajo. Ver SOP
 * producto/58.
 */

type Respuesta =
  | {
      ok: true
      totales: Record<string, number>
      anteriores: Record<string, number>
      embudo: { impresiones: number; clicsSalientes: number; visitasWeb: number; leads: number }
      dias: { fecha: string; gasto: number; leads: number; clicsSalientes: number }[]
      campanas: FilaCampana[]
      conjuntos: FilaConjunto[]
      plataformas: FilaDesglose[]
      edades: FilaDesglose[]
      moneda: string
    }
  | { ok: false; error: string; sinPermiso: boolean }

function aFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function AdsPanel() {
  const [rango, setRango] = useState<PeriodRange | null>(null)
  const [datos, setDatos] = useState<Respuesta | null>(null)
  const [cargando, setCargando] = useState(false)
  const [elegidas, setElegidas] = useState<string[]>([])
  // Que campañas o conjuntos estan marcados. Vacio = la cuenta entera.
  const [alcance, setAlcance] = useState<Alcance>({ campanas: [], conjuntos: [] })

  // Las métricas guardadas se leen tras montar: `localStorage` no existe en el servidor y
  // leerlo en el primer pintado haría que la pantalla salte de unas columnas a otras.
  useEffect(() => {
    setElegidas(leerElegidas())
  }, [])

  useEffect(() => {
    if (!rango) return
    let cancelado = false
    setCargando(true)
    const q = new URLSearchParams({ from: aFecha(rango.from), to: aFecha(rango.to) })
    if (alcance.campanas.length) q.set("campanas", alcance.campanas.join(","))
    if (alcance.conjuntos.length) q.set("conjuntos", alcance.conjuntos.join(","))
    fetch(`/api/admin/ads/panel?${q}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelado) setDatos(j as Respuesta)
      })
      .catch(() => {
        if (!cancelado)
          setDatos({ ok: false, error: "No se pudo conectar", sinPermiso: false })
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
    // Se depende de las fechas sueltas: el objeto es nuevo en cada pintado y dispararía
    // la petición en bucle.
  }, [rango?.from.getTime(), rango?.to.getTime(), alcance.campanas.join(","), alcance.conjuntos.join(",")])

  return (
    <div className="space-y-4">
      {/* Barra de arriba: el filtro del OS y el selector de métricas */}
      <div className="flex flex-wrap items-center gap-2">
        <SelectorAlcance
          campanas={datos?.ok ? datos.campanas : []}
          conjuntos={datos?.ok ? datos.conjuntos : []}
          valor={alcance}
          onCambio={setAlcance}
        />
        <PeriodFilter value={rango ?? undefined} onChange={setRango} defaultPreset="30d" />
        <SelectorMetricas elegidas={elegidas} onCambio={setElegidas} />
        {cargando && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Trayendo datos de Meta
          </span>
        )}
      </div>

      {datos && !datos.ok && <Aviso error={datos.error} sinPermiso={datos.sinPermiso} />}

      {datos?.ok && (
        <>
          <FilaNumeros
            totales={datos.totales}
            anteriores={datos.anteriores}
            dias={datos.dias}
            elegidas={elegidas}
          />

          <Evolucion dias={datos.dias} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Embudo
              pasos={[
                { nombre: "Impresiones", valor: datos.embudo.impresiones },
                { nombre: "Clics salientes únicos", valor: datos.embudo.clicsSalientes },
                { nombre: "Cargaron la página", valor: datos.embudo.visitasWeb },
                { nombre: "Leads", valor: datos.embudo.leads },
              ]}
            />
            <Desglose
              titulo="Dónde se muestra"
              filas={datos.plataformas}
              etiqueta={(k) => ETIQUETA_PLATAFORMA[k] ?? k}
              nota={notaPlataforma(datos.plataformas)}
            />
            <Desglose
              titulo="Qué edad responde"
              filas={datos.edades}
              etiqueta={(k) => `${k} años`}
            />
          </div>

          {alcance.campanas.length > 0 ? (
            <ListaCampanas
              titulo="Conjuntos de lo que has marcado"
              campanas={datos.conjuntos.map((c) => ({
                id: c.id,
                nombre: c.nombre,
                objetivo: c.campanaNombre,
                valores: c.valores,
              }))}
              elegidas={elegidas}
            />
          ) : (
            <ListaCampanas titulo="Campañas" campanas={datos.campanas} elegidas={elegidas} />
          )}
        </>
      )}

      {!datos && !cargando && (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-card px-6 text-center">
          <p className="text-[15px] text-muted-foreground">Elige un periodo para empezar.</p>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── piezas ───────────────────────── */

/** La mejor plataforma por coste por lead, dicha en una linea. */
function notaPlataforma(filas: FilaDesglose[]): string | undefined {
  const con = filas.filter((f) => f.leads > 0).sort((a, b) => a.gasto / a.leads - b.gasto / b.leads)
  if (con.length < 2) return undefined
  const dif = con[1].gasto / con[1].leads - con[0].gasto / con[0].leads
  const nombre = ETIQUETA_PLATAFORMA[con[0].clave] ?? con[0].clave
  return `${nombre} trae el lead ${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(dif)} más barato`
}

/**
 * La fila de números grandes: cifra grande, etiqueta pequeña arriba, su mini tendencia y
 * cuánto cambió. Dos columnas en el teléfono: cuatro en 375px salen a 90 puntos y no cabe
 * una cifra de dinero con separadores.
 */
function FilaNumeros({
  totales,
  anteriores,
  dias,
  elegidas,
}: {
  totales: Record<string, number>
  anteriores: Record<string, number>
  dias: { fecha: string; gasto: number; leads: number }[]
  elegidas: string[]
}) {
  const metricas = elegidas
    .map((id) => metricaPorId(id))
    .filter((m): m is Metrica => Boolean(m))
    .slice(0, 5)

  if (metricas.length === 0) return null

  // La mini tendencia se dibuja con el dia a dia que ya tenemos. Solo hay serie diaria de
  // gasto y de leads, asi que el resto de metricas no llevan linea: mejor sin ella que
  // con una inventada.
  const serie = (id: string): number[] | null => {
    if (dias.length < 3) return null
    if (id === "spend") return dias.map((d) => d.gasto)
    if (id === "leads") return dias.map((d) => d.leads)
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {metricas.map((m, i) => {
        const ahora = totales[m.id] ?? 0
        const antes = anteriores[m.id] ?? 0
        const cambio = antes > 0 ? ((ahora - antes) / antes) * 100 : null
        // En un coste, bajar es bueno. En el resto, subir es bueno.
        const menosEsMejor = m.id.startsWith("cost_per") || m.id === "cpc" || m.id === "cpm"
        return (
          <div
            key={m.id}
            className={cn(
              "rounded-lg border p-3.5",
              i === 0 ? "border-brand/25 bg-brand/[0.06]" : "border-border bg-card"
            )}
          >
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {m.nombre}
            </p>
            <p className="mt-1.5 text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {pintaValor(ahora, m)}
            </p>
            <div className="mt-2.5 flex h-6 items-end gap-2">
              <Chispa valores={serie(m.id)} />
              <Cambio porcentaje={cambio} menosEsMejor={menosEsMejor} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Mini linea de tendencia. Se mide en porcentajes sobre un lienzo fijo. */
function Chispa({ valores }: { valores: number[] | null }) {
  if (!valores || valores.length < 3) return <span className="flex-1" />
  const tope = Math.max(...valores, 0.0001)
  const paso = 100 / (valores.length - 1)
  const d = valores.map((v, i) => `${i * paso},${24 - (v / tope) * 22}`).join(" L")
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-6 min-w-0 flex-1" aria-hidden>
      <path d={`M${d}`} fill="none" strokeWidth="1.6" vectorEffect="non-scaling-stroke"
            className="stroke-brand" />
    </svg>
  )
}

/**
 * Cuánto cambió respecto al periodo anterior. En un coste, bajar es buena noticia; en el
 * resto, subir. Sin esa distinción el panel pinta de verde una subida del coste por lead.
 */
function Cambio({
  porcentaje,
  menosEsMejor = false,
}: {
  porcentaje: number | null
  menosEsMejor?: boolean
}) {
  if (porcentaje === null) {
    return <span className="shrink-0 text-sm text-muted-foreground">nuevo</span>
  }
  const plano = Math.abs(porcentaje) < 0.5
  const sube = porcentaje > 0
  const bueno = menosEsMejor ? !sube : sube
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-sm font-semibold tabular-nums",
        plano
          ? "bg-muted/60 text-muted-foreground"
          : bueno
            ? "bg-brand/15 text-brand"
            : "bg-destructive/15 text-destructive"
      )}
    >
      {plano ? "igual" : `${sube ? "+" : "-"}${Math.abs(porcentaje).toFixed(0)}%`}
    </span>
  )
}

/**
 * Los avisos dicen QUÉ pasó y QUÉ hacer, nunca un código de error.
 */
function Aviso({ error, sinPermiso }: { error: string; sinPermiso: boolean }) {
  const faltaLlave = sinPermiso || /permission|ads_read|access_token|capability/i.test(error)
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-4 md:p-5">
      <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold text-foreground">
          {faltaLlave ? "Falta la llave para leer tus campañas" : "Meta no responde ahora mismo"}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {faltaLlave ? (
            <>
              La llave que hay sirve para mandar conversiones, no para leer lo que gastan las
              campañas. Son permisos distintos. Se pega la buena en la pestaña Ajustes, arriba
              del todo. La medición de los funnels sigue funcionando igual.
            </>
          ) : (
            <>
              No se pudo traer el gasto. Vuelve a intentarlo en unos minutos. Meta responde:{" "}
              {error}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
