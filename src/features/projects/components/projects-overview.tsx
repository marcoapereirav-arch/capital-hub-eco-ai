"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, FolderKanban } from "lucide-react"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { cn } from "@/lib/utils"
import type { ParaItem, ParaStatus, Task } from "@/features/tasks/types/task"

type FilterValue = ParaStatus | "all"

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "active", label: "En progreso" },
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

  useEffect(() => {
    init()
  }, [init])

  const allProjects = paraItems.filter((p): p is ParaItem => p.type === "project")
  const visible = filter === "all" ? allProjects : allProjects.filter((p) => p.status === filter)

  const counts = {
    all: allProjects.length,
    active: allProjects.filter((p) => p.status === "active").length,
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

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border bg-background px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Proyectos</h1>
          </div>

          <div className="ml-auto flex items-center gap-1 rounded-md bg-muted/50 p-0.5">
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
