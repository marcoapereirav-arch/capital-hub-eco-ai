"use client"

import { useMemo, useState } from "react"
import { Zap, Flame, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useReactFlow } from "@xyflow/react"
import type { TaskWithDeps } from "../types/board"
import { cn } from "@/lib/utils"

interface PriorityQueueProps {
  tasks: TaskWithDeps[]
  onSelectTask: (task: TaskWithDeps) => void
}

const ASSIGNEE_INITIALS: Record<string, string> = { marco: "MA", adrian: "AV", equipo: "EQ", ai: "AI" }

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

export function PriorityQueue({ tasks, onSelectTask }: PriorityQueueProps) {
  const [collapsed, setCollapsed] = useState(true)
  const { fitView, setCenter, getNode } = useReactFlow()

  const groups = useMemo(() => {
    const live = tasks.filter((t) => t.isInProgress && t.status !== "done")
    const next = tasks
      .filter((t) => t.status === "next" && !t.isInProgress)
      .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9))
    const waiting = tasks
      .filter((t) => t.status === "waiting")
      .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9))

    return {
      live,
      urgent: next.filter((t) => t.priority === "urgent"),
      high: next.filter((t) => t.priority === "high"),
      normal: next.filter((t) => t.priority === "normal"),
      low: next.filter((t) => t.priority === "low"),
      waiting,
    }
  }, [tasks])

  function focusNode(task: TaskWithDeps) {
    const node = getNode(task.id)
    if (node) {
      // Zoom dramático al nodo y abrir drawer
      setCenter(
        node.position.x + (node.measured?.width ?? 180) / 2,
        node.position.y + (node.measured?.height ?? 60) / 2,
        { zoom: 1.4, duration: 600 }
      )
    }
    onSelectTask(task)
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card/95 px-3 text-[15px] shadow-md backdrop-blur active:bg-secondary md:h-8 md:px-2.5 md:text-sm md:hover:bg-secondary"
        title="Abrir lista de tareas por prioridad"
      >
        <ChevronRight className="h-4 w-4 shrink-0" />
        <span>Lista de tareas</span>
        {groups.live.length > 0 && (
          <span className="flex items-center gap-0.5 rounded-sm bg-primary px-1.5 py-0.5 text-sm font-bold tabular-nums text-primary-foreground">
            <Zap className="h-3 w-3 fill-current" />
            {groups.live.length}
          </span>
        )}
      </button>
    )
  }

  return (
    // El panel nunca puede ser mas ancho que la pantalla: en un telefono de 375
    // puntos un ancho fijo de 288 dejaba el board debajo sin nada de margen.
    <div className="max-h-[calc(100dvh-9rem)] w-[min(18rem,calc(100vw-3rem))] overflow-y-auto no-overscroll rounded-lg border border-border bg-card/95 shadow-2xl backdrop-blur">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-card/95 px-3 py-2 backdrop-blur">
        <span className="min-w-0 truncate font-heading text-sm font-semibold">Lista de tareas por prioridad</span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => fitView({ padding: 0.15, duration: 600 })}
            className="h-11 rounded-lg border border-border bg-secondary px-2 text-sm text-muted-foreground md:h-7 md:hover:text-foreground"
            title="Centrar todo el board"
          >
            Centrar
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground active:bg-secondary md:size-7 md:hover:bg-secondary md:hover:text-foreground"
            title="Cerrar lista"
            aria-label="Cerrar lista"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-2">
        <Section
          title="EN VIVO ahora"
          color="text-primary"
          empty="Ninguna tarea activa. Marca una desde su drawer."
          tasks={groups.live}
          onSelect={focusNode}
          live
        />

        <Section
          title="P0 — URGENT (24h)"
          color="text-destructive"
          empty="Sin urgentes."
          tasks={groups.urgent}
          onSelect={focusNode}
        />

        <Section
          title="P1 — HIGH (esta semana)"
          color="text-warn"
          empty="Sin highs."
          tasks={groups.high}
          onSelect={focusNode}
        />

        <Section
          title="P2 — NORMAL (2-3 semanas)"
          color="text-muted-foreground"
          empty="—"
          tasks={groups.normal}
          onSelect={focusNode}
          collapsedByDefault
        />

        <Section
          title="WAITING (bloqueadas)"
          color="text-warn"
          empty="—"
          tasks={groups.waiting}
          onSelect={focusNode}
          collapsedByDefault
        />
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  color: string
  empty: string
  tasks: TaskWithDeps[]
  onSelect: (t: TaskWithDeps) => void
  live?: boolean
  collapsedByDefault?: boolean
}

function Section({ title, color, empty, tasks, onSelect, live, collapsedByDefault }: SectionProps) {
  const [open, setOpen] = useState(!collapsedByDefault)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-lg px-1.5 text-sm font-semibold active:bg-secondary/50 md:h-8 md:hover:bg-secondary/50",
          color
        )}
      >
        <span className="min-w-0 truncate text-left">{title}</span>
        <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
          <span className="font-semibold tabular-nums">{tasks.length}</span>
          {open ? <ChevronLeft className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4 rotate-90" />}
        </span>
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5">
          {tasks.length === 0 ? (
            <li className="px-2 py-1 text-sm text-muted-foreground">{empty}</li>
          ) : (
            tasks.map((t, i) => (
              <li key={t.id}>
                <button
                  onClick={() => onSelect(t)}
                  className={cn(
                    "group flex min-h-11 w-full items-start gap-2 rounded-lg px-1.5 py-1.5 text-left text-sm active:bg-secondary md:hover:bg-secondary",
                    live && "bg-primary/10 active:bg-primary/20 md:hover:bg-primary/20"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex-shrink-0 text-sm font-bold tabular-nums",
                      live ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {live ? <Zap className="h-4 w-4 animate-pulse" /> : `${i + 1}.`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-foreground">{t.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                      <span>{ASSIGNEE_INITIALS[t.assignee] ?? t.assignee}</span>
                      {t.priority === "urgent" && (
                        <span className="flex items-center gap-0.5 text-destructive">
                          <Flame className="h-3 w-3" />
                          urgent
                        </span>
                      )}
                      {t.dueDate && (
                        <span className="flex items-center gap-0.5 tabular-nums">
                          <Clock className="h-3 w-3" />
                          {new Date(t.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
