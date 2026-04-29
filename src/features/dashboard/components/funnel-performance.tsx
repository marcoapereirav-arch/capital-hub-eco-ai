import { Target, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type KPI = {
  label: string
  proyeccion: number
  objetivo: number
  actual: number | null  // null = sin datos aún
  notas?: string
}

// KPIs aterrizadas en el meeting del 27-abr
const KPIS: KPI[] = [
  {
    label: "Visita landing → Free Trial",
    proyeccion: 15,
    objetivo: 30,
    actual: null,
    notas: "Ratio de conversión de la landing",
  },
  {
    label: "Free Trial → Order Bump",
    proyeccion: 15,
    objetivo: 30,
    actual: null,
    notas: "% que añade el bonus 20€",
  },
  {
    label: "Free Trial → Plan Anual (970€)",
    proyeccion: 2,
    objetivo: 5,
    actual: null,
    notas: "Upsell 1 — el SLO grande",
  },
  {
    label: "Free Trial → Agenda llamada",
    proyeccion: 50,
    objetivo: 70,
    actual: null,
    notas: "% que agenda la llamada con Adrián",
  },
  {
    label: "Free Trial → One Año (sin cancelar)",
    proyeccion: 40,
    objetivo: 60,
    actual: null,
    notas: "% que NO cancela en los 14 días",
  },
]

function getStatusIcon(actual: number | null, objetivo: number, proyeccion: number) {
  if (actual === null) return null
  if (actual >= objetivo) return <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
  if (actual < proyeccion) return <AlertCircle className="h-3.5 w-3.5 text-red-400" />
  return <Target className="h-3.5 w-3.5 text-amber-400" />
}

function getBarColor(actual: number | null, objetivo: number, proyeccion: number) {
  if (actual === null) return "bg-zinc-700"
  if (actual >= objetivo) return "bg-green-500"
  if (actual < proyeccion) return "bg-red-500"
  return "bg-amber-500"
}

export function FunnelPerformance() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">🎯 Performance del funnel</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            KPIs definidas en daily 27-abr — proyección, objetivo y valor actual
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {KPIS.map((kpi) => {
          // Escala visual: el objetivo es el 100% de la barra (lo más alto que esperamos)
          const scaleMax = Math.max(kpi.objetivo * 1.2, 100)
          const proyPct = (kpi.proyeccion / scaleMax) * 100
          const objPct = (kpi.objetivo / scaleMax) * 100
          const actualPct = kpi.actual !== null ? Math.min((kpi.actual / scaleMax) * 100, 100) : 0
          const statusIcon = getStatusIcon(kpi.actual, kpi.objetivo, kpi.proyeccion)
          const barColor = getBarColor(kpi.actual, kpi.objetivo, kpi.proyeccion)

          return (
            <article
              key={kpi.label}
              className="rounded-sm border border-border bg-card p-4 transition-colors hover:border-foreground/30"
            >
              <header className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-sm font-semibold text-foreground">{kpi.label}</h3>
                  {kpi.notas && (
                    <p className="mt-0.5 text-xs text-muted-foreground/70">{kpi.notas}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
                  {statusIcon}
                  <span className={kpi.actual === null ? "text-muted-foreground/40" : "text-foreground"}>
                    {kpi.actual !== null ? `${kpi.actual}%` : "— %"}
                  </span>
                </div>
              </header>

              {/* BARRA con marcadores de proyección y objetivo */}
              <div className="relative h-6 w-full overflow-visible rounded-sm bg-secondary/40">
                {/* Barra de actual */}
                <div
                  className={cn("absolute left-0 top-0 h-full transition-all", barColor)}
                  style={{ width: `${actualPct}%` }}
                />
                {/* Marker proyección */}
                <div
                  className="absolute top-0 h-full w-px bg-zinc-400/60"
                  style={{ left: `${proyPct}%` }}
                  title={`Proyección: ${kpi.proyeccion}%`}
                />
                {/* Marker objetivo */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground"
                  style={{ left: `${objPct}%` }}
                  title={`Objetivo: ${kpi.objetivo}%`}
                />
              </div>

              {/* Footer con valores */}
              <footer className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                <span>
                  Proyección <span className="text-zinc-300">{kpi.proyeccion}%</span>
                </span>
                <span>
                  Objetivo <span className="text-foreground">{kpi.objetivo}%</span>
                </span>
                <span>
                  Actual{" "}
                  <span className={kpi.actual === null ? "text-muted-foreground/40" : "text-foreground"}>
                    {kpi.actual !== null ? `${kpi.actual}%` : "—"}
                  </span>
                </span>
              </footer>
            </article>
          )
        })}
      </div>

      {/* GOAL */}
      <div className="rounded-sm border border-dashed border-border bg-card/50 p-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">Goal final</p>
        <p className="mt-1 font-heading text-lg font-semibold text-foreground">
          Invertir 1.000€/día en publicidad alcanzando todos los objetivos
        </p>
      </div>
    </section>
  )
}
