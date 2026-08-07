"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ArrowDown, ArrowUp, Loader2, Minus } from "lucide-react"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { cn } from "@/lib/utils"
import { metricaPorId, type Metrica } from "@/lib/meta/metricas"
import type { FilaCampana } from "@/lib/meta/panel"
import { ComparativaCampanas, Embudo, EvolucionDiaria } from "./ads-graficos"
import { ListaCampanas, pintaValor } from "./ads-campanas"
import { SelectorMetricas, leerElegidas } from "./ads-selector-metricas"

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

  // Las métricas guardadas se leen tras montar: `localStorage` no existe en el servidor y
  // leerlo en el primer pintado haría que la pantalla salte de unas columnas a otras.
  useEffect(() => {
    setElegidas(leerElegidas())
  }, [])

  useEffect(() => {
    if (!rango) return
    let cancelado = false
    setCargando(true)
    fetch(`/api/admin/ads/panel?from=${aFecha(rango.from)}&to=${aFecha(rango.to)}`)
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
  }, [rango?.from.getTime(), rango?.to.getTime()])

  return (
    <div className="space-y-4">
      {/* Barra de arriba: el filtro del OS y el selector de métricas */}
      <div className="flex flex-wrap items-center gap-2">
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
            elegidas={elegidas}
            etiquetaPeriodo={rango?.label ?? ""}
          />

          <Embudo
            pasos={[
              {
                nombre: "Vieron el anuncio",
                valor: datos.embudo.impresiones,
                explica: "Veces que se mostró, no personas distintas.",
              },
              {
                nombre: "Salieron hacia la web",
                valor: datos.embudo.clicsSalientes,
                explica: "Personas distintas que hicieron clic y salieron de Facebook.",
              },
              {
                nombre: "Llegaron a cargar la página",
                valor: datos.embudo.visitasWeb,
                explica:
                  "De los que salieron, cuántos esperaron a que la página cargara. La diferencia con el paso anterior es gente que se fue antes de ver nada.",
              },
              {
                nombre: "Dejaron sus datos",
                valor: datos.embudo.leads,
                explica: "Rellenaron el formulario. Es el resultado que buscan tus campañas.",
              },
            ]}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <EvolucionDiaria dias={datos.dias} />
            <ComparativaCampanas
              campanas={datos.campanas.map((c) => ({
                nombre: c.nombre,
                gasto: c.valores.spend ?? 0,
                leads: c.valores.leads ?? 0,
                costePorLead: c.valores.costePorLead ?? 0,
              }))}
            />
          </div>

          <ListaCampanas campanas={datos.campanas} elegidas={elegidas} />
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

/**
 * La fila de números grandes, con la flecha de cuánto cambió respecto al periodo anterior.
 * Dos columnas en el teléfono: cuatro en 375px salen a 90 puntos y no cabe una cifra de
 * dinero con separadores.
 */
function FilaNumeros({
  totales,
  anteriores,
  elegidas,
  etiquetaPeriodo,
}: {
  totales: Record<string, number>
  anteriores: Record<string, number>
  elegidas: string[]
  etiquetaPeriodo: string
}) {
  // Solo los seis primeros: una fila de números no es la tabla. El resto se ve por campaña.
  const metricas = elegidas
    .map((id) => metricaPorId(id))
    .filter((m): m is Metrica => Boolean(m))
    .slice(0, 6)

  if (metricas.length === 0) return null

  return (
    <section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {metricas.map((m) => {
          const ahora = totales[m.id] ?? 0
          const antes = anteriores[m.id] ?? 0
          const cambio = antes > 0 ? ((ahora - antes) / antes) * 100 : null
          return (
            <div key={m.id} className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-muted-foreground">{m.nombre}</p>
              <p className="mt-1 text-2xl font-semibold leading-none text-foreground tabular-nums">
                {pintaValor(ahora, m)}
              </p>
              <Cambio porcentaje={cambio} />
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {etiquetaPeriodo}. Las flechas comparan con el periodo justo anterior y del mismo
        tamaño.
      </p>
    </section>
  )
}

function Cambio({ porcentaje }: { porcentaje: number | null }) {
  if (porcentaje === null) {
    return (
      <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        sin dato anterior
      </p>
    )
  }
  const sube = porcentaje > 0
  const plano = Math.abs(porcentaje) < 0.5
  return (
    <p
      className={cn(
        "mt-1.5 flex items-center gap-1 text-sm tabular-nums",
        plano ? "text-muted-foreground" : sube ? "text-brand" : "text-destructive"
      )}
    >
      {plano ? (
        <Minus className="h-3.5 w-3.5" />
      ) : sube ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )}
      {plano ? "igual" : `${Math.abs(porcentaje).toFixed(0)}%`}
    </p>
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
