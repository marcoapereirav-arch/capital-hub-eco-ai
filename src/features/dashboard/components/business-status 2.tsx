import { Users, TrendingUp, CalendarClock, XCircle, Award } from "lucide-react"

type StatCard = {
  label: string
  value: string | number
  hint?: string
  icon: typeof Users
}

const PLACEHOLDER_STATS: StatCard[] = [
  { label: "MRR", value: "—", hint: "Pendiente Stripe", icon: TrendingUp },
  { label: "ARR proyectado", value: "—", hint: "MRR × 12", icon: TrendingUp },
  { label: "Trials activos", value: "—", hint: "En período de 14 días", icon: CalendarClock },
  { label: "Suscripciones activas", value: "—", hint: "Mensual + anual", icon: Users },
  { label: "Cancelaciones (30d)", value: "—", hint: "Last 30 days", icon: XCircle },
  { label: "Anuales", value: "—", hint: "Plan PRO 970€/año", icon: Award },
]

const PIPELINE_PLACEHOLDER = [
  { stage: "Free Trial 14d", count: "—", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { stage: "+ Order Bump", count: "—", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { stage: "One Año (970€)", count: "—", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { stage: "One Mes (97€)", count: "—", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { stage: "Agendados", count: "—", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  { stage: "No agendados", count: "—", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  { stage: "Beta (cancelados)", count: "—", color: "bg-red-500/15 text-red-400 border-red-500/30" },
]

export function BusinessStatus() {
  return (
    <section className="space-y-4">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">📊 Estado actual</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Métricas operativas en vivo del negocio</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {PLACEHOLDER_STATS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="rounded-sm border border-border bg-card p-4 transition-colors hover:border-foreground/30"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {s.label}
                </p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
              <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{s.value}</p>
              {s.hint && (
                <p className="mt-1 text-[10px] text-muted-foreground/60">{s.hint}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* PIPELINE MINI */}
      <div className="rounded-sm border border-border bg-card p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
          Pipeline MIFGE Funnel — distribución por stage
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
          {PIPELINE_PLACEHOLDER.map((p) => (
            <div
              key={p.stage}
              className={`rounded-sm border px-3 py-2 ${p.color}`}
            >
              <p className="text-[10px] uppercase tracking-wide opacity-80">{p.stage}</p>
              <p className="font-heading text-lg font-semibold mt-0.5">{p.count}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
