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
import { PageContainer } from "@/components/ui/page-container"
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
  // Los tres estados se distinguen con los tokens del tema: verde de marca para lo
  // terminado, ambar de aviso para lo pausado y el gris de la marca para lo que
  // esta en marcha. Antes eran cyan / amber / green de Tailwind.
  const STATUS_COLOR: Record<string, string> = {
    active: "border-border text-foreground bg-muted",
    paused: "border-warn/40 text-warn bg-warn/10",
    completed: "border-primary/40 text-primary bg-primary/10",
  }

  if (loading && !initialized) {
    return (
      <div className="p-6 text-[15px] text-muted-foreground">Cargando…</div>
    )
  }

  if (!project) {
    return (
      <PageContainer narrow>
        <Link
          href="/projects"
          className="-ml-1 inline-flex h-11 items-center gap-1.5 rounded-lg px-1 text-[15px] text-muted-foreground active:bg-muted md:h-8 md:text-sm md:hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" /> Proyectos
        </Link>
        <p className="text-[15px] text-muted-foreground">Proyecto no encontrado.</p>
      </PageContainer>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border bg-background px-4 py-3 md:px-6">
        <Link
          href="/projects"
          className="-ml-1 mb-1 inline-flex h-11 items-center gap-1.5 rounded-lg px-1 text-[15px] text-muted-foreground active:bg-muted md:mb-2 md:h-8 md:text-sm md:hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" /> Proyectos
        </Link>

        <div className="flex items-start gap-2 md:gap-3">
          <button
            type="button"
            onClick={toggleStatus}
            aria-label={isDone ? "Marcar como en progreso" : "Marcar como completado"}
            title={isDone ? "Marcar como en progreso" : "Marcar como completado"}
            className="-ml-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition active:bg-muted md:ml-0 md:mt-1 md:size-6 md:hover:text-primary"
          >
            {isDone ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className={cn(
                  "min-w-0 text-xl leading-tight font-semibold tracking-tight",
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
                      "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition-colors md:h-7 md:hover:opacity-80",
                      STATUS_COLOR[project.status] ?? "border-border text-muted-foreground"
                    )}
                    title="Cambiar estado del proyecto"
                  >
                    {project.status === "active" && <Play className="h-3.5 w-3.5 shrink-0" />}
                    {project.status === "paused" && <Pause className="h-3.5 w-3.5 shrink-0" />}
                    {project.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                    {STATUS_LABEL[project.status] ?? project.status}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem onClick={() => setStatus("active")}>
                    <Play className="mr-2 h-4 w-4" /> En progreso
                    {project.status === "active" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("paused")}>
                    <Pause className="mr-2 h-4 w-4" /> En pausa
                    {project.status === "paused" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("completed")}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Completado
                    {project.status === "completed" && <span className="ml-auto text-sm text-muted-foreground">actual</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {total} tareas · {doneCount} hechas ({pct}%) · {nextCount} pendientes ahora
            </p>
            <div className="mt-2 h-1 max-w-md overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="shrink-0 border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-[15px] text-destructive md:px-6">
          {error}
        </div>
      )}

      {/* Toolbar con toggle hechas/pendientes */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 md:px-6">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDone(false)}
            className={cn(
              "h-11 rounded-lg border px-3 text-[15px] whitespace-nowrap transition-colors md:h-8 md:text-sm",
              !showDone
                ? "border-foreground bg-card text-foreground"
                : "border-border text-muted-foreground md:hover:bg-card/50"
            )}
          >
            Pendientes ({nextCount})
          </button>
          <button
            onClick={() => setShowDone(true)}
            className={cn(
              "h-11 rounded-lg border px-3 text-[15px] whitespace-nowrap transition-colors md:h-8 md:text-sm",
              showDone
                ? "border-foreground bg-card text-foreground"
                : "border-border text-muted-foreground md:hover:bg-card/50"
            )}
          >
            Todas ({total})
          </button>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {showDone ? <Eye className="h-4 w-4 shrink-0" /> : <EyeOff className="h-4 w-4 shrink-0" />}
          {showDone ? "mostrando hechas" : "ocultas hechas"}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto no-overscroll">
        <PageContainer>
          {loading && !initialized ? (
            <div className="py-12 text-center text-[15px] text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Cargando tareas…
            </div>
          ) : projectTasks.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                Sin tareas en este proyecto todavía.
              </p>
            </div>
          ) : (
            <TaskList />
          )}
        </PageContainer>
      </div>

      <TaskDetail />
    </div>
  )
}
