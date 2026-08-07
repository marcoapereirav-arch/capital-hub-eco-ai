"use client"

import { ExternalLink, CheckCircle2, Trash2, Zap } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

const CHIP = "rounded-sm border border-border bg-secondary px-2 py-0.5 text-sm"

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
    <Sheet open onOpenChange={(abierto) => { if (!abierto) onClose() }}>
      <SheetContent
        side="bottom"
        className={cn(
          // TELEFONO: hoja inferior. Antes era un panel fijo a pantalla completa
          // sin zona segura abajo, asi que el ultimo boton quedaba debajo de la
          // franja de gestos del iPhone.
          "rounded-t-xl pb-safe-4",
          // ESCRITORIO: cajon por la derecha. Los overrides llevan el mismo
          // selector de dato que la base de sheet.tsx, porque una clase suelta
          // pierde por especificidad contra data-[side=bottom]:...
          "md:data-[side=bottom]:inset-x-auto md:data-[side=bottom]:inset-y-0",
          "md:data-[side=bottom]:right-0 md:data-[side=bottom]:left-auto",
          "md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none",
          "md:data-[side=bottom]:w-full md:data-[side=bottom]:max-w-md",
          "md:data-[side=bottom]:rounded-t-none md:data-[side=bottom]:border-t-0",
          "md:data-[side=bottom]:border-l md:data-[side=bottom]:pb-0"
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />

        <SheetHeader className="pb-0">
          <p className="text-sm text-muted-foreground">{task.id}</p>
          <SheetTitle className="font-heading text-lg font-semibold text-foreground">
            {task.title}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <span className={CHIP}>{STATUS_LABEL[task.status]}</span>
            {/* El dato sigue siendo el enum en minuscula; solo cambia como se
                pinta, para que no se lea "urgent" suelto en una fila de chips. */}
            <span className={cn(CHIP, "capitalize")}>{task.priority}</span>
            <span className={cn(CHIP, "capitalize")}>{task.assignee}</span>
            {task.dueDate && (
              <span className={cn(CHIP, "tabular-nums")}>
                {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          {task.description && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">{task.description}</p>
            </div>
          )}

          {task.dependsOn.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Dependencias</p>
              <ul className="space-y-1">
                {task.dependsOn.map((d) => (
                  <li key={d} className="rounded-lg border border-border bg-secondary/30 px-2 py-1.5 text-sm">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {task.status !== "done" && (
              <Button
                onClick={toggleInProgress}
                variant={task.isInProgress ? "default" : "outline"}
                className="justify-start text-[15px] md:text-sm"
              >
                <Zap className="mr-2 h-4 w-4" />
                {task.isInProgress ? "Trabajando AHORA — desactivar" : "Marcar: trabajando AHORA"}
              </Button>
            )}
            {task.status !== "done" && (
              <Button onClick={markDone} variant="secondary" className="justify-start text-[15px] md:text-sm">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marcar como done
              </Button>
            )}
            <Button asChild variant="ghost" className="justify-start text-[15px] md:text-sm">
              <a href="/tasks" target="_self">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ir a /tasks (vista lista)
              </a>
            </Button>
            <Button
              onClick={handleDelete}
              variant="ghost"
              className="justify-start text-[15px] text-destructive hover:bg-destructive/10 hover:text-destructive md:text-sm"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Borrar tarea
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
