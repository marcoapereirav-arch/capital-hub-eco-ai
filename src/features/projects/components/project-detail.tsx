"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Circle, Eye, EyeOff, Loader2, Pause, Play } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskList } from "@/features/tasks/components/task-list"
import { TaskDetail } from "@/features/tasks/components/task-detail"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { cn } from "@/lib/utils"
import type { ParaStatus } from "@/features/tasks/types/task"

export function ProjectDetail({ id }: { id: string }) {
  const init = useTaskStore((s) => s.init)
  const setFilters = useTaskStore((s) => s.setFilters)
  const resetFilters = useTaskStore((s) => s.resetFilters)
  const setViewMode = useTaskStore((s) => s.setViewMode)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)
  const error = useTaskStore((s) => s.error)
  const updateParaItem = useTaskStore((s) => s.updateParaItem)

  // Toggle ver/ocultar tareas hechas (default: ocultas)
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    init()
    setViewMode("list")
    // Si showDone=false aplicar filtro status='next', si true mostrar todas
    setFilters({ paraId: id, status: showDone ? "all" : "next" })
    return () => {
      resetFilters()
    }
  }, [id, init, setFilters, resetFilters, setViewMode, showDone])

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

  async function setStatus(status: ParaStatus) {
    if (!project || project.status === status) return
    try {
      await updateParaItem(project.id, { status })
    } catch {
      // store revierte y setea error
    }
  }

  const STATUS_LABEL: Record<string, string> = {
    active: "En progreso",
    paused: "En pausa",
    completed: "Completado",
  }
  const STATUS_COLOR: Record<string, string> = {
    active: "border-cyan-500/40 text-cyan-400 bg-cyan-500/[0.06]",
    paused: "border-amber-500/40 text-amber-400 bg-amber-500/[0.06]",
    completed: "border-green-500/40 text-green-400 bg-green-500/[0.06]",
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={cn(
                  "text-xl font-semibold leading-tight",
                  isDone && "line-through opacity-70"
                )}
              >
                {project.name}
              </h1>

              {/* Status badge clicable: el usuario cambia libremente desde aquí.
                  Antes solo podia desde el menu ... de la card en /projects.
                  Ahora también desde el detail directo. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider transition-colors hover:opacity-80",
                      STATUS_COLOR[project.status] ?? "border-border/40 text-muted-foreground"
                    )}
                    title="Cambiar estado del proyecto"
                  >
                    {project.status === "active" && <Play className="h-3 w-3" />}
                    {project.status === "paused" && <Pause className="h-3 w-3" />}
                    {project.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                    {STATUS_LABEL[project.status] ?? project.status}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem onClick={() => setStatus("active")}>
                    <Play className="h-3.5 w-3.5 mr-2" /> En progreso
                    {project.status === "active" && <span className="ml-auto text-[10px] text-muted-foreground">actual</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("paused")}>
                    <Pause className="h-3.5 w-3.5 mr-2" /> En pausa
                    {project.status === "paused" && <span className="ml-auto text-[10px] text-muted-foreground">actual</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("completed")}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Completado
                    {project.status === "completed" && <span className="ml-auto text-[10px] text-muted-foreground">actual</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {total} tareas · {doneCount} hechas ({pct}%) · {nextCount} pendientes ahora
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

      {/* Toolbar con toggle hechas/pendientes */}
      <div className="shrink-0 border-b border-border px-4 py-2 md:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDone(false)}
            className={cn(
              "rounded-sm text-[10px] font-mono uppercase tracking-wider px-2 py-1 border transition-colors",
              !showDone
                ? "border-foreground text-foreground bg-card"
                : "border-border/40 text-muted-foreground hover:bg-card/50"
            )}
          >
            Pendientes ({nextCount})
          </button>
          <button
            onClick={() => setShowDone(true)}
            className={cn(
              "rounded-sm text-[10px] font-mono uppercase tracking-wider px-2 py-1 border transition-colors",
              showDone
                ? "border-foreground text-foreground bg-card"
                : "border-border/40 text-muted-foreground hover:bg-card/50"
            )}
          >
            Todas ({total})
          </button>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {showDone ? <Eye className="h-3 w-3 inline mr-1" /> : <EyeOff className="h-3 w-3 inline mr-1" />}
          {showDone ? "mostrando hechas" : "ocultas hechas"}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto p-3 pb-mobile-nav md:p-4">
        {loading && !initialized ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Cargando tareas…
          </div>
        ) : projectTasks.length === 0 ? (
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
