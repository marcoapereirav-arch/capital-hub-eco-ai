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
import { PageContainer } from "@/components/ui/page-container"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { cn } from "@/lib/utils"
import type { ParaItem, ParaStatus, ParaPriority, Task } from "@/features/tasks/types/task"
import { ROOT_AREAS, PARA_PRIORITY_RANK, PARA_PRIORITY_LABELS, PARA_PRIORITY_COLORS } from "@/features/tasks/types/task"
import { Flame, Star, Minus, Snowflake } from "lucide-react"

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
          // Orden por prioridad MANUAL del usuario (Urgente > Importante > Normal > Baja).
          // Dentro de la misma prioridad, por display_order asc, después por nombre.
          const pa = PARA_PRIORITY_RANK[a.priority ?? "normal"]
          const pb = PARA_PRIORITY_RANK[b.priority ?? "normal"]
          if (pa !== pb) return pa - pb
          const oa = a.displayOrder ?? 999
          const ob = b.displayOrder ?? 999
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

  /**
   * Cambia prioridad libremente. Se reordena solo (sort actual = "priority" por default).
   */
  async function setProjectPriority(project: ParaItem, priority: ParaPriority, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (project.priority === priority) return
    try {
      await updateParaItem(project.id, { priority })
    } catch {
      // store ya hace revert + setea error
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border bg-background px-safe">
        <div className="px-4 py-3 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 shrink-0 text-primary" />
              <h1 className="text-lg font-semibold tracking-tight">Proyectos</h1>
            </div>

            {/* En telefono la barra se parte en dos lineas: arriba los dos
                desplegables a 44 puntos, debajo la tira de estados deslizable.
                Antes eran cinco piezas en una fila que no cabia en 375 puntos. */}
            <div className="flex gap-2 md:ml-auto md:flex-wrap md:items-center">
              {/* Filtro área */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-[15px] text-foreground active:bg-muted md:h-8 md:flex-none md:justify-start md:border-transparent md:text-sm md:text-muted-foreground md:hover:bg-muted md:hover:text-foreground">
                    <LayoutGridIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{activeAreaName ?? "Área"}</span>
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
                  <button className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-[15px] text-foreground active:bg-muted md:h-8 md:flex-none md:justify-start md:border-transparent md:text-sm md:text-muted-foreground md:hover:bg-muted md:hover:text-foreground">
                    <ArrowDownUp className="h-4 w-4 shrink-0" />
                    <span className="truncate">{PROJECT_SORT_LABELS[sortBy]}</span>
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
            </div>

            {/* Toggle estado */}
            <div className="-mx-1 flex snap-x gap-1 overflow-x-auto px-1 md:mx-0 md:overflow-visible md:rounded-lg md:bg-muted/50 md:p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "h-11 shrink-0 snap-start rounded-lg px-3 text-[15px] font-medium whitespace-nowrap transition-colors md:h-8 md:px-2.5 md:text-sm",
                    filter === f.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground md:hover:text-foreground"
                  )}
                >
                  {f.label}{" "}
                  <span className="tabular-nums text-muted-foreground">
                    ({counts[f.value]})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-overscroll">
        <PageContainer>
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[15px] text-destructive">
              {error}
            </div>
          )}

          {loading && !initialized ? (
            <div className="text-[15px] text-muted-foreground">Cargando…</div>
          ) : visible.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                {filter === "active" && "No tienes proyectos en progreso."}
                {filter === "completed" && "No hay proyectos completados todavía."}
                {filter === "all" && "No hay proyectos. Crea uno desde Tareas."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => {
                const m = metricsFor(p.id, tasks)
                const pct = m.total === 0 ? 0 : Math.round((m.done / m.total) * 100)
                const isDone = p.status === "completed"
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className={cn(
                      "group rounded-lg border border-border bg-card p-4 transition active:bg-muted md:hover:border-primary/50 md:hover:shadow-md",
                      isDone && "opacity-70"
                    )}
                  >
                    {/* Fila 1: marcar hecho + titulo. Las acciones bajan a la fila 2
                        para que en 375 puntos el titulo no quede en una palabra. */}
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={(e) => toggleComplete(p, e)}
                        aria-label={isDone ? "Marcar como en progreso" : "Marcar como completado"}
                        title={isDone ? "Marcar como en progreso" : "Marcar como completado"}
                        className="-my-1 -ml-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:my-0 md:ml-0 md:size-6 md:hover:text-primary"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>

                      <h2
                        className={cn(
                          "min-w-0 flex-1 pt-2.5 text-[15px] leading-tight font-medium md:pt-0 md:group-hover:text-primary",
                          isDone && "line-through"
                        )}
                      >
                        {p.name}
                      </h2>

                      <span className="shrink-0 rounded-sm bg-muted px-2 py-0.5 text-sm tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Badge de prioridad clicable - cambia la prioridad inline */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                            aria-label="Cambiar prioridad"
                            title={`Prioridad: ${PARA_PRIORITY_LABELS[p.priority ?? "normal"]}`}
                            className={cn(
                              "inline-flex h-11 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-sm transition-colors md:h-7 md:hover:opacity-80",
                              PARA_PRIORITY_COLORS[p.priority ?? "normal"]
                            )}
                          >
                            {p.priority === "urgent" && <Flame className="h-3.5 w-3.5 shrink-0" />}
                            {p.priority === "important" && <Star className="h-3.5 w-3.5 shrink-0" />}
                            {(p.priority === "normal" || !p.priority) && <Minus className="h-3.5 w-3.5 shrink-0" />}
                            {p.priority === "low" && <Snowflake className="h-3.5 w-3.5 shrink-0" />}
                            {PARA_PRIORITY_LABELS[p.priority ?? "normal"]}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                          <DropdownMenuItem onClick={(e) => setProjectPriority(p, "urgent", e as React.MouseEvent)}>
                            <Flame className="mr-2 h-4 w-4 text-destructive" /> Urgente
                            {p.priority === "urgent" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => setProjectPriority(p, "important", e as React.MouseEvent)}>
                            <Star className="mr-2 h-4 w-4 text-warn" /> Importante
                            {p.priority === "important" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => setProjectPriority(p, "normal", e as React.MouseEvent)}>
                            <Minus className="mr-2 h-4 w-4 text-muted-foreground" /> Normal
                            {(p.priority === "normal" || !p.priority) && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => setProjectPriority(p, "low", e as React.MouseEvent)}>
                            <Snowflake className="mr-2 h-4 w-4 text-muted-foreground" /> Baja
                            {p.priority === "low" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Menú de status: cambia libremente entre active / paused / completed */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                            aria-label="Cambiar estado del proyecto"
                            title="Cambiar estado del proyecto"
                            className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:size-8 md:hover:bg-secondary/60 md:hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={(e) => setProjectStatus(p, "active", e as React.MouseEvent)}>
                            <Play className="mr-2 h-4 w-4" /> En progreso
                            {p.status === "active" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => setProjectStatus(p, "paused", e as React.MouseEvent)}>
                            <Pause className="mr-2 h-4 w-4" /> En pausa
                            {p.status === "paused" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => setProjectStatus(p, "completed", e as React.MouseEvent)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Completado
                            {p.status === "completed" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                      <div>
                        <dt className="text-muted-foreground">Total</dt>
                        <dd className="font-medium tabular-nums">{m.total}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Next</dt>
                        <dd className="font-medium tabular-nums text-foreground">{m.next}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Waiting</dt>
                        <dd className="font-medium tabular-nums text-warn">{m.waiting}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Done</dt>
                        <dd className="font-medium tabular-nums text-primary">{m.done}</dd>
                      </div>
                    </dl>
                  </Link>
                )
              })}
            </div>
          )}
        </PageContainer>
      </div>
    </div>
  )
}
