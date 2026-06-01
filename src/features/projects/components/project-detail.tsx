"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Circle, Clock, Inbox, Sparkles, Zap } from "lucide-react"
import { tasksService } from "@/features/tasks/services/tasks-service"
import type { GTDStatus, ParaItem, Task } from "@/features/tasks/types/task"
import { ASSIGNEE_LABELS, GTD_LABELS } from "@/features/tasks/types/task"

const STATUS_ORDER: GTDStatus[] = ["next", "waiting", "inbox", "someday", "done"]
const STATUS_ICONS: Record<GTDStatus, typeof Circle> = {
  next: Circle,
  inbox: Inbox,
  waiting: Clock,
  someday: Sparkles,
  done: CheckCircle2,
}

export function ProjectDetail({ id }: { id: string }) {
  const [project, setProject] = useState<ParaItem | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([tasksService.listParaItems(), tasksService.listTasks()])
      .then(([paras, ts]) => {
        if (cancelled) return
        setProject(paras.find((p) => p.id === id) ?? null)
        setTasks(ts.filter((t) => t.paraId === id))
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar el proyecto")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
  }

  if (!project) {
    return (
      <div className="p-6">
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Proyectos
        </Link>
        <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
      </div>
    )
  }

  const total = tasks.length
  const doneCount = tasks.filter((t) => t.status === "done").length
  const nextCount = tasks.filter((t) => t.status === "next").length
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  const byStatus = STATUS_ORDER.map((s) => ({
    status: s,
    tasks: tasks.filter((t) => t.status === s),
  }))

  return (
    <div className="p-4 md:p-6">
      <Link
        href="/projects"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Proyectos
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} tareas · {doneCount} hechas ({pct}%) · {nextCount} pendientes ahora
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {byStatus.map(({ status, tasks: ts }) =>
          ts.length === 0 ? null : (
            <section key={status}>
              <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {(() => {
                  const I = STATUS_ICONS[status]
                  return <I className="h-3.5 w-3.5" />
                })()}
                {GTD_LABELS[status]}{" "}
                <span className="font-mono tabular-nums">({ts.length})</span>
              </h2>
              <ul className="space-y-1.5">
                {ts.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm ${
                      t.status === "done" ? "opacity-60" : ""
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground">
                      {t.id}
                    </span>
                    <span
                      className={`flex-1 ${t.status === "done" ? "line-through" : ""}`}
                    >
                      {t.title}
                    </span>
                    {t.priority === "urgent" && (
                      <Zap className="h-3.5 w-3.5 shrink-0 text-red-500" aria-label="urgent" />
                    )}
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {ASSIGNEE_LABELS[t.assignee] ?? t.assignee}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )
        )}

        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Sin tareas todavía en este proyecto.
          </div>
        )}
      </div>
    </div>
  )
}
