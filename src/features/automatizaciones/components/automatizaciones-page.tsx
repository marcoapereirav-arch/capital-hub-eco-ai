"use client"

import { useEffect, useState } from "react"
import { Zap, ChevronDown, ChevronRight, CheckCircle2, Clock, Loader2, RefreshCcw, XCircle } from "lucide-react"
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

/* Cuatro estados, cuatro colores del TEMA: verde de marca lo que funciona,
 * ambar de aviso lo que espera, gris lo apagado y rojo lo que falla. Antes
 * cada uno traia su familia de Tailwind escrita a mano (green-400, amber-400,
 * red-400), que son verdes y rojos distintos a los de la marca. */
const STATUS_META: Record<
  Automation["status"],
  { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string }
> = {
  live: { label: "Activa", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/5", border: "border-primary/30" },
  pending: { label: "Pendiente", icon: Clock, color: "text-warn", bg: "bg-warn/5", border: "border-warn/30" },
  idle: { label: "Inactiva", icon: Clock, color: "text-muted-foreground", bg: "bg-card", border: "border-border" },
  error: { label: "Fallando", icon: XCircle, color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/30" },
}

/* Las categorias son un rotulo, no un semaforo: llevaban cyan, violeta y azul
 * para nada. Se quedan con el nombre y el gris de texto secundario. */
const CATEGORIES: Record<string, { label: string }> = {
  calendario: { label: "Calendario" },
  ventas: { label: "Ventas" },
  alumno: { label: "Alumno" },
  email: { label: "Email" },
  crm: { label: "CRM" },
  operacion: { label: "Operación" },
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

      <PageContainer>
        {/* Cabecera: en el telefono el boton baja de linea en vez de apretar
            el titulo contra el borde derecho. */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Automatizaciones del OS</h1>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Vista en vivo de todas las automatizaciones que el sistema ejecuta sin intervención humana.
              Solo lectura: para crear/editar una automatización hay que codearla (cron, endpoint o webhook).
              Se actualiza automáticamente cada 30 segundos.
            </p>
          </div>
          <button
            onClick={() => load()}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-[15px] font-medium text-foreground active:bg-muted md:h-8 md:text-sm"
          >
            <RefreshCcw className="size-4" /> Refrescar
          </button>
        </div>

        {/* Resumen */}
        {summary && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Activas" value={summary.live} color="text-primary" />
            <SummaryCard label="Pendientes" value={summary.pending} color="text-warn" />
            <SummaryCard label="Inactivas" value={summary.idle} color="text-muted-foreground" />
            <SummaryCard label="Fallando" value={summary.error} color="text-destructive" />
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-[15px] text-muted-foreground">
            <Loader2 className="mx-auto mb-2 size-5 animate-spin" /> Cargando…
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByCategory).map(([cat, items]) => {
              const catMeta = CATEGORIES[cat] ?? { label: cat }
              return (
                <section key={cat}>
                  <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
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
          <p className="text-right text-sm tabular-nums text-muted-foreground">
            Última actualización: {new Date(generatedAt).toLocaleTimeString("es-ES")}
          </p>
        )}
      </PageContainer>
    </>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className={cn("truncate text-sm", color ?? "text-muted-foreground")}>{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  )
}

function AutomationCard({ a, expanded, onToggle }: { a: Automation; expanded: boolean; onToggle: () => void }) {
  const meta = STATUS_META[a.status]
  const Icon = meta.icon
  return (
    <div className={cn("rounded-lg border", meta.border, meta.bg)}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full min-h-11 items-start gap-3 p-3 text-left active:bg-muted/40"
      >
        <Icon className={cn("mt-0.5 size-4 shrink-0", meta.color)} />
        <div className="min-w-0 flex-1">
          {/* flex-wrap: el titulo largo y la etiqueta de estado se reparten en
              dos lineas en el telefono en vez de salirse por la derecha. */}
          <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 truncate text-[15px] font-medium text-foreground">{a.label}</h3>
            <span className={cn("shrink-0 rounded-lg border px-1.5 py-0.5 text-sm", meta.border, meta.color)}>
              {meta.label}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{a.statusReason}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm tabular-nums text-muted-foreground">
          {a.lastRunHoursAgo !== null && (
            <span>hace {a.lastRunHoursAgo < 1 ? "<1" : a.lastRunHoursAgo}h</span>
          )}
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border bg-background/30 px-4 pt-3 pb-4">
          <p className="text-sm text-muted-foreground">{a.description}</p>

          <div>
            <div className="mb-1 text-sm font-semibold text-muted-foreground">Trigger</div>
            {/* <code> se queda: esto SI es codigo literal. La fuente la pone el
                navegador por la etiqueta, no una clase de diseno. */}
            <code className="inline-block break-all rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground">
              {a.trigger}
            </code>
          </div>

          <div>
            <div className="mb-1 text-sm font-semibold text-muted-foreground">Lógica en cadena</div>
            <ol className="space-y-1 text-sm">
              {a.actions.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                  <span className="min-w-0 text-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {a.relatedTables.length > 0 && (
            <div>
              <div className="mb-1 text-sm font-semibold text-muted-foreground">Tablas BD</div>
              <div className="flex flex-wrap gap-1">
                {a.relatedTables.map((t) => (
                  <code key={t} className="rounded-lg border border-border bg-card px-1.5 py-0.5 text-sm text-foreground">
                    {t}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-2 text-sm">
            <div className="min-w-0">
              <div className="mb-0.5 text-muted-foreground">Última ejecución</div>
              <div className="tabular-nums text-foreground">
                {a.lastRun ? new Date(a.lastRun).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-0.5 text-muted-foreground">Total ejecuciones</div>
              <div className="tabular-nums text-foreground">{a.totalExecutions ?? "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
