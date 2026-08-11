"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart3, Settings as SettingsIcon } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { PeriodFilter, type PeriodRange } from "@/components/ui/period-filter"
import { cn } from "@/lib/utils"
import { AfiliadosDashboard } from "./afiliados-dashboard"
import { AfiliadosConfig } from "./afiliados-config"
import type { RespuestaAfiliados } from "../types"

/**
 * Afiliados: DOS pestanas.
 *
 *   Dashboard      los numeros de la seccion, con el filtro de fechas del OS
 *   Configuracion  cada afiliado y sus links, al funnel que se elija
 *
 * Marco (2026-08-07): "el link no puede ir solo a test de personalidad... yo lo quiero
 * crear directamente con cualquier funnel que yo quiera". El destino fijo que habia
 * escrito a fuego se retiro entero.
 *
 * El periodo vive AQUI y baja a las dos pestanas: un solo filtro manda sobre todo lo que
 * se ve, que es la regla del OS (`check:filtros`).
 */

type Pestana = "dashboard" | "configuracion"

const PESTANAS: { id: Pestana; etiqueta: string; icono: typeof BarChart3 }[] = [
  { id: "dashboard", etiqueta: "Dashboard", icono: BarChart3 },
  { id: "configuracion", etiqueta: "Configuración", icono: SettingsIcon },
]

export function AfiliadosPage() {
  const [pestana, setPestana] = useState<Pestana>("dashboard")
  const [rango, setRango] = useState<PeriodRange | null>(null)
  const [datos, setDatos] = useState<RespuestaAfiliados | null>(null)
  const [cargando, setCargando] = useState(true)
  const [fallo, setFallo] = useState<string | null>(null)

  // Se depende de los milisegundos, no del objeto del rango: un objeto nuevo en cada
  // pintado dispararia el efecto sin parar (error ya cometido en un grafico del OS).
  const desdeMs = rango?.from.getTime() ?? null
  const hastaMs = rango?.to.getTime() ?? null

  const cargar = useCallback(async () => {
    setFallo(null)
    const params = new URLSearchParams()
    if (desdeMs) params.set("from", new Date(desdeMs).toISOString())
    if (hastaMs) params.set("to", new Date(hastaMs).toISOString())

    try {
      const res = await fetch(`/api/admin/affiliates?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("respuesta no válida")
      setDatos((await res.json()) as RespuestaAfiliados)
    } catch {
      setFallo("No se pudieron cargar los datos de afiliados. Vuelve a intentarlo.")
    } finally {
      setCargando(false)
    }
  }, [desdeMs, hastaMs])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return (
    <PageContainer>
      {/* Tira de pestanas: 44 puntos de alto y sangrada al borde en telefono. */}
      <div className="-mx-4 flex snap-x items-center gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
        {PESTANAS.map((p) => {
          const Icono = p.icono
          const activa = pestana === p.id
          return (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className={cn(
                "flex h-11 shrink-0 snap-start items-center gap-1.5 border-b-2 px-3 text-[15px] whitespace-nowrap transition-colors md:h-10 md:text-sm",
                activa
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground active:text-foreground",
              )}
            >
              <Icono className="h-4 w-4" aria-hidden />
              {p.etiqueta}
            </button>
          )
        })}
      </div>

      {/* Cabecera de la pestana + filtro de fechas */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-foreground">
            {pestana === "dashboard" ? "Los números de afiliados" : "Tus afiliados y sus links"}
          </h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {pestana === "dashboard"
              ? "Quién te trae gente, por qué funnel entra y cuánto dinero deja."
              : "Cada persona con sus links. Tú eliges a qué funnel manda cada uno."}
          </p>
        </div>
        <PeriodFilter
          value={rango ?? undefined}
          onChange={setRango}
          defaultPreset="30d"
          className="shrink-0"
        />
      </div>

      {cargando && !datos ? (
        <LoadingScreen fullscreen={false} className="min-h-[240px] rounded-xl" />
      ) : fallo ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <h3 className="text-[17px] font-semibold text-foreground">No se pudieron cargar</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">{fallo}</p>
          <button
            onClick={() => void cargar()}
            className="h-11 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90"
          >
            Volver a intentar
          </button>
        </div>
      ) : datos ? (
        pestana === "dashboard" ? (
          <AfiliadosDashboard
            datos={datos}
            desde={rango?.from ?? null}
            hasta={rango?.to ?? null}
          />
        ) : (
          <AfiliadosConfig
            afiliados={datos.afiliados}
            funnels={datos.funnels}
            onCambio={cargar}
          />
        )
      ) : null}
    </PageContainer>
  )
}
