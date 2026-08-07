"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Inbox,
  Zap,
  Clock,
  Bookmark,
  CheckCircle2,
  Calendar,
} from "lucide-react"
import { useTaskStore } from "../store/task-store"
import type { GTDStatus, Priority, Task } from "../types/task"
import { GTD_LABELS, PRIORITY_LABELS } from "../types/task"

const STATUS_ICONS: Record<GTDStatus, typeof Inbox> = {
  inbox: Inbox,
  next: Zap,
  waiting: Clock,
  someday: Bookmark,
  done: CheckCircle2,
}

// El punto de prioridad usa los tokens del tema: verde de marca para lo urgente y
// grises de la marca para el resto. Antes rebajaba el token de texto (/40, /20), que
// sobre el fondo carbon queda por debajo del minimo de contraste.
const PRIORITY_DOT: Record<Priority, string> = {
  urgent: "bg-primary",
  high: "bg-foreground",
  normal: "bg-muted-foreground",
  low: "bg-border",
}

function initials(assignee: Task["assignee"]): string {
  return assignee === "marco" ? "MA" : assignee === "adrian" ? "AV" : "EQ"
}

function formatDue(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
}

export function TaskList() {
  // Subscribe to reactive deps for re-renders on filter/task changes
  const allTasks = useTaskStore((s) => s.tasks)
  const filters = useTaskStore((s) => s.filters)
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks)
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask)
  const paraItems = useTaskStore((s) => s.paraItems)
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId)
  void allTasks; void filters
  const tasks = getFilteredTasks()

  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-[15px] text-muted-foreground">Sin tareas</p>
      </div>
    )
  }

  return (
    <>
      {/* ================= TELEFONO: una ficha por tarea =================
          La rejilla de cinco columnas de abajo necesita unos 464 puntos. En un
          telefono de 375 las columnas de Prioridad y Asignado no se veian
          pequenas: DESAPARECIAN, porque el marco del OS recorta lo que se sale.
          Aqui se rehace como lista de fichas con los tres datos que importan. */}
      <ul className="divide-y divide-border rounded-lg border border-border md:hidden">
        {tasks.map((task) => {
          const StatusIcon = STATUS_ICONS[task.status]
          const paraItem = task.paraId
            ? paraItems.find((p) => p.id === task.paraId)
            : null

          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => setSelectedTask(task.id)}
                className={cn(
                  "flex min-h-[56px] w-full flex-col gap-1.5 px-4 py-3 text-left active:bg-muted",
                  selectedTaskId === task.id && "bg-muted"
                )}
              >
                <span className="flex items-start gap-2">
                  <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} />
                  <span
                    className={cn(
                      "line-clamp-2 min-w-0 flex-1 text-[15px] font-medium",
                      task.status === "done"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                  {/* 28 puntos, no 20: "MA" en semibold a 14 puntos mide unos 21
                      de ancho y el circulo no recorta, asi que a 20 las letras se
                      salian encima del titulo. Se agranda el circulo, no la
                      letra, que ya esta en el minimo legible. */}
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
                      {initials(task.assignee)}
                    </AvatarFallback>
                  </Avatar>
                </span>

                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-3.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                    {GTD_LABELS[task.status]}
                  </span>
                  <span>{PRIORITY_LABELS[task.priority]}</span>
                  {paraItem && <span className="min-w-0 truncate">{paraItem.name}</span>}
                  {task.dueDate && (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDue(task.dueDate)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* ================= ESCRITORIO: la rejilla de columnas ================= */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        {/* Header */}
        <div className="grid md:grid-cols-[1fr_120px_100px_100px_80px] gap-2 border-b border-border bg-secondary/30 px-4 py-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Tarea
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            Proyecto / Area
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            Estado
          </span>
          <span className="text-sm font-semibold text-muted-foreground">
            Prioridad
          </span>
          <span className="text-right text-sm font-semibold text-muted-foreground">
            Asignado
          </span>
        </div>

        {/* Rows */}
        {tasks.map((task) => {
          const StatusIcon = STATUS_ICONS[task.status]
          const paraItem = task.paraId
            ? paraItems.find((p) => p.id === task.paraId)
            : null

          return (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task.id)}
              className={cn(
                "grid cursor-pointer md:grid-cols-[1fr_120px_100px_100px_80px] gap-2 border-b border-border px-4 py-2.5 transition-colors hover:bg-muted/30",
                selectedTaskId === task.id && "bg-muted/50"
              )}
            >
              {/* Title + due date */}
              <div className="flex min-w-0 items-center gap-2">
                <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} />
                <span
                  className={cn(
                    "truncate text-sm",
                    task.status === "done"
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {task.title}
                </span>
                {task.dueDate && (
                  <span className="flex shrink-0 items-center gap-0.5 text-sm tabular-nums text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDue(task.dueDate)}
                  </span>
                )}
              </div>

              {/* PARA context */}
              <div className="flex min-w-0 items-center">
                {paraItem ? (
                  <Badge
                    variant="outline"
                    className="max-w-full truncate border-border text-sm text-muted-foreground"
                  >
                    {paraItem.name}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                <StatusIcon className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {GTD_LABELS[task.status]}
                </span>
              </div>

              {/* Priority */}
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-end">
                {/* Mismo motivo que en la lista del telefono: a 20 puntos las dos
                    iniciales de 14 se salen del circulo. */}
                <Avatar className="size-7">
                  <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
                    {initials(task.assignee)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
