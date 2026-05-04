"use client"

import { X, ExternalLink, CheckCircle2, Trash2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTaskStore } from "@/features/tasks/store/task-store"
import { setTaskInProgress } from "../services/board-service"
import type { TaskWithDeps } from "../types/board"

interface TaskDrawerProps {
  task: TaskWithDeps | null
  onClose: () => void
}

const STATUS_LABEL = {
  inbox: "Inbox",
  next: "Next",
  waiting: "Waiting",
  someday: "Someday",
  done: "Done",
}

export function TaskDrawer({ task, onClose }: TaskDrawerProps) {
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)

  if (!task) return null

  async function markDone() {
    if (!task) return
    await updateTask(task.id, { status: "done" })
    onClose()
  }

  async function handleDelete() {
    if (!task) return
    if (!confirm("¿Borrar esta tarea?")) return
    await deleteTask(task.id)
    onClose()
  }

  async function toggleInProgress() {
    if (!task) return
    await setTaskInProgress(task.id, !task.isInProgress)
  }

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-card shadow-2xl overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{task.id}</p>
        <button
          onClick={onClose}
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="space-y-4 p-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">{task.title}</h2>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase">
            {STATUS_LABEL[task.status]}
          </span>
          <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase">
            {task.priority}
          </span>
          <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase">
            {task.assignee}
          </span>
          {task.dueDate && (
            <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 font-mono text-[10px]">
              {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        {task.description && (
          <div className="rounded-sm border border-border bg-secondary/30 p-3">
            <p className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">{task.description}</p>
          </div>
        )}

        {task.dependsOn.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Dependencias</p>
            <ul className="space-y-1">
              {task.dependsOn.map((d) => (
                <li key={d} className="rounded-sm border border-border bg-secondary/30 px-2 py-1.5 font-mono text-[11px]">
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          {task.status !== "done" && (
            <Button
              onClick={toggleInProgress}
              variant={task.isInProgress ? "default" : "outline"}
              size="sm"
              className={task.isInProgress ? "bg-cyan-500 text-cyan-950 hover:bg-cyan-400" : ""}
            >
              <Zap className="mr-2 h-3.5 w-3.5" />
              {task.isInProgress ? "Trabajando AHORA — desactivar" : "Marcar: trabajando AHORA"}
            </Button>
          )}
          {task.status !== "done" && (
            <Button onClick={markDone} variant="secondary" size="sm">
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              Marcar como done
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <a href="/tasks" target="_self">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Ir a /tasks (vista lista)
            </a>
          </Button>
          <Button onClick={handleDelete} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Borrar tarea
          </Button>
        </div>
      </div>
    </div>
  )
}
