"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Target, Users, AlertCircle, ChevronRight, Flag, LayoutGrid, FolderKanban, CheckCircle2, Circle } from "lucide-react"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { ROOT_AREAS, ASSIGNEE_LABELS } from "@/features/tasks/types/task"
import type { Task, Assignee } from "@/features/tasks/types/task"
import type { DueRange } from "@/features/tasks/store/task-store"
import { TaskDetail } from "@/features/tasks/components/task-detail"
import { cn } from "@/lib/utils"

const AREA_COLORS: Record<string, { dot: string; ring: string; tint: string }> = {
  area_marketing: { dot: "bg-blue-400", ring: "ring-blue-500/30", tint: "bg-blue-500/[0.05]" },
  area_producto:  { dot: "bg-green-400", ring: "ring-green-500/30", tint: "bg-green-500/[0.05]" },
  area_ventas:    { dot: "bg-amber-400", ring: "ring-amber-500/30", tint: "bg-amber-500/[0.05]" },
  area_finanzas:  { dot: "bg-purple-400", ring: "ring-purple-500/30", tint: "bg-purple-500/[0.05]" },
}

const FOCUS_GRADIENTS: Record<string, string> = {
  amber: "from-amber-500 to-red-500",
  blue: "from-blue-500 to-cyan-500",
  green: "from-emerald-500 to-green-500",
  purple: "from-purple-500 to-pink-500",
}

export function OperacionesDashboard() {
  const router = useRouter()
  const init = useTaskStore((s) => s.init)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const focuses = useTaskStore((s) => s.focuses)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)
  const setFilters = useTaskStore((s) => s.setFilters)
  const resetFilters = useTaskStore((s) => s.resetFilters)

  const setViewMode = useTaskStore((s) => s.setViewMode)

  function navigateToTasks(filters: { status?: string; assignee?: string; dueRange?: DueRange }) {
    resetFilters()
    setViewMode("list")  // siempre lista filtrada cuando vienes desde una card especifica
    setFilters({
      ...(filters.status !== undefined ? { status: filters.status as "all" | "inbox" | "next" | "waiting" | "someday" | "done" } : {}),
      ...(filters.assignee !== undefined ? { assignee: filters.assignee as Assignee | "all" } : {}),
      ...(filters.dueRange !== undefined ? { dueRange: filters.dueRange } : {}),
    })
    router.push("/tasks")
  }

  useEffect(() => { init() }, [init])

  // Modo: "general" (todo) o id de foco activo
  const [mode, setMode] = useState<string>("general")

  // Cuando llegan focuses, seleccionar el primer activo como default
  useEffect(() => {
    if (focuses.length > 0 && mode === "general") {
      // No auto-cambiamos: general es default. Si user selecciona foco, se queda.
    }
  }, [focuses, mode])

  const activeFocus = mode === "general" ? null : focuses.find((f) => f.id === mode) ?? null

  // === SCOPE: qué proyectos/tasks entran en el dashboard ===
  // Modo "general": TODO el negocio (active + paused + completed) y TODAS las tareas
  //                 (incluido someday + inbox) — vista panorámica
  // Modo "foco":    solo proyectos active del foco + sus tareas (sin someday/inbox)
  //                 — vista de ejecución
  const scopedProjects = useMemo(() => {
    if (mode === "general") {
      // Todo proyecto que tenga tasks o haya tenido — sin filtro de status
      return paraItems.filter((p) => p.type === "project")
    }
    return paraItems.filter((p) => p.type === "project" && p.status === "active" && p.focusId === mode)
  }, [paraItems, mode])

  const scopedProjectIds = useMemo(() => new Set(scopedProjects.map((p) => p.id)), [scopedProjects])
  const scopedTasks = useMemo(() => {
    if (mode === "general") {
      // En General: todas las tareas que pertenezcan a proyectos visibles
      // (cualquier status: next/waiting/someday/inbox/done)
      return tasks.filter((t) => t.paraId && scopedProjectIds.has(t.paraId))
    }
    // En Foco: excluir someday + inbox para que solo se vea lo "vivo"
    return tasks.filter(
      (t) => t.paraId && scopedProjectIds.has(t.paraId) && t.status !== "someday" && t.status !== "inbox"
    )
  }, [tasks, scopedProjectIds, mode])

  // === Foco countdown ===
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const focusCountdown = useMemo(() => {
    if (!activeFocus || !activeFocus.endDate) return null
    const endDate = new Date(activeFocus.endDate + "T18:00:00+02:00")
    const startDate = activeFocus.startDate ? new Date(activeFocus.startDate + "T00:00:00+02:00") : null
    const totalMs = startDate ? endDate.getTime() - startDate.getTime() : 0
    const elapsedMs = startDate ? Math.max(0, now.getTime() - startDate.getTime()) : 0
    const timePct = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const weeks = Math.floor(daysLeft / 7)
    const extraDays = daysLeft % 7
    return { endDate, startDate, timePct, daysLeft, weeks, extraDays }
  }, [activeFocus, now])

  // === Progreso tasks scope ===
  const totalScopedTasks = scopedTasks.length
  const doneScoped = scopedTasks.filter((t) => t.status === "done").length
  const tasksPct = totalScopedTasks > 0 ? (doneScoped / totalScopedTasks) * 100 : 0
  const openScoped = scopedTasks.filter((t) => t.status !== "done")
  const in7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)
  const overdue = openScoped.filter((t) => t.dueDate && new Date(t.dueDate) < startOfToday)
  const dueThisWeek = openScoped.filter((t) => {
    if (!t.dueDate) return false
    const d = new Date(t.dueDate)
    return d >= startOfToday && d < in7Days
  })

  // === Por área ===
  const byArea = useMemo(() => {
    return ROOT_AREAS.map((area) => {
      const projects = scopedProjects.filter((p) => p.parentId === area.id)
      const areaProjectIds = new Set(projects.map((p) => p.id))
      const areaTasks = tasks.filter((t) => t.paraId && areaProjectIds.has(t.paraId))
      const total = areaTasks.length
      const done = areaTasks.filter((t) => t.status === "done").length
      const pct = total > 0 ? (done / total) * 100 : 0
      return { ...area, projects, total, done, pct }
    })
  }, [scopedProjects, tasks])

  // === Por persona ===
  const byAssignee = useMemo(() => {
    const map = new Map<string, { total: number; open: number; overdue: number }>()
    for (const t of scopedTasks) {
      const cur = map.get(t.assignee) ?? { total: 0, open: 0, overdue: 0 }
      cur.total++
      if (t.status !== "done") cur.open++
      if (t.dueDate && new Date(t.dueDate) < startOfToday && t.status !== "done") cur.overdue++
      map.set(t.assignee, cur)
    }
    return Array.from(map.entries()).map(([a, m]) => ({ assignee: a, ...m })).sort((a, b) => b.open - a.open)
  }, [scopedTasks, startOfToday])

  // === Próximos deadlines (top 8) ===
  const upcomingDeadlines = useMemo(() => {
    return openScoped
      .filter((t) => t.dueDate)
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 8)
  }, [openScoped])

  // === Acciones humanas (no marco, no ai) ===
  const humanActions = useMemo(() => {
    return openScoped
      .filter((t) => t.assignee !== "ai" && t.assignee !== "marco")
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      })
      .slice(0, 10)
  }, [openScoped])

  // === Progreso por proyecto ===
  const projectsProgress = useMemo(() => {
    return scopedProjects
      .map((p) => {
        const ts = tasks.filter((t) => t.paraId === p.id)
        const total = ts.length
        const done = ts.filter((t) => t.status === "done").length
        const open = total - done
        return { ...p, total, done, open, pct: total > 0 ? (done / total) * 100 : 0 }
      })
      .sort((a, b) => b.open - a.open)
  }, [scopedProjects, tasks])

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
        {/* ============ MODE SWITCHER ============ */}
        <div className="flex items-center gap-1 rounded-md bg-muted/40 p-0.5 w-fit">
          <button
            onClick={() => setMode("general")}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors",
              mode === "general" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3 w-3" /> General
          </button>
          {focuses.filter((f) => f.active).map((f) => (
            <button
              key={f.id}
              onClick={() => setMode(f.id)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors",
                mode === f.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Flag className="h-3 w-3" /> {f.name}
            </button>
          ))}
        </div>

        {/* ============ HERO ============ */}
        {activeFocus ? (
          <section className="rounded-md border border-border bg-card/40 p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Flag className={cn("h-4 w-4", `text-${activeFocus.color}-400`)} />
              <span className={cn("font-mono text-[10px] uppercase tracking-widest", `text-${activeFocus.color}-400`)}>
                FOCO ACTIVO
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-1">{activeFocus.name}</h1>
            {activeFocus.description && (
              <p className="text-xs text-muted-foreground mb-3 max-w-2xl">{activeFocus.description}</p>
            )}
            {focusCountdown && (
              <>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-5">
                  {focusCountdown.daysLeft === 0
                    ? "ES HOY"
                    : focusCountdown.weeks > 0
                      ? `Quedan ${focusCountdown.weeks} semana${focusCountdown.weeks === 1 ? "" : "s"}${focusCountdown.extraDays ? ` y ${focusCountdown.extraDays} día${focusCountdown.extraDays === 1 ? "" : "s"}` : ""}`
                      : `Quedan ${focusCountdown.daysLeft} día${focusCountdown.daysLeft === 1 ? "" : "s"}`}
                </p>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span>Tiempo transcurrido</span>
                    <span>{Math.round(focusCountdown.timePct)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                    <div
                      className={cn("h-full bg-gradient-to-r transition-all", FOCUS_GRADIENTS[activeFocus.color] ?? FOCUS_GRADIENTS.amber)}
                      style={{ width: `${focusCountdown.timePct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>
                      {focusCountdown.startDate?.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span>
                      {focusCountdown.endDate.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>Tareas completadas del foco</span>
                <span>{doneScoped} / {totalScopedTasks} · {Math.round(tasksPct)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all" style={{ width: `${tasksPct}%` }} />
              </div>
            </div>
          </section>
        ) : (
          // MODO GENERAL: hero distinto
          <section className="rounded-md border border-border bg-card/40 p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                VISTA GENERAL · TODO EL NEGOCIO
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-1">Operaciones</h1>
            <p className="text-xs text-muted-foreground mb-5 max-w-2xl">
              {scopedProjects.filter((p) => p.status === "active").length} activos · {scopedProjects.filter((p) => p.status === "paused").length} pausados · {scopedProjects.filter((p) => p.status === "completed").length} completados · {totalScopedTasks} tareas totales (incluido Someday)
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>Completadas globalmente</span>
                <span>{doneScoped} / {totalScopedTasks} · {Math.round(tasksPct)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all" style={{ width: `${tasksPct}%` }} />
              </div>
            </div>
          </section>
        )}

        {/* ============ STATS CARDS ============ */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label={mode === "general" ? "Total tareas" : "Total foco"}
            value={totalScopedTasks}
            sublabel={`${scopedProjects.length} proyectos`}
            icon={Target}
            onClick={() => navigateToTasks({ status: "all" })}
          />
          <StatCard
            label="Abiertas"
            value={openScoped.length}
            sublabel={`${doneScoped} hechas`}
            icon={Target}
            accent="cyan"
            onClick={() => navigateToTasks({ status: "next" })}
          />
          <StatCard
            label="Vencidas"
            value={overdue.length}
            sublabel={overdue.length > 0 ? "Atrasadas" : "Todo al día"}
            icon={AlertCircle}
            accent={overdue.length > 0 ? "red" : "green"}
            onClick={() => overdue.length > 0 && navigateToTasks({ dueRange: "overdue" })}
          />
          <StatCard
            label="Esta semana"
            value={dueThisWeek.length}
            sublabel="Próx 7 días"
            icon={Calendar}
            accent="amber"
            onClick={() => navigateToTasks({ dueRange: "week" })}
          />
        </section>

        {/* ============ ÁREAS ============ */}
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

        {/* ============ PROYECTOS ============ */}
        {projectsProgress.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" /> Proyectos
            </h2>
            <div className="rounded-md border border-border/40 divide-y divide-border/40">
              {projectsProgress.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-card/40 transition-colors",
                    p.status === "paused" && "opacity-60",
                    p.status === "completed" && "opacity-50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm truncate">{p.name}</span>
                      {p.status === "paused" && (
                        <span className="shrink-0 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border border-amber-500/40 text-amber-400">
                          pausado
                        </span>
                      )}
                      {p.status === "completed" && (
                        <span className="shrink-0 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border border-green-500/40 text-green-400">
                          completado
                        </span>
                      )}
                    </div>
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
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                (click para ver sus tareas)
              </span>
            </h2>
            <div className="rounded-md border border-border/40 divide-y divide-border/40">
              {byAssignee.map((a) => (
                <button
                  key={a.assignee}
                  type="button"
                  onClick={() => navigateToTasks({ assignee: a.assignee, status: "all" })}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-card/60"
                >
                  <span>{ASSIGNEE_LABELS[a.assignee as keyof typeof ASSIGNEE_LABELS] ?? a.assignee}</span>
                  <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
                    <span className="text-muted-foreground">{a.open} abiertas</span>
                    {a.overdue > 0 && <span className="text-red-400">{a.overdue} vencidas</span>}
                    <span className="text-muted-foreground">{a.total} total</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ============ ACCIONES HUMANAS ============ */}
        {humanActions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" /> Acciones humanas pendientes
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                (no Marco / no AI — bloquean avance)
              </span>
            </h2>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.04] divide-y divide-border/40">
              {humanActions.map((t) => (
                <TaskRow key={t.id} task={t} startOfToday={startOfToday} now={now} variant="amber" />
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
              {upcomingDeadlines.map((t) => (
                <TaskRow key={t.id} task={t} startOfToday={startOfToday} now={now} variant="default" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Detalle de task lateral — controlado por el store (selectedTaskId). */}
      <TaskDetail />
    </div>
  )
}

/**
 * Fila clicable de task usada en Acciones Humanas + Próximos Deadlines.
 * - Click ✓ a la izquierda: marca done sin abrir detalle (quick-action)
 * - Click en el resto: abre el drawer TaskDetail con toda la edición
 */
function TaskRow({
  task,
  startOfToday,
  now,
  variant,
}: {
  task: Task
  startOfToday: Date
  now: Date
  variant: "amber" | "default"
}) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask)
  const updateTask = useTaskStore((s) => s.updateTask)

  const isOverdue = task.dueDate && new Date(task.dueDate) < startOfToday
  const days = task.dueDate
    ? Math.ceil((new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const isDone = task.status === "done"

  async function handleToggleDone(e: React.MouseEvent) {
    e.stopPropagation()
    await updateTask(task.id, {
      status: isDone ? "next" : "done",
      completedAt: isDone ? null : new Date().toISOString(),
    })
  }

  function handleOpen() {
    setSelectedTask(task.id)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === "Enter") handleOpen() }}
      className={cn(
        "w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-card/60 cursor-pointer",
        variant === "amber" && "hover:bg-amber-500/[0.08]",
        isDone && "opacity-50"
      )}
    >
      {/* Quick-action: marcar/desmarcar done */}
      <button
        type="button"
        onClick={handleToggleDone}
        title={isDone ? "Marcar como pendiente" : "Marcar como hecha"}
        className="shrink-0 hover:scale-110 transition-transform"
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground hover:text-green-400" />
        )}
      </button>

      {/* Title + priority dot */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            task.priority === "urgent" && "bg-red-400",
            task.priority === "high" && "bg-orange-400",
            task.priority === "normal" && "bg-blue-400",
            task.priority === "low" && "bg-muted-foreground/40"
          )}
        />
        <span className={cn("text-sm truncate", isDone && "line-through")}>{task.title}</span>
      </div>

      {/* Meta: persona + fecha */}
      <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono uppercase tracking-wider">
        <span className="text-muted-foreground">
          {ASSIGNEE_LABELS[task.assignee as keyof typeof ASSIGNEE_LABELS] ?? task.assignee}
        </span>
        {days !== null && (
          <span className={cn(
            isOverdue ? "text-red-400" : days <= 3 ? "text-amber-400" : "text-muted-foreground"
          )}>
            {isOverdue ? `${Math.abs(days)}d tarde` : days === 0 ? "Hoy" : `${days}d`}
          </span>
        )}
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
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
  onClick,
}: {
  label: string
  value: number
  sublabel?: string
  icon: typeof Target
  accent?: "cyan" | "green" | "red" | "amber"
  onClick?: () => void
}) {
  const accentColor = {
    cyan: "text-cyan-400",
    green: "text-green-400",
    red: "text-red-400",
    amber: "text-amber-400",
  }[accent ?? "cyan"]

  const content = (
    <>
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
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-md border border-border/40 bg-card/40 p-3 text-left transition-all hover:border-border hover:bg-card/60 cursor-pointer"
      >
        {content}
      </button>
    )
  }

  return <div className="rounded-md border border-border/40 bg-card/40 p-3">{content}</div>
}
