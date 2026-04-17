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
import type { GTDStatus, Priority } from "../types/task"
import { GTD_LABELS, PRIORITY_LABELS } from "../types/task"

const STATUS_ICONS: Record<GTDStatus, typeof Inbox> = {
  inbox: Inbox,
  next: Zap,
  waiting: Clock,
  someday: Bookmark,
  done: CheckCircle2,
}

const PRIORITY_DOT: Record<Priority, string> = {
  urgent: "bg-foreground",
  high: "bg-foreground/60",
  normal: "bg-muted-foreground/40",
  low: "bg-muted-foreground/20",
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
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-muted-foreground/40">Sin tareas</span>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_100px_100px_80px] gap-2 px-4 py-2 border-b border-border bg-secondary/30">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Tarea
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Proyecto / Area
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Estado
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Prioridad
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground text-right">
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
              "grid grid-cols-[1fr_120px_100px_100px_80px] gap-2 px-4 py-2.5 border-b border-border/50 cursor-pointer transition-colors hover:bg-accent/30",
              selectedTaskId === task.id && "bg-accent/50"
            )}
          >
            {/* Title + due date */}
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
              <span
                className={cn(
                  "text-sm truncate",
                  task.status === "done"
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {task.title}
              </span>
              {task.dueDate && (
                <span className="flex items-center gap-0.5 shrink-0 font-mono text-[9px] text-muted-foreground/50">
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(task.dueDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>

            {/* PARA context */}
            <div className="flex items-center">
              {paraItem ? (
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] px-1 py-0 border-border text-muted-foreground truncate max-w-full"
                >
                  {paraItem.name}
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground/30">—</span>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <StatusIcon className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground">
                {GTD_LABELS[task.status]}
              </span>
            </div>

            {/* Priority */}
            <div className="flex items-center">
              <span className="font-mono text-[10px] text-muted-foreground">
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>

            {/* Assignee */}
            <div className="flex items-center justify-end">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="bg-secondary text-[8px] font-mono font-semibold text-secondary-foreground">
                  {task.assignee === "marco" ? "MA" : task.assignee === "adrian" ? "AV" : "EQ"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        )
      })}
    </div>
  )
}
