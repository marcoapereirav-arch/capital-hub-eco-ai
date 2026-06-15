"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, FolderKanban, ArrowDownUp, LayoutGrid as LayoutGridIcon, Pause, Play, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { cn } from "@/lib/utils"
import type { ParaItem, ParaStatus, Task } from "@/features/tasks/types/task"
import { ROOT_AREAS } from "@/features/tasks/types/task"

type ProjectSortBy = "priority" | "alpha" | "most_open" | "least_open" | "most_progress" | "least_progress"
const PROJECT_SORT_LABELS: Record<ProjectSortBy, string> = {
  priority: "Prioridad (orden del plan)",
  alpha: "A → Z",
  most_open: "Más tareas abiertas",
  least_open: "Menos tareas abiertas",
  most_progress: "Más avanzados",
  least_progress: "Menos avanzados",
}

type FilterValue = ParaStatus | "all"

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "active", label: "En progreso" },
  { value: "paused", label: "En pausa" },
  { value: "completed", label: "Completados" },
  { value: "all", label: "Todos" },
]

type ProjectMetrics = {
  total: number
  done: number
  next: number
  waiting: number
  inbox: number
  someday: number
}

function metricsFor(projectId: string, tasks: Task[]): ProjectMetrics {
  const ts = tasks.filter((t) => t.paraId === projectId)
  const m: ProjectMetrics = { total: ts.length, done: 0, next: 0, waiting: 0, inbox: 0, someday: 0 }
  for (const t of ts) {
    if (t.status in m) m[t.status as keyof ProjectMetrics]++
  }
  return m
}

export function ProjectsOverview() {
  const init = useTaskStore((s) => s.init)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)
  const error = useTaskStore((s) => s.error)
  const updateParaItem = useTaskStore((s) => s.updateParaItem)

  const [filter, setFilter] = useState<FilterValue>("active")
  const [areaFilter, setAreaFilter] = useState<string | "all">("all")
  const [sortBy, setSortBy] = useState<ProjectSortBy>("priority")

  useEffect(() => {
    init()
  }, [init])

  const allProjects = paraItems.filter((p): p is ParaItem => p.type === "project")
  const byStatus = filter === "all" ? allProjects : allProjects.filter((p) => p.status === filter)
  const byArea = areaFilter === "all" ? byStatus : byStatus.filter((p) => p.parentId === areaFilter)

  const visible = useMemo(() => {
    const items = [...byArea]
    items.sort((a, b) => {
      const ma = metricsFor(a.id, tasks)
      const mb = metricsFor(b.id, tasks)
      const openA = ma.total - ma.done
      const openB = mb.total - mb.done
      const pctA = ma.total === 0 ? 0 : ma.done / ma.total
      const pctB = mb.total === 0 ? 0 : mb.done / mb.total
      switch (sortBy) {
        case "priority": {
          // Orden definido por el usuario en el plan (display_order asc).
          // Proyectos sin display_order van al final.
          const oa = (a as ParaItem & { displayOrder?: number | null }).displayOrder ?? 999
          const ob = (b as ParaItem & { displayOrder?: number | null }).displayOrder ?? 999
          if (oa !== ob) return oa - ob
          return a.name.localeCompare(b.name)
        }
        case "alpha":
          return a.name.localeCompare(b.name)
        case "most_open":
          return openB - openA
        case "least_open":
          return openA - openB
        case "most_progress":
          return pctB - pctA
        case "least_progress":
          return pctA - pctB
        default:
          return 0
      }
    })
    return items
  }, [byArea, tasks, sortBy])

  const activeAreaName = areaFilter === "all"
    ? null
    : ROOT_AREAS.find((a) => a.id === areaFilter)?.name ?? "Área"

  const counts = {
    all: allProjects.length,
    active: allProjects.filter((p) => p.status === "active").length,
    paused: allProjects.filter((p) => p.status === "paused").length,
    completed: allProjects.filter((p) => p.status === "completed").length,
  }

  async function toggleComplete(project: ParaItem, e: React.MouseEvent | React.ChangeEvent) {
    e.preventDefault()
    e.stopPropagation()
    const nextStatus: ParaStatus = project.status === "completed" ? "active" : "completed"
    try {
      await updateParaItem(project.id, { status: nextStatus })
    } catch {
      // store ya hace revert + setea error
    }
  }

  /**
   * Cambia status libremente. El usuario tiene control total: active / paused / completed.
   * Se invoca desde el menu de la card.
   */
  async function setProjectStatus(project: ParaItem, status: ParaStatus, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (project.status === status) return
    try {
      await updateParaItem(project.id, { status })
    } catch {
      // store ya hace revert + setea error
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border bg-background px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Proyectos</h1>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* Filtro área */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50">
                  <LayoutGridIcon className="h-3 w-3" />
                  {activeAreaName ?? "Área"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAreaFilter("all")}>Todas</DropdownMenuItem>
                {ROOT_AREAS.map((a) => (
                  <DropdownMenuItem key={a.id} onClick={() => setAreaFilter(a.id)}>
                    {a.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50">
                  <ArrowDownUp className="h-3 w-3" />
                  {PROJECT_SORT_LABELS[sortBy]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(PROJECT_SORT_LABELS) as ProjectSortBy[]).map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setSortBy(s)}>
                    {PROJECT_SORT_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle estado */}
            <div className="flex items-center gap-1 rounded-md bg-muted/50 p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    filter === f.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}{" "}
                  <span className="font-mono tabular-nums text-muted-foreground">
                    ({counts[f.value]})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-mobile-nav md:p-6">
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && !initialized ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {filter === "active" && "No tienes proyectos en progreso."}
            {filter === "completed" && "No hay proyectos completados todavía."}
            {filter === "all" && "No hay proyectos. Crea uno desde Tareas."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => {
              const m = metricsFor(p.id, tasks)
              const pct = m.total === 0 ? 0 : Math.round((m.done / m.total) * 100)
              const isDone = p.status === "completed"
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className={cn(
                    "group rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-md",
                    isDone && "opacity-70"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={(e) => toggleComplete(p, e)}
                      aria-label={isDone ? "Marcar como en progreso" : "Marcar como completado"}
                      title={isDone ? "Marcar como en progreso" : "Marcar como completado"}
                      className="mt-0.5 shrink-0 rounded-full text-muted-foreground hover:text-primary"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>

                    <h2
                      className={cn(
                        "flex-1 font-medium leading-tight group-hover:text-primary",
                        isDone && "line-through"
                      )}
                    >
                      {p.name}
                    </h2>

                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-mono tabular-nums text-muted-foreground">
                      {pct}%
                    </span>

                    {/* Menú de status: cambia libremente entre active / paused / completed */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                          aria-label="Cambiar estado del proyecto"
                          title="Cambiar estado del proyecto"
                          className="shrink-0 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={(e) => setProjectStatus(p, "active", e as React.MouseEvent)}>
                          <Play className="h-3.5 w-3.5 mr-2" /> En progreso
                          {p.status === "active" && <span className="ml-auto text-[10px] text-muted-foreground">actual</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => setProjectStatus(p, "paused", e as React.MouseEvent)}>
                          <Pause className="h-3.5 w-3.5 mr-2" /> En pausa
                          {p.status === "paused" && <span className="ml-auto text-[10px] text-muted-foreground">actual</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => setProjectStatus(p, "completed", e as React.MouseEvent)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Completado
                          {p.status === "completed" && <span className="ml-auto text-[10px] text-muted-foreground">actual</span>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full transition-all",
                        isDone ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <dl className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Total</dt>
                      <dd className="font-medium">{m.total}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Next</dt>
                      <dd className="font-medium text-blue-600 dark:text-blue-400">{m.next}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Waiting</dt>
                      <dd className="font-medium text-amber-600 dark:text-amber-400">{m.waiting}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Done</dt>
                      <dd className="font-medium text-emerald-600 dark:text-emerald-400">{m.done}</dd>
                    </div>
                  </dl>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
