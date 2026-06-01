"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderKanban } from "lucide-react"
import { tasksService } from "@/features/tasks/services/tasks-service"
import type { ParaItem, Task } from "@/features/tasks/types/task"

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
  const [projects, setProjects] = useState<ParaItem[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([tasksService.listParaItems(), tasksService.listTasks()])
      .then(([paras, ts]) => {
        if (cancelled) return
        setProjects(paras.filter((p) => p.type === "project"))
        setTasks(ts)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar proyectos")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="p-4 md:p-6">
      <header className="mb-6 flex items-center gap-3">
        <FolderKanban className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <span className="text-sm text-muted-foreground">
          {loading ? "..." : `${projects.length} proyectos`}
        </span>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const m = metricsFor(p.id, tasks)
            const pct = m.total === 0 ? 0 : Math.round((m.done / m.total) * 100)
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium leading-tight group-hover:text-primary">{p.name}</h2>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
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
          {projects.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No hay proyectos todavía. Crea uno desde la página de Tareas.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
