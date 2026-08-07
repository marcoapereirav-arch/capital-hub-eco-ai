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
  ai: "AI",
}

// Todas las etiquetas del nodo pintan con los tokens del tema. Antes eran blue,
// amber, purple y cyan de Tailwind: cuatro colores que no existen en la marca.
// El unico que se distingue en verde es la IA, porque no es una persona.
const ASSIGNEE_BG: Record<string, string> = {
  marco: "border-border bg-secondary text-foreground",
  adrian: "border-border bg-secondary text-foreground",
  equipo: "border-border bg-muted text-muted-foreground",
  ai: "border-primary/50 bg-primary/20 text-primary",
}

const PRIORITY_SIZE = {
  urgent: { w: 260, py: "py-3.5", title: "text-[15px]" },
  high: { w: 215, py: "py-2.5", title: "text-sm" },
  normal: { w: 180, py: "py-2", title: "text-sm" },
  low: { w: 145, py: "py-1.5", title: "text-sm" },
}

const PRIORITY_LABEL: Record<string, { code: string; cls: string }> = {
  urgent: { code: "P0", cls: "border-destructive/60 bg-destructive/20 text-destructive" },
  high: { code: "P1", cls: "border-warn/60 bg-warn/20 text-warn" },
  normal: { code: "P2", cls: "border-border bg-muted text-foreground" },
  low: { code: "P3", cls: "border-border bg-card text-muted-foreground" },
}

// El fondo codifica el status, asi que los tres grises tienen que ser tres grises
// DISTINTOS. `secondary` y `muted` valen exactamente lo mismo en el tema, de modo
// que next y someday salian del mismo color pixel por pixel. Se reparten los tres
// niveles que si se distinguen: secondary (0.24) > popover (0.205) > card (0.185).
// Si esto cambia, hay que cambiar tambien los cuadraditos de legend-modal.tsx.
const STATUS_BG: Record<string, string> = {
  done: "bg-primary/15",
  next: "bg-secondary",
  waiting: "bg-warn/10",
  someday: "bg-card",
  inbox: "bg-popover",
}

const STATUS_ICON = {
  done: <CheckCircle2 className="h-4 w-4 text-primary" />,
  next: <Circle className="h-4 w-4 fill-foreground text-foreground" />,
  waiting: <Hourglass className="h-4 w-4 text-warn" />,
  someday: <Moon className="h-4 w-4 text-muted-foreground" />,
  inbox: <Inbox className="h-4 w-4 text-muted-foreground" />,
}

const STATUS_TEXT_LABEL: Record<string, string> = {
  done: "done",
  next: "activo",
  waiting: "waiting",
  someday: "someday",
  inbox: "inbox",
}

export function TaskNode({ data }: NodeProps) {
  const { task, projectColor } = data as unknown as TaskNodeData
  const isDone = task.status === "done"
  const isNext = task.status === "next"
  const isWaiting = task.status === "waiting"
  const isUrgent = task.priority === "urgent"
  const isInProgress = task.isInProgress
  const sizeCfg = PRIORITY_SIZE[task.priority]
  const prio = PRIORITY_LABEL[task.priority]

  // Opacidad de dones por antigüedad
  const opacity = isDone ? doneOpacity(task.completedAt) : 1

  return (
    <div
      style={{
        width: sizeCfg.w,
        borderColor: projectColor,
        opacity,
      }}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 px-3 shadow-md transition-all hover:scale-[1.03] hover:shadow-lg",
        STATUS_BG[task.status],
        sizeCfg.py,
        isNext && !isInProgress && "ring-1 ring-border",
        // Lo que se esta haciendo AHORA se marca con el verde de la marca, no con
        // una sombra cyan escrita en rgba.
        isInProgress && "animate-pulse ring-2 ring-primary",
        isUrgent && !isDone && !isInProgress && "ring-1 ring-destructive/40",
        isWaiting && "border-dashed"
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />

      {/* Badge prioridad — esquina superior izquierda, siempre visible */}
      <div className="absolute -top-2 -left-2 flex items-center gap-1">
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 text-sm font-bold shadow-sm",
            prio.cls
          )}
          title={`Prioridad: ${task.priority}`}
        >
          {prio.code}
        </span>
        {isUrgent && !isDone && (
          <Flame className="h-4 w-4 animate-pulse text-destructive" />
        )}
      </div>

      {/* Badge fecha — esquina superior derecha si tiene */}
      {task.dueDate && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 rounded-sm border border-border bg-popover px-1.5 py-0.5 text-sm tabular-nums text-foreground shadow-sm">
          <Calendar className="h-3 w-3" />
          {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
        </div>
      )}

      {/* EN VIVO badge — abajo derecha */}
      {isInProgress && (
        <div className="absolute -right-2 -bottom-2 flex items-center gap-1 rounded-sm border border-primary bg-primary px-2 py-0.5 text-sm font-bold text-primary-foreground shadow-sm">
          <Zap className="h-3 w-3 fill-current" />
          EN VIVO
        </div>
      )}

      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">
          {STATUS_ICON[task.status]}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-heading leading-tight font-medium",
              sizeCfg.title,
              isDone ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {task.title.length > 80 ? task.title.slice(0, 77) + "..." : task.title}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-sm border px-1.5 py-0.5 text-sm",
                  ASSIGNEE_BG[task.assignee]
                )}
              >
                {ASSIGNEE_INITIALS[task.assignee] ?? task.assignee.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">
                {STATUS_TEXT_LABEL[task.status]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
