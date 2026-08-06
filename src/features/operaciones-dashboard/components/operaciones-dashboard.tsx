"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Target, Users, AlertCircle, ChevronRight, Flag, LayoutGrid, FolderKanban, CheckCircle2, Circle } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { ROOT_AREAS, ASSIGNEE_LABELS } from "@/features/tasks/types/task"
import type { Task, Assignee } from "@/features/tasks/types/task"
import type { DueRange } from "@/features/tasks/store/task-store"
import { TaskDetail } from "@/features/tasks/components/task-detail"
import { cn } from "@/lib/utils"

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
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask)

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

  // FILTRO de status de proyectos (toggle por el usuario):
  // - abiertos (default): solo active
  // - pausados: solo paused
  // - finalizados: solo completed
  // - todos: active + paused + completed
  type ProjectStatusFilter = "abiertos" | "pausados" | "finalizados" | "todos"
  const [projectStatusFilter, setProjectStatusFilter] = useState<ProjectStatusFilter>("abiertos")

  // Card expandible "todo lo que falta para el foco"
  const [showAllFocus, setShowAllFocus] = useState(false)

  // Cuando llegan focuses, seleccionar el primer activo como default
  useEffect(() => {
    if (focuses.length > 0 && mode === "general") {
      // No auto-cambiamos: general es default. Si user selecciona foco, se queda.
    }
  }, [focuses, mode])

  const activeFocus = mode === "general" ? null : focuses.find((f) => f.id === mode) ?? null

  // === SCOPE: qué proyectos/tasks entran en el dashboard ===
  // El filtro de status aplica IGUAL en modo General y modo Foco.
  // Default: solo abiertos (active). El usuario puede ver pausados/completados a demanda
  // pulsando un botón. NO se ven completados/pausados sin clic explícito.
  function matchProjectStatus(p: { status: string }): boolean {
    switch (projectStatusFilter) {
      case "abiertos": return p.status === "active"
      case "pausados": return p.status === "paused"
      case "finalizados": return p.status === "completed"
      case "todos": return true
    }
  }
  const scopedProjects = useMemo(() => {
    if (mode === "general") {
      return paraItems.filter((p) => p.type === "project" && matchProjectStatus(p))
    }
    return paraItems.filter((p) => p.type === "project" && matchProjectStatus(p) && p.focusId === mode)
  }, [paraItems, mode, projectStatusFilter])

  const scopedProjectIds = useMemo(() => new Set(scopedProjects.map((p) => p.id)), [scopedProjects])
  const scopedTasks = useMemo(() => {
    if (mode === "general") {
      // En General: tareas de proyectos visibles, NO done (regla: lo completado no se ve aquí)
      return tasks.filter((t) => t.paraId && scopedProjectIds.has(t.paraId) && t.status !== "done")
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
  // CRÍTICO: "Vencida" / "Esta semana" deben coincidir EXACTAMENTE con los presets
  // de /tasks. Allí filtran status=next. Si aquí contamos t.status !== "done"
  // (que incluye someday/waiting/inbox), el contador del dashboard (62) NO
  // coincide con lo que el usuario ve al hacer click en la card (1).
  // Las tareas someday/waiting con due_date vieja NO son "vencidas" — están en cola.
  const overdue = openScoped.filter((t) => t.status === "next" && t.dueDate && new Date(t.dueDate) < startOfToday)
  const dueThisWeek = openScoped.filter((t) => {
    if (t.status !== "next" || !t.dueDate) return false
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

  // === Progreso por proyecto (ordenado por display_order del plan) ===
  // REGLA #6 Knowledge: los proyectos del OS SIEMPRE se ordenan por display_order
  // ASC (orden del plan), nunca por métricas internas.
  const projectsProgress = useMemo(() => {
    return scopedProjects
      .map((p) => {
        const ts = tasks.filter((t) => t.paraId === p.id)
        const total = ts.length
        const done = ts.filter((t) => t.status === "done").length
        const open = total - done
        return { ...p, total, done, open, pct: total > 0 ? (done / total) * 100 : 0 }
      })
      .sort((a, b) => {
        const oa = a.displayOrder ?? 999
        const ob = b.displayOrder ?? 999
        if (oa !== ob) return oa - ob
        return a.name.localeCompare(b.name)
      })
  }, [scopedProjects, tasks])

  // === TODO LO QUE FALTA DEL FOCO (card expandible) ===
  // TODAS las tareas no-done de los proyectos del foco activo, agrupadas por
  // prioridad. Da la claridad de "qué falta exactamente" para el webinar.
  const PRIORITY_ORDER = ["urgent", "high", "normal", "low"] as const
  // Los cuatro niveles se distinguen con los tokens del tema: rojo de error para lo
  // urgente, ambar de aviso para lo alto y grises para el resto. Antes eran colores
  // sueltos de Tailwind (red-400, orange-400, blue-400) que pintaban una paleta que
  // no es la de la marca.
  const PRIORITY_META: Record<string, { label: string; dot: string; text: string }> = {
    urgent: { label: "Urgentes", dot: "bg-destructive", text: "text-destructive" },
    high: { label: "Altas", dot: "bg-warn", text: "text-warn" },
    normal: { label: "Normales", dot: "bg-primary", text: "text-primary" },
    low: { label: "Bajas", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  }
  const focusOpenByPriority = useMemo(() => {
    if (mode === "general") return []
    const focusProjectIds = new Set(
      paraItems.filter((p) => p.type === "project" && p.focusId === mode).map((p) => p.id)
    )
    const open = tasks.filter((t) => t.paraId && focusProjectIds.has(t.paraId) && t.status !== "done")
    return PRIORITY_ORDER.map((prio) => ({
      prio,
      tasks: open
        .filter((t) => (t.priority ?? "normal") === prio)
        .sort((a, b) => {
          if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
          if (a.dueDate) return -1
          if (b.dueDate) return 1
          return 0
        }),
    })).filter((g) => g.tasks.length > 0)
  }, [tasks, paraItems, mode])
  const focusOpenTotal = focusOpenByPriority.reduce((acc, g) => acc + g.tasks.length, 0)
  const projectName = (paraId: string | null | undefined) =>
    paraItems.find((p) => p.id === paraId)?.name ?? ""

  if (loading && !initialized) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-[15px] text-muted-foreground">
        Cargando dashboard…
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto no-overscroll">
      <PageContainer className="max-w-6xl space-y-6">
        {/* ============ MODE SWITCHER + FILTRO STATUS PROYECTOS ============ */}
        {/* En telefono los dos grupos van uno debajo del otro y cada uno se desliza
            dentro de su caja: en una sola fila no caben y se amontonaban. */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          {/* General / Focos */}
          <div className="-mx-1 flex snap-x gap-1 overflow-x-auto px-1 md:mx-0 md:w-fit md:overflow-visible md:rounded-lg md:bg-muted/40 md:px-0.5 md:py-0.5">
            <button
              onClick={() => setMode("general")}
              className={cn(
                "inline-flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 text-[15px] font-medium whitespace-nowrap transition-colors md:h-8 md:text-sm",
                mode === "general" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground md:hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" /> General
            </button>
            {focuses.filter((f) => f.active).map((f) => (
              <button
                key={f.id}
                onClick={() => setMode(f.id)}
                className={cn(
                  "inline-flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 text-[15px] font-medium whitespace-nowrap transition-colors md:h-8 md:text-sm",
                  mode === f.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground md:hover:text-foreground"
                )}
              >
                <Flag className="h-4 w-4 shrink-0" /> {f.name}
              </button>
            ))}
          </div>

          {/* Filtro de status proyectos. Default: abiertos. */}
          <div className="-mx-1 flex snap-x gap-1 overflow-x-auto px-1 md:mx-0 md:ml-auto md:w-fit md:overflow-visible md:rounded-lg md:bg-muted/40 md:px-0.5 md:py-0.5">
            {(["abiertos", "pausados", "finalizados", "todos"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setProjectStatusFilter(opt)}
                className={cn(
                  // `capitalize` en vez de `uppercase`: pinta el valor del enum
                  // como etiqueta ("Abiertos") sin las mayusculas espaciadas del
                  // diseno viejo.
                  "h-11 shrink-0 snap-start rounded-lg px-3 text-[15px] font-medium whitespace-nowrap capitalize transition-colors md:h-8 md:px-2.5 md:text-sm",
                  projectStatusFilter === opt ? "bg-background text-foreground shadow-sm" : "text-muted-foreground md:hover:text-foreground"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* ============ HERO ============ */}
        {activeFocus ? (
          <section className="rounded-xl border border-border bg-card p-4 md:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Flag className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-semibold text-primary">
                FOCO ACTIVO
              </span>
            </div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight md:text-3xl">{activeFocus.name}</h1>
            {activeFocus.description && (
              <p className="mb-3 max-w-2xl text-[15px] text-muted-foreground">{activeFocus.description}</p>
            )}
            {focusCountdown && (
              <>
                <p className="mb-5 text-[15px] font-medium text-muted-foreground">
                  {focusCountdown.daysLeft === 0
                    ? "ES HOY"
                    : focusCountdown.weeks > 0
                      ? `Quedan ${focusCountdown.weeks} semana${focusCountdown.weeks === 1 ? "" : "s"}${focusCountdown.extraDays ? ` y ${focusCountdown.extraDays} día${focusCountdown.extraDays === 1 ? "" : "s"}` : ""}`
                      : `Quedan ${focusCountdown.daysLeft} día${focusCountdown.daysLeft === 1 ? "" : "s"}`}
                </p>

                <div className="mb-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>Tiempo transcurrido</span>
                    <span className="tabular-nums">{Math.round(focusCountdown.timePct)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${focusCountdown.timePct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="tabular-nums">
                      {focusCountdown.startDate?.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="tabular-nums">
                      {focusCountdown.endDate.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>Tareas completadas del foco</span>
                <span className="tabular-nums">{doneScoped} / {totalScopedTasks} · {Math.round(tasksPct)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all" style={{ width: `${tasksPct}%` }} />
              </div>
            </div>
          </section>
        ) : (
          // MODO GENERAL: hero distinto
          <section className="rounded-xl border border-border bg-card p-4 md:p-6">
            <div className="mb-3 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">
                VISTA GENERAL · TODO EL NEGOCIO
              </span>
            </div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight md:text-3xl">Operaciones</h1>
            <p className="mb-5 max-w-2xl text-[15px] text-muted-foreground">
              {scopedProjects.filter((p) => p.status === "active").length} activos · {scopedProjects.filter((p) => p.status === "paused").length} pausados · {scopedProjects.filter((p) => p.status === "completed").length} completados · {totalScopedTasks} tareas totales (incluido Someday)
            </p>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>Completadas globalmente</span>
                <span className="tabular-nums">{doneScoped} / {totalScopedTasks} · {Math.round(tasksPct)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all" style={{ width: `${tasksPct}%` }} />
              </div>
            </div>
          </section>
        )}

        {/* ============ TODO LO QUE FALTA DEL FOCO (expandible) ============ */}
        {activeFocus && focusOpenTotal > 0 && (
          <section className="rounded-xl border border-border bg-card">
            <button
              onClick={() => setShowAllFocus((v) => !v)}
              className="flex w-full flex-col gap-1 px-4 py-3 text-left md:flex-row md:items-center md:justify-between md:gap-3"
            >
              <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold md:text-sm">
                <Flag className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">Todo lo que falta para «{activeFocus.name}»</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <span className="tabular-nums">{focusOpenTotal}</span> pendientes · {showAllFocus ? "ocultar" : "ver todo"}
                <ChevronRight className={cn("h-4 w-4 transition-transform", showAllFocus && "rotate-90")} />
              </span>
            </button>

            {showAllFocus && (
              <div className="space-y-4 border-t border-border px-4 py-3">
                {focusOpenByPriority.map((group) => {
                  const meta = PRIORITY_META[group.prio]
                  return (
                    <div key={group.prio} className="space-y-1">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                        <span className={cn("text-sm font-semibold", meta.text)}>
                          {meta.label}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">({group.tasks.length})</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="space-y-0.5">
                        {group.tasks.map((t) => {
                          const due = t.dueDate ? new Date(t.dueDate) : null
                          const days = due
                            ? Math.floor((due.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))
                            : null
                          return (
                            <button
                              key={t.id}
                              onClick={() => setSelectedTask(t.id)}
                              className="flex min-h-[56px] w-full flex-col gap-1 rounded-lg px-2 py-2 text-left transition-colors active:bg-muted md:min-h-0 md:flex-row md:items-center md:gap-2.5 md:hover:bg-muted"
                            >
                              <span className="flex min-w-0 items-center gap-2.5 md:flex-1">
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                                <span className="min-w-0 flex-1 truncate text-[15px] md:text-sm">{t.title}</span>
                              </span>
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-5 text-sm text-muted-foreground md:shrink-0 md:flex-nowrap md:pl-0">
                                {projectName(t.paraId) && (
                                  <span className="max-w-[140px] truncate">
                                    {projectName(t.paraId)}
                                  </span>
                                )}
                                <span>{t.status}</span>
                                {days !== null && (
                                  <span className={cn(
                                    "tabular-nums",
                                    days < 0 ? "text-destructive" : days <= 3 ? "text-warn" : "text-muted-foreground"
                                  )}>
                                    {days < 0 ? `${days}d` : days === 0 ? "hoy" : `+${days}d`}
                                  </span>
                                )}
                                <span>{ASSIGNEE_LABELS[t.assignee] ?? t.assignee}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ============ STATS CARDS ============ */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
          <h2 className="flex items-center gap-2 text-[15px] font-semibold md:text-sm">
            <Target className="h-4 w-4 shrink-0 text-muted-foreground" /> Progreso por área
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {byArea.map((a) => (
              <Link
                key={a.id}
                href={`/areas/${a.id}`}
                className="rounded-lg border border-border bg-card p-3 transition-colors active:bg-muted md:hover:border-primary/50"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium md:text-sm">{a.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {a.projects.length} proy
                  </span>
                </div>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="tabular-nums">{a.done} / {a.total} tareas</span>
                  <span className="tabular-nums">{Math.round(a.pct)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${a.pct}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============ PROYECTOS ============ */}
        {projectsProgress.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold md:text-sm">
              <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" /> Proyectos
            </h2>
            <div className="divide-y divide-border rounded-lg border border-border">
              {projectsProgress.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className={cn(
                    "flex min-h-[56px] items-center justify-between gap-3 px-3 py-2.5 transition-colors active:bg-muted md:hover:bg-muted",
                    p.status === "paused" && "opacity-60",
                    p.status === "completed" && "opacity-50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15px] md:text-sm">{p.name}</span>
                      {p.status === "paused" && (
                        <span className="shrink-0 rounded-sm border border-warn/40 px-1.5 py-0.5 text-sm text-warn">
                          pausado
                        </span>
                      )}
                      {p.status === "completed" && (
                        <span className="shrink-0 rounded-sm border border-primary/40 px-1.5 py-0.5 text-sm text-primary">
                          completado
                        </span>
                      )}
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm text-muted-foreground">
                    <div className="tabular-nums">
                      {p.done} / {p.total}
                    </div>
                    <div className="tabular-nums">
                      {p.open} abiertas
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ============ POR PERSONA ============ */}
        {byAssignee.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold md:text-sm">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" /> Carga por persona
              <span className="text-sm font-normal text-muted-foreground">
                (click para ver sus tareas)
              </span>
            </h2>
            <div className="divide-y divide-border rounded-lg border border-border">
              {byAssignee.map((a) => (
                <button
                  key={a.assignee}
                  type="button"
                  onClick={() => navigateToTasks({ assignee: a.assignee, status: "all" })}
                  className="flex min-h-[56px] w-full flex-col gap-1 px-3 py-2 text-left transition-colors active:bg-muted md:min-h-0 md:flex-row md:items-center md:justify-between md:hover:bg-muted"
                >
                  <span className="text-[15px] md:text-sm">{ASSIGNEE_LABELS[a.assignee as keyof typeof ASSIGNEE_LABELS] ?? a.assignee}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="tabular-nums text-muted-foreground">{a.open} abiertas</span>
                    {a.overdue > 0 && <span className="tabular-nums text-destructive">{a.overdue} vencidas</span>}
                    <span className="tabular-nums text-muted-foreground">{a.total} total</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ============ ACCIONES HUMANAS ============ */}
        {humanActions.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold md:text-sm">
              <Users className="h-4 w-4 shrink-0 text-warn" /> Acciones humanas pendientes
              <span className="text-sm font-normal text-muted-foreground">
                (no Marco / no AI — bloquean avance)
              </span>
            </h2>
            <div className="divide-y divide-border rounded-lg border border-warn/30 bg-warn/5">
              {humanActions.map((t) => (
                <TaskRow key={t.id} task={t} startOfToday={startOfToday} now={now} variant="amber" />
              ))}
            </div>
          </section>
        )}

        {/* ============ PRÓXIMOS DEADLINES ============ */}
        {upcomingDeadlines.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold md:text-sm">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" /> Próximos deadlines
            </h2>
            <div className="divide-y divide-border rounded-lg border border-border">
              {upcomingDeadlines.map((t) => (
                <TaskRow key={t.id} task={t} startOfToday={startOfToday} now={now} variant="default" />
              ))}
            </div>
          </section>
        )}
      </PageContainer>

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
        "flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left transition-colors active:bg-muted md:gap-3 md:px-3 md:py-2",
        variant === "amber" && "active:bg-warn/10 md:hover:bg-warn/10",
        variant === "default" && "md:hover:bg-muted",
        isDone && "opacity-50"
      )}
    >
      {/* Quick-action: marcar/desmarcar done. A 44 puntos en telefono, que es lo
          que acierta un dedo; antes era un icono suelto de 16. */}
      <button
        type="button"
        onClick={handleToggleDone}
        title={isDone ? "Marcar como pendiente" : "Marcar como hecha"}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg md:size-8"
      >
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Title + meta. En telefono la meta baja debajo del titulo: en una sola fila
          el titulo se comia el sitio de la persona y de la fecha. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              task.priority === "urgent" && "bg-destructive",
              task.priority === "high" && "bg-warn",
              task.priority === "normal" && "bg-primary",
              task.priority === "low" && "bg-muted-foreground"
            )}
          />
          <span className={cn("min-w-0 flex-1 truncate text-[15px] md:text-sm", isDone && "line-through")}>{task.title}</span>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 pl-3.5 text-sm md:pl-0">
          <span className="text-muted-foreground">
            {ASSIGNEE_LABELS[task.assignee as keyof typeof ASSIGNEE_LABELS] ?? task.assignee}
          </span>
          {days !== null && (
            <span className={cn(
              "tabular-nums",
              isOverdue ? "text-destructive" : days <= 3 ? "text-warn" : "text-muted-foreground"
            )}>
              {isOverdue ? `${Math.abs(days)}d tarde` : days === 0 ? "Hoy" : `${days}d`}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
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
  // Los cuatro acentos se traducen a los tokens del tema: no hay cyan ni amber en
  // la marca. Verde = bien, rojo = error, ambar = aviso, neutro = informativo.
  const accentColor = {
    cyan: "text-foreground",
    green: "text-primary",
    red: "text-destructive",
    amber: "text-warn",
  }[accent ?? "cyan"]

  const content = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className={cn("h-4 w-4 shrink-0", accent && accentColor)} />
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <div className={cn("text-2xl font-semibold tabular-nums", accent && accentColor)}>{value}</div>
      {sublabel && (
        <div className="mt-0.5 text-sm text-muted-foreground">
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
        className="cursor-pointer rounded-lg border border-border bg-card p-3 text-left transition-colors active:bg-muted md:hover:border-primary/50"
      >
        {content}
      </button>
    )
  }

  return <div className="rounded-lg border border-border bg-card p-3">{content}</div>
}
