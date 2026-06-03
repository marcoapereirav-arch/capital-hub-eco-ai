"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { Calendar, Target, Users, AlertCircle, ChevronRight, Flag } from "lucide-react"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { ROOT_AREAS, ASSIGNEE_LABELS, PRIORITY_LABELS } from "@/features/tasks/types/task"
import { cn } from "@/lib/utils"

// === FOCO PRINCIPAL: LANZAMIENTO ===
// Cuando cambie el lanzamiento, modificar estas dos constantes.
const LAUNCH_DATE = new Date("2026-08-08T18:00:00+02:00")
const LAUNCH_LABEL = "Webinar en directo · 8/8/2026"
const PROGRESS_START_DATE = new Date("2026-06-03T00:00:00+02:00") // arranque del plan

const AREA_COLORS: Record<string, { dot: string; ring: string; tint: string }> = {
  area_marketing: { dot: "bg-blue-400", ring: "ring-blue-500/30", tint: "bg-blue-500/[0.05]" },
  area_producto:  { dot: "bg-green-400", ring: "ring-green-500/30", tint: "bg-green-500/[0.05]" },
  area_ventas:    { dot: "bg-amber-400", ring: "ring-amber-500/30", tint: "bg-amber-500/[0.05]" },
  area_finanzas:  { dot: "bg-purple-400", ring: "ring-purple-500/30", tint: "bg-purple-500/[0.05]" },
}

export function OperacionesDashboard() {
  const init = useTaskStore((s) => s.init)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)

  useEffect(() => { init() }, [init])

  // Solo trabajamos con proyectos active (el plan 8/8). Pausados y completados los ignoramos aquí.
  const activeProjects = useMemo(
    () => paraItems.filter((p) => p.type === "project" && p.status === "active"),
    [paraItems]
  )
  const activeProjectIds = useMemo(() => new Set(activeProjects.map((p) => p.id)), [activeProjects])

  // Tasks del plan 8/8: las que cuelgan de proyectos active, NO incluye tasks directas de áreas
  const planTasks = useMemo(
    () => tasks.filter((t) => t.paraId && activeProjectIds.has(t.paraId)),
    [tasks, activeProjectIds]
  )

  // === COUNTDOWN AL LANZAMIENTO ===
  const now = new Date()
  const totalMs = LAUNCH_DATE.getTime() - PROGRESS_START_DATE.getTime()
  const elapsedMs = Math.max(0, now.getTime() - PROGRESS_START_DATE.getTime())
  const timeProgressPct = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 100
  const msToLaunch = LAUNCH_DATE.getTime() - now.getTime()
  const daysToLaunch = Math.max(0, Math.ceil(msToLaunch / (1000 * 60 * 60 * 24)))
  const weeksToLaunch = Math.floor(daysToLaunch / 7)
  const extraDays = daysToLaunch % 7

  // === PROGRESO DE TAREAS ===
  const totalPlanTasks = planTasks.length
  const donePlanTasks = planTasks.filter((t) => t.status === "done").length
  const tasksProgressPct = totalPlanTasks > 0 ? (donePlanTasks / totalPlanTasks) * 100 : 0

  // === MÉTRICAS GENERALES ===
  const openPlanTasks = planTasks.filter((t) => t.status !== "done")
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const in7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

  const overdueTasks = openPlanTasks.filter((t) => t.dueDate && new Date(t.dueDate) < startOfToday)
  const dueThisWeek = openPlanTasks.filter((t) => {
    if (!t.dueDate) return false
    const d = new Date(t.dueDate)
    return d >= startOfToday && d < in7Days
  })

  // === POR ÁREA ===
  const byArea = useMemo(() => {
    return ROOT_AREAS.map((area) => {
      const projects = activeProjects.filter((p) => p.parentId === area.id)
      const areaTaskIds = new Set(projects.map((p) => p.id))
      const areaTasks = tasks.filter((t) => t.paraId && areaTaskIds.has(t.paraId))
      const total = areaTasks.length
      const done = areaTasks.filter((t) => t.status === "done").length
      const pct = total > 0 ? (done / total) * 100 : 0
      return { ...area, projects, total, done, pct }
    })
  }, [activeProjects, tasks])

  // === POR PERSONA ===
  const byAssignee = useMemo(() => {
    const map = new Map<string, { total: number; open: number; overdue: number }>()
    for (const t of planTasks) {
      const cur = map.get(t.assignee) ?? { total: 0, open: 0, overdue: 0 }
      cur.total++
      if (t.status !== "done") cur.open++
      if (t.dueDate && new Date(t.dueDate) < startOfToday && t.status !== "done") cur.overdue++
      map.set(t.assignee, cur)
    }
    return Array.from(map.entries()).map(([assignee, m]) => ({ assignee, ...m })).sort((a, b) => b.open - a.open)
  }, [planTasks, startOfToday])

  // === PRÓXIMOS DEADLINES (top 8) ===
  const upcomingDeadlines = useMemo(() => {
    return openPlanTasks
      .filter((t) => t.dueDate)
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 8)
  }, [openPlanTasks])

  // === PROGRESO POR PROYECTO ===
  const projectsProgress = useMemo(() => {
    return activeProjects
      .map((p) => {
        const ts = tasks.filter((t) => t.paraId === p.id)
        const total = ts.length
        const done = ts.filter((t) => t.status === "done").length
        const open = total - done
        return { ...p, total, done, open, pct: total > 0 ? (done / total) * 100 : 0 }
      })
      .sort((a, b) => b.open - a.open)
  }, [activeProjects, tasks])

  if (loading && !initialized) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Cargando dashboard…
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ============ HERO: FOCO 8/8 ============ */}
        <section className="rounded-md border border-border bg-card/40 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
              FOCO PRINCIPAL
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold mb-1">{LAUNCH_LABEL}</h1>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-5">
            {daysToLaunch === 0
              ? "ES HOY"
              : weeksToLaunch > 0
                ? `Quedan ${weeksToLaunch} semana${weeksToLaunch === 1 ? "" : "s"}${extraDays ? ` y ${extraDays} día${extraDays === 1 ? "" : "s"}` : ""}`
                : `Quedan ${daysToLaunch} día${daysToLaunch === 1 ? "" : "s"}`}
          </p>

          {/* Barra de progreso TIEMPO */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <span>Tiempo transcurrido</span>
              <span>{Math.round(timeProgressPct)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
                style={{ width: `${timeProgressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>3 jun 2026 (arranque plan)</span>
              <span>8 ago 2026 (webinar)</span>
            </div>
          </div>

          {/* Barra de progreso TAREAS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <span>Tareas completadas del plan</span>
              <span>{donePlanTasks} / {totalPlanTasks} · {Math.round(tasksProgressPct)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
                style={{ width: `${tasksProgressPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* ============ STATS CARDS ============ */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total plan 8/8" value={totalPlanTasks} sublabel={`${activeProjects.length} proyectos`} icon={Target} />
          <StatCard label="Abiertas" value={openPlanTasks.length} sublabel={`${donePlanTasks} hechas`} icon={Target} accent="cyan" />
          <StatCard label="Vencidas" value={overdueTasks.length} sublabel={overdueTasks.length > 0 ? "Atrasadas" : "Todo al día"} icon={AlertCircle} accent={overdueTasks.length > 0 ? "red" : "green"} />
          <StatCard label="Esta semana" value={dueThisWeek.length} sublabel="Próx 7 días" icon={Calendar} accent="amber" />
        </section>

        {/* ============ ÁREAS DEL PLAN ============ */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" /> Progreso por área
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {byArea.map((a) => {
              const c = AREA_COLORS[a.id]
              return (
                <Link
                  key={a.id}
                  href={`/areas/${a.id}`}
                  className={cn("rounded-md border border-border/40 p-3 ring-1 transition hover:border-border", c?.ring, c?.tint)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", c?.dot)} />
                      <span className="text-sm font-medium">{a.name}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {a.projects.length} proy
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    <span>{a.done} / {a.total} tareas</span>
                    <span>{Math.round(a.pct)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                    <div className={cn("h-full transition-all", c?.dot)} style={{ width: `${a.pct}%` }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ============ PROGRESO POR PROYECTO ============ */}
        {projectsProgress.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Proyectos del plan</h2>
            <div className="rounded-md border border-border/40 divide-y divide-border/40">
              {projectsProgress.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-card/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate mb-1">{p.name}</div>
                    <div className="h-1 rounded-full bg-secondary/40 overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {p.done} / {p.total}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {p.open} abiertas
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ============ POR PERSONA ============ */}
        {byAssignee.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" /> Carga por persona
            </h2>
            <div className="rounded-md border border-border/40 divide-y divide-border/40">
              {byAssignee.map((a) => (
                <div key={a.assignee} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{ASSIGNEE_LABELS[a.assignee as keyof typeof ASSIGNEE_LABELS] ?? a.assignee}</span>
                  <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
                    <span className="text-muted-foreground">{a.open} abiertas</span>
                    {a.overdue > 0 && (
                      <span className="text-red-400">{a.overdue} vencidas</span>
                    )}
                    <span className="text-muted-foreground">{a.total} total</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ PRÓXIMOS DEADLINES ============ */}
        {upcomingDeadlines.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Próximos deadlines
            </h2>
            <div className="rounded-md border border-border/40 divide-y divide-border/40">
              {upcomingDeadlines.map((t) => {
                const d = new Date(t.dueDate!)
                const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const isOverdue = days < 0
                return (
                  <div key={t.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        t.priority === "urgent" && "bg-red-400",
                        t.priority === "high" && "bg-orange-400",
                        t.priority === "normal" && "bg-blue-400",
                        t.priority === "low" && "bg-muted-foreground/40"
                      )} />
                      <span className="truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono uppercase tracking-wider">
                      <span className={isOverdue ? "text-red-400" : days <= 3 ? "text-amber-400" : "text-muted-foreground"}>
                        {isOverdue ? `${Math.abs(days)}d tarde` : days === 0 ? "Hoy" : `${days}d`}
                      </span>
                      <span className="text-muted-foreground">{ASSIGNEE_LABELS[t.assignee as keyof typeof ASSIGNEE_LABELS] ?? t.assignee}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  sublabel?: string
  icon: typeof Target
  accent?: "cyan" | "green" | "red" | "amber"
}) {
  const accentColor = {
    cyan: "text-cyan-400",
    green: "text-green-400",
    red: "text-red-400",
    amber: "text-amber-400",
  }[accent ?? "cyan"]

  return (
    <div className="rounded-md border border-border/40 bg-card/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
        <Icon className={cn("h-3 w-3", accent && accentColor)} />
        {label}
      </div>
      <div className={cn("text-2xl font-semibold", accent && accentColor)}>{value}</div>
      {sublabel && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
          {sublabel}
        </div>
      )}
    </div>
  )
}
