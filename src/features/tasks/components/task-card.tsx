"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Inbox,
  Zap,
  Clock,
  Bookmark,
  CheckCircle2,
  Trash2,
  Calendar,
} from "lucide-react"
import { useTaskStore } from "../store/task-store"
import type { Task, GTDStatus, Priority } from "../types/task"
import { GTD_LABELS } from "../types/task"

const PRIORITY_STYLES: Record<Priority, string> = {
  urgent: "border-l-foreground",
  high: "border-l-foreground/60",
  normal: "border-l-border",
  low: "border-l-border/50",
}

const STATUS_ICONS: Record<GTDStatus, typeof Inbox> = {
  inbox: Inbox,
  next: Zap,
  waiting: Clock,
  someday: Bookmark,
  done: CheckCircle2,
}

export function TaskCard({ task }: { task: Task }) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask)
  const moveTask = useTaskStore((s) => s.moveTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const paraItems = useTaskStore((s) => s.paraItems)

  const paraItem = task.paraId
    ? paraItems.find((p) => p.id === task.paraId)
    : null

  return (
    <div
      onClick={() => setSelectedTask(task.id)}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-sm border border-border bg-card px-4 py-3.5 transition-colors hover:border-foreground/20",
        "border-l-2",
        PRIORITY_STYLES[task.priority]
      )}
    >
      {/* Title + menu */}
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-[13px] leading-relaxed",
            task.status === "done"
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {task.title}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Mover a</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(Object.keys(GTD_LABELS) as GTDStatus[]).map((status) => {
                  const Icon = STATUS_ICONS[status]
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation()
                        moveTask(task.id, status)
                      }}
                      disabled={task.status === status}
                    >
                      <Icon className="mr-2 h-3.5 w-3.5" />
                      {GTD_LABELS[status]}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                deleteTask(task.id)
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {paraItem && (
            <Badge
              variant="outline"
              className="font-mono text-[9px] px-1.5 py-0 border-border text-muted-foreground shrink-0"
            >
              {paraItem.name}
            </Badge>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground/50 shrink-0">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.dueDate).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>

        <Avatar className="h-5 w-5 shrink-0">
          <AvatarFallback className="bg-secondary text-[8px] font-mono font-semibold text-secondary-foreground">
            {task.assignee === "marco" ? "MA" : task.assignee === "adrian" ? "AV" : "EQ"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
