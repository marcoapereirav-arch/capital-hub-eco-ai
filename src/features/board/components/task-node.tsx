"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Flame, Circle, CheckCircle2, Hourglass, Moon, Inbox, Calendar, Zap } from "lucide-react"
import type { TaskWithDeps } from "../types/board"
import { doneOpacity } from "../services/done-opacity"
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
  marco: "bg-blue-500/30 text-blue-100 border-blue-400/50",
  adrian: "bg-amber-500/30 text-amber-100 border-amber-400/50",
  equipo: "bg-purple-500/30 text-purple-100 border-purple-400/50",
}

const PRIORITY_SIZE = {
  urgent: { w: 220, py: "py-3" },
  high: { w: 200, py: "py-2.5" },
  normal: { w: 180, py: "py-2" },
  low: { w: 160, py: "py-1.5" },
}

const STATUS_BG: Record<string, string> = {
  done: "bg-green-600/40",
  next: "bg-blue-600/40",
  waiting: "bg-yellow-600/35",
  someday: "bg-zinc-600/30",
  inbox: "bg-zinc-700/40",
}

const STATUS_ICON = {
  done: <CheckCircle2 className="h-3 w-3 text-green-300" />,
  next: <Circle className="h-3 w-3 text-blue-300 fill-blue-300/40" />,
  waiting: <Hourglass className="h-3 w-3 text-yellow-300" />,
  someday: <Moon className="h-3 w-3 text-zinc-300" />,
  inbox: <Inbox className="h-3 w-3 text-zinc-400" />,
}

const STATUS_TEXT_LABEL: Record<string, string> = {
  done: "✓ done",
  next: "▶ activo",
  waiting: "⏸ waiting",
  someday: "○ someday",
  inbox: "□ inbox",
}

export function TaskNode({ data }: NodeProps) {
  const { task, projectColor } = data as unknown as TaskNodeData
  const isDone = task.status === "done"
  const isNext = task.status === "next"
  const isWaiting = task.status === "waiting"
  const isUrgent = task.priority === "urgent"
  const isInProgress = task.isInProgress
  const sizeCfg = PRIORITY_SIZE[task.priority]

  // Opacidad de dones por antigüedad
  const opacity = isDone ? doneOpacity(task.completedAt) : 1

  return (
    <div
      style={{
        width: sizeCfg.w,
        borderColor: projectColor,
        opacity,
        ...(isInProgress && {
          boxShadow:
            "0 0 0 2px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)",
        }),
      }}
      className={cn(
        "rounded-md border-2 shadow-md transition-all hover:shadow-lg hover:scale-[1.03] cursor-pointer",
        STATUS_BG[task.status],
        sizeCfg.py,
        "px-3",
        isNext && !isInProgress && "ring-1 ring-blue-300/40",
        isInProgress && "animate-pulse",
        isUrgent && !isDone && !isInProgress && "shadow-orange-500/30 shadow-lg",
        isWaiting && "border-dashed"
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />

      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">
          {isInProgress ? <Zap className="h-3 w-3 text-cyan-300" /> : STATUS_ICON[task.status]}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-heading text-[11px] leading-tight font-medium",
              isDone ? "line-through text-white/70" : "text-white"
            )}
          >
            {task.title.length > 70 ? task.title.slice(0, 67) + "..." : task.title}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              {isUrgent && !isDone && <Flame className="h-3 w-3 text-orange-300" />}
              <span
                className={cn(
                  "rounded-sm border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide",
                  ASSIGNEE_BG[task.assignee]
                )}
              >
                {ASSIGNEE_INITIALS[task.assignee] ?? task.assignee.slice(0, 2).toUpperCase()}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-wide text-white/60">
                {isInProgress ? "⚡ EN VIVO" : STATUS_TEXT_LABEL[task.status]}
              </span>
            </div>
            {task.dueDate && (
              <span className="flex items-center gap-1 font-mono text-[8px] text-white/70 bg-white/10 px-1 py-0.5 rounded-sm">
                <Calendar className="h-2.5 w-2.5" />
                {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
