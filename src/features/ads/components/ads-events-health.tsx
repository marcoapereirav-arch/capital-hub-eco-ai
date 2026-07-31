"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Check, CircleSlash, RefreshCw, Target, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * "Está midiendo o no". La pantalla que faltaba.
 *
 * Una fila por funnel y, dentro, cada evento que DEBERÍA estar disparando con la última
 * vez que llegó a Meta. Un evento que se espera y nunca llegó sale en rojo: antes eso
 * era invisible y solo se notaba cuando las campañas no optimizaban.
 */

type EventRow = {
  name: string
  when: string
  kind: "estandar" | "nuestro"
  lastAt: string | null
  lastStatus: string | null
  sent: number
  failed: number
  neverSeen: boolean
}

type FunnelRow = {
  slug: string
  label: string
  path: string
  name: string
  optimizeFor: string | null
  published: boolean
  status: string
  trackingEnabled: boolean
  healthy: boolean
  events: EventRow[]
}

function hace(iso: string | null): string {
  if (!iso) return "nunca"
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return "ahora mismo"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? "hace 1 día" : `hace ${d} días`
}

export function AdsEventsHealth() {
  const [data, setData] = useState<{ capiMode: string; funnels: FunnelRow[] } | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ads/funnels-status", { cache: "no-store" })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading && !data) {
    return (
      <div className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
        Revisando qué está midiendo…
      </div>
    )
  }

  const funnels = data?.funnels ?? []
  const enMarcha = funnels.filter((f) => f.trackingEnabled)
  const rotos = enMarcha.filter((f) => !f.healthy)

  return (
    <div className="flex flex-col gap-4">
      {/* Modo de envío: si está en prueba, NADA de lo que llega cuenta para las campañas */}
      {data?.capiMode === "test" && (
        <div className="flex items-start gap-3 rounded-sm border border-amber-500/40 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Estás en modo prueba</p>
            <p className="mt-1 text-sm text-amber-200/80">
              Meta recibe los eventos y los descarta. No optimizan tus campañas ni construyen
              audiencias. Cámbialo en Ajustes antes de gastar en anuncios.
            </p>
          </div>
        </div>
      )}

      {/* Resumen de una línea */}
      <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-card px-4 py-3">
        <span className="text-sm text-foreground">
          <strong className="font-semibold">{enMarcha.length}</strong> funnels midiendo
        </span>
        <span className="text-muted-foreground">·</span>
        <span className={cn("text-sm", rotos.length ? "text-red-400" : "text-[#4ADE80]")}>
          {rotos.length === 0
            ? "todos los eventos han llegado alguna vez"
            : `${rotos.length} con eventos que no llegan`}
        </span>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Actualizar
        </button>
      </div>

      {/* Un bloque por funnel */}
      {funnels.map((f) => (
        <section key={f.slug} className="rounded-sm border border-border bg-card">
          <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
            <Luz ok={f.healthy} apagado={!f.trackingEnabled} />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold text-foreground">{f.name}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{f.path}</p>
            </div>

            <span
              className={cn(
                "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                f.published
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
              )}
            >
              {f.published ? "Publicado" : f.status}
            </span>

            <span
              className={cn(
                "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                f.trackingEnabled
                  ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#4ADE80]"
                  : "border-border bg-secondary text-muted-foreground"
              )}
            >
              {f.trackingEnabled ? "Midiendo" : "Sin medir"}
            </span>
          </header>

          {f.optimizeFor && (
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <Target className="h-3.5 w-3.5 text-[#4ADE80]" />
              <span className="text-xs text-muted-foreground">
                La campaña de este funnel debe optimizar hacia{" "}
                <strong className="font-mono text-foreground">{f.optimizeFor}</strong>
              </span>
            </div>
          )}

          {f.events.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              Este funnel no tiene eventos asignados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Evento</th>
                    <th className="px-4 py-2 font-medium">Cuándo salta</th>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-4 py-2 font-medium">Último</th>
                    <th className="px-4 py-2 text-right font-medium">Enviados</th>
                  </tr>
                </thead>
                <tbody>
                  {f.events.map((e) => (
                    <tr key={e.name} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {e.neverSeen ? (
                            <X className="h-3.5 w-3.5 shrink-0 text-red-400" />
                          ) : e.failed > 0 ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          ) : (
                            <Check className="h-3.5 w-3.5 shrink-0 text-[#4ADE80]" />
                          )}
                          <span className="font-mono text-xs text-foreground">{e.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{e.when}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-sm border px-1.5 py-0.5 text-[10px]",
                            e.kind === "estandar"
                              ? "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#4ADE80]"
                              : "border-border bg-secondary text-muted-foreground"
                          )}
                        >
                          {e.kind === "estandar" ? "de Meta" : "nuestro"}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-xs",
                          e.neverSeen ? "text-red-400" : "text-muted-foreground"
                        )}
                      >
                        {e.neverSeen ? "nunca ha llegado" : hace(e.lastAt)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">
                        {e.sent}
                        {e.failed > 0 && <span className="ml-1 text-red-400">({e.failed} fallaron)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

function Luz({ ok, apagado }: { ok: boolean; apagado: boolean }) {
  if (apagado) {
    return (
      <span title="Sin medir">
        <CircleSlash className="h-4 w-4 shrink-0 text-muted-foreground" />
      </span>
    )
  }
  return (
    <span
      aria-hidden
      title={ok ? "Todo llega" : "Falta algún evento"}
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full",
        ok ? "bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]"
      )}
    />
  )
}
