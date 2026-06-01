"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react"
import { TaskList } from "@/features/tasks/components/task-list"
import { TaskDetail } from "@/features/tasks/components/task-detail"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { cn } from "@/lib/utils"
import type { ParaStatus } from "@/features/tasks/types/task"

export function ProjectDetail({ id }: { id: string }) {
  const init = useTaskStore((s) => s.init)
  const setFilters = useTaskStore((s) => s.setFilters)
  const resetFilters = useTaskStore((s) => s.resetFilters)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)
  const error = useTaskStore((s) => s.error)
  const updateParaItem = useTaskStore((s) => s.updateParaItem)

  useEffect(() => {
    init()
    setFilters({ paraId: id })
    return () => {
      resetFilters()
    }
  }, [id, init, setFilters, resetFilters])

  const project = paraItems.find((p) => p.id === id)
  const projectTasks = tasks.filter((t) => t.paraId === id)
  const total = projectTasks.length
  const doneCount = projectTasks.filter((t) => t.status === "done").length
  const nextCount = projectTasks.filter((t) => t.status === "next").length
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const isDone = project?.status === "completed"

  async function toggleStatus() {
    if (!project) return
    const nextStatus: ParaStatus = project.status === "completed" ? "active" : "completed"
    try {
      await updateParaItem(project.id, { status: nextStatus })
    } catch {
      // store revierte y setea error
    }
  }

  if (loading && !initialized) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Proyectos
        </Link>
        <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border bg-background px-4 py-3 md:px-6">
        <Link
          href="/projects"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Proyectos
        </Link>

        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={toggleStatus}
            aria-label={isDone ? "Marcar como en progreso" : "Marcar como completado"}
            title={isDone ? "Marcar como en progreso" : "Marcar como completado"}
            className="mt-1 shrink-0 rounded-full text-muted-foreground transition hover:text-primary"
          >
            {isDone ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h1
              className={cn(
                "text-xl font-semibold leading-tight",
                isDone && "line-through opacity-70"
              )}
            >
              {project.name}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {total} tareas · {doneCount} hechas ({pct}%) · {nextCount} pendientes ahora
              {isDone && " · proyecto completado"}
            </p>
            <div className="mt-2 h-1 max-w-md overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full transition-all",
                  isDone ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="shrink-0 border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive md:px-6">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto p-3 pb-mobile-nav md:p-4">
        {projectTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Sin tareas en este proyecto todavía.
          </div>
        ) : (
          <TaskList />
        )}
      </div>

      <TaskDetail />
    </div>
  )
}
