"use client"

import { useEffect, useState } from "react"
import { Zap, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock, Loader2, RefreshCcw, XCircle } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { cn } from "@/lib/utils"

type Automation = {
  id: string
  category: string
  label: string
  description: string
  trigger: string
  actions: string[]
  relatedTables: string[]
  status: "live" | "pending" | "idle" | "error"
  statusReason: string
  lastRun: string | null
  lastRunHoursAgo: number | null
  totalExecutions: number | null
}

type Summary = { total: number; live: number; pending: number; idle: number; error: number }

const STATUS_META: Record<Automation["status"], { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  live: { label: "Activa", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/[0.06]", border: "border-green-500/30" },
  pending: { label: "Pendiente", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/[0.06]", border: "border-amber-500/30" },
  idle: { label: "Inactiva", icon: Clock, color: "text-muted-foreground", bg: "bg-card/30", border: "border-border" },
  error: { label: "Fallando", icon: XCircle, color: "text-red-400", bg: "bg-red-500/[0.06]", border: "border-red-500/30" },
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  calendario: { label: "Calendario", color: "text-cyan-400" },
  ventas: { label: "Ventas", color: "text-green-400" },
  alumno: { label: "Alumno", color: "text-blue-400" },
  email: { label: "Email", color: "text-violet-400" },
  crm: { label: "CRM", color: "text-amber-400" },
  operacion: { label: "Operación", color: "text-muted-foreground" },
}

export function AutomatizacionesPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  async function load() {
    try {
      const data = await fetch("/api/admin/automations").then((r) => r.json())
      setAutomations(data.automations ?? [])
      setSummary(data.summary ?? null)
      setGeneratedAt(data.generated_at ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Vivo: refresca cada 30 segundos sin tener que pulsar nada.
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const groupedByCategory = automations.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {} as Record<string, Automation[]>)

  return (
    <>
      <ShellHeader title="Automatizaciones" />

      <PageContainer>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h1 className="text-lg font-semibold">Automatizaciones del OS</h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Vista en vivo de todas las automatizaciones que el sistema ejecuta sin intervención humana.
              Solo lectura: para crear/editar una automatización hay que codearla (cron, endpoint o webhook).
              Se actualiza automáticamente cada 30 segundos.
            </p>
          </div>
          <button onClick={() => load()} className="shrink-0 rounded-sm border border-border px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider hover:bg-card flex items-center gap-1.5">
            <RefreshCcw className="h-3 w-3" /> Refrescar
          </button>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <SummaryCard label="Total" value={summary.total} active={false} />
            <SummaryCard label="Activas" value={summary.live} active color="text-green-400" />
            <SummaryCard label="Pendientes" value={summary.pending} active color="text-amber-400" />
            <SummaryCard label="Inactivas" value={summary.idle} active={false} color="text-muted-foreground" />
            <SummaryCard label="Fallando" value={summary.error} active color="text-red-400" />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Cargando…
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByCategory).map(([cat, items]) => {
              const catMeta = CATEGORIES[cat] ?? { label: cat, color: "text-muted-foreground" }
              return (
                <section key={cat}>
                  <h2 className={cn("text-[10px] font-mono uppercase tracking-wider mb-2", catMeta.color)}>
                    {catMeta.label} ({items.length})
                  </h2>
                  <div className="space-y-1.5">
                    {items.map((a) => (
                      <AutomationCard key={a.id} a={a} expanded={expanded.has(a.id)} onToggle={() => toggle(a.id)} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {generatedAt && (
          <p className="text-[10px] font-mono text-muted-foreground text-right">
            Última actualización: {new Date(generatedAt).toLocaleTimeString("es-ES")}
          </p>
        )}
      </PageContainer>
    </>
  )
}

function SummaryCard({ label, value, active, color }: { label: string; value: number; active: boolean; color?: string }) {
  return (
    <div className={cn(
      "rounded-md border p-3 transition-colors",
      active ? "border-border bg-card/30" : "border-border"
    )}>
      <div className={cn("text-[10px] font-mono uppercase tracking-wider", color ?? "text-muted-foreground")}>{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}

function AutomationCard({ a, expanded, onToggle }: { a: Automation; expanded: boolean; onToggle: () => void }) {
  const meta = STATUS_META[a.status]
  const Icon = meta.icon
  return (
    <div className={cn("rounded-md border", meta.border, meta.bg)}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-card/40 transition-colors"
      >
        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", meta.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-medium truncate">{a.label}</h3>
            <span className={cn("shrink-0 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border", meta.border, meta.color)}>
              {meta.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-1">{a.statusReason}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          {a.lastRunHoursAgo !== null && (
            <span>hace {a.lastRunHoursAgo < 1 ? "<1" : a.lastRunHoursAgo}h</span>
          )}
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-background/30">
          <p className="text-xs text-muted-foreground">{a.description}</p>

          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Trigger</div>
            <code className="text-xs font-mono bg-card/40 border border-border rounded-sm px-2 py-1 inline-block">
              {a.trigger}
            </code>
          </div>

          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Lógica en cadena</div>
            <ol className="space-y-1 text-xs">
              {a.actions.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
                  <span className="text-foreground/80">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {a.relatedTables.length > 0 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Tablas BD</div>
              <div className="flex flex-wrap gap-1">
                {a.relatedTables.map((t) => (
                  <code key={t} className="text-[10px] font-mono bg-card/40 border border-border rounded-sm px-1.5 py-0.5">{t}</code>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border text-[10px] font-mono">
            <div>
              <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Última ejecución</div>
              <div className="text-foreground">
                {a.lastRun ? new Date(a.lastRun).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground uppercase tracking-wider mb-0.5">Total ejecuciones</div>
              <div className="text-foreground">{a.totalExecutions ?? "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
