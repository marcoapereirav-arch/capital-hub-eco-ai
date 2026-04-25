"use client"

import { useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { TaskSidebar } from "./task-sidebar"
import { TaskBoard } from "./task-board"
import { TaskList } from "./task-list"
import { TaskDetail } from "./task-detail"
import { TaskQuickCapture } from "./task-quick-capture"
import { TaskFilters } from "./task-filters"
import { useTaskStore } from "../store/task-store"

export function TaskPage() {
  const viewMode = useTaskStore((s) => s.viewMode)
  const init = useTaskStore((s) => s.init)
  const cleanup = useTaskStore((s) => s.cleanup)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)
  const error = useTaskStore((s) => s.error)

  useEffect(() => {
    init()
    return () => cleanup()
  }, [init, cleanup])

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header — fixed at top */}
      <header className="shrink-0 flex h-14 items-center gap-3 border-b border-border px-4">
        <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="font-heading text-sm font-semibold tracking-wide uppercase text-foreground">
          Tareas
        </h1>
      </header>

      {/* Body — fills remaining space, no overflow leaks */}
      <div className="flex flex-1 min-h-0">
        {/* PARA Sidebar — fixed left, only scrolls vertically inside itself */}
        <div className="shrink-0 overflow-hidden">
          <TaskSidebar />
        </div>

        {/* Main content — contained */}
        <div className="flex flex-1 flex-col min-w-0 min-h-0">
          {/* Quick capture + filters — fixed, never scrolls */}
          <div className="shrink-0 flex flex-col gap-3 border-b border-border px-4 py-3">
            <TaskQuickCapture />
            <TaskFilters />
          </div>

          {/* Board/List — ONLY this scrolls */}
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto p-4">
            {error && (
              <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {loading && !initialized ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Cargando tareas…
              </div>
            ) : viewMode === "board" ? (
              <TaskBoard />
            ) : (
              <TaskList />
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <TaskDetail />
    </div>
  )
}
