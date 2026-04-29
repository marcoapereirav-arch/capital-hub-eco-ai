"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Flame, Circle, CheckCircle2, Hourglass, Moon } from "lucide-react"
import type { TaskWithDeps } from "../types/board"
import { cn } from "@/lib/utils"

type TaskNodeData = {
  task: TaskWithDeps
  projectColor: string
}

const ASSIGNEE_INITIALS: Record<string, string> = {
  marco: "MA",
  adrian: "AV",
  equipo: "EQ",
}

const ASSIGNEE_BG: Record<string, string> = {
  marco: "bg-blue-500/30 text-blue-200 border-blue-400/40",
  adrian: "bg-amber-500/30 text-amber-200 border-amber-400/40",
  equipo: "bg-purple-500/30 text-purple-200 border-purple-400/40",
}

const PRIORITY_SIZE = {
  urgent: { w: 220, py: "py-3" },
  high: { w: 200, py: "py-2.5" },
  normal: { w: 180, py: "py-2" },
  low: { w: 160, py: "py-1.5" },
}

const STATUS_ICON = {
  inbox: <Circle className="h-3 w-3 text-zinc-400" />,
  next: <Circle className="h-3 w-3 text-blue-400 fill-blue-400/30" />,
  waiting: <Hourglass className="h-3 w-3 text-amber-400" />,
  someday: <Moon className="h-3 w-3 text-purple-400" />,
  done: <CheckCircle2 className="h-3 w-3 text-zinc-500" />,
}

export function TaskNode({ data }: NodeProps) {
  const { task, projectColor } = data as unknown as TaskNodeData
  const isDone = task.status === "done"
  const isWaiting = task.status === "waiting"
  const isUrgent = task.priority === "urgent"
  const sizeCfg = PRIORITY_SIZE[task.priority]

  return (
    <div
      style={{
        width: sizeCfg.w,
        borderColor: projectColor + (isDone ? "30" : "80"),
        opacity: isDone ? 0.4 : 1,
      }}
      className={cn(
        "rounded-md border-2 bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]",
        sizeCfg.py,
        "px-3",
        task.status === "next" && "ring-1 ring-blue-400/30",
        isUrgent && !isDone && "shadow-orange-500/20 shadow-lg",
        isWaiting && "border-dashed"
      )}
    >
      {/* Handles invisibles para que las edges se conecten */}
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />

      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{STATUS_ICON[task.status]}</div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-heading text-[11px] leading-tight font-medium",
              isDone ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {task.title.length > 70 ? task.title.slice(0, 67) + "..." : task.title}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              {isUrgent && !isDone && <Flame className="h-3 w-3 text-orange-400" />}
              <span
                className={cn(
                  "rounded-sm border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide",
                  ASSIGNEE_BG[task.assignee]
                )}
              >
                {ASSIGNEE_INITIALS[task.assignee] ?? task.assignee.slice(0, 2).toUpperCase()}
              </span>
            </div>
            {task.dueDate && (
              <span className="font-mono text-[8px] text-muted-foreground/70">
                {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
