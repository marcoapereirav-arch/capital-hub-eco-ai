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

const ASSIGNEE_INITIALS: Record<string, string> = { marco: "MA", adrian: "AV", equipo: "EQ" }

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
        className="flex items-center gap-1.5 rounded-md border border-border bg-card/95 backdrop-blur px-2.5 py-1.5 text-xs shadow-md hover:bg-secondary"
        title="Abrir lista de tareas por prioridad"
      >
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Lista de tareas</span>
        {groups.live.length > 0 && (
          <span className="flex items-center gap-0.5 rounded-full bg-cyan-500 text-cyan-950 px-1.5 py-0.5 font-mono text-[9px] font-bold">
            <Zap className="h-2.5 w-2.5 fill-cyan-950" />
            {groups.live.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="w-72 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-md border border-border bg-card/95 backdrop-blur shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-3 py-2">
        <span className="font-heading text-xs font-semibold">Lista de tareas por prioridad</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fitView({ padding: 0.15, duration: 600 })}
            className="rounded-sm border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            title="Centrar todo el board"
          >
            Centrar
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-sm p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="Cerrar lista"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 p-2 text-xs">
        <Section
          title="🔴 EN VIVO ahora"
          color="text-cyan-300"
          empty="Ninguna tarea activa. Marca una desde su drawer."
          tasks={groups.live}
          onSelect={focusNode}
          live
        />

        <Section
          title="① P0 — URGENT (24h)"
          color="text-red-300"
          empty="Sin urgentes."
          tasks={groups.urgent}
          onSelect={focusNode}
        />

        <Section
          title="② P1 — HIGH (esta semana)"
          color="text-orange-300"
          empty="Sin highs."
          tasks={groups.high}
          onSelect={focusNode}
        />

        <Section
          title="③ P2 — NORMAL (2-3 semanas)"
          color="text-zinc-300"
          empty="—"
          tasks={groups.normal}
          onSelect={focusNode}
          collapsedByDefault
        />

        <Section
          title="⏸ WAITING (bloqueadas)"
          color="text-yellow-300"
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
          "flex w-full items-center justify-between gap-2 rounded-sm px-1.5 py-1 font-mono text-[10px] uppercase tracking-wide hover:bg-secondary/50",
          color
        )}
      >
        <span className="truncate">{title}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="font-semibold">{tasks.length}</span>
          {open ? <ChevronLeft className="h-3 w-3 rotate-90" /> : <ChevronRight className="h-3 w-3 rotate-90" />}
        </span>
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5">
          {tasks.length === 0 ? (
            <li className="px-2 py-1 text-[10px] italic text-muted-foreground">{empty}</li>
          ) : (
            tasks.map((t, i) => (
              <li key={t.id}>
                <button
                  onClick={() => onSelect(t)}
                  className={cn(
                    "group flex w-full items-start gap-2 rounded-sm px-1.5 py-1.5 text-left text-[11px] hover:bg-secondary",
                    live && "bg-cyan-500/10 hover:bg-cyan-500/20"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex-shrink-0 font-mono text-[9px] font-bold",
                      live ? "text-cyan-400" : "text-muted-foreground"
                    )}
                  >
                    {live ? <Zap className="h-3 w-3 animate-pulse" /> : `${i + 1}.`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-foreground/90 group-hover:text-foreground">{t.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground">
                      <span className="font-mono">{ASSIGNEE_INITIALS[t.assignee] ?? t.assignee}</span>
                      {t.priority === "urgent" && (
                        <span className="flex items-center gap-0.5 text-orange-400">
                          <Flame className="h-2.5 w-2.5" />
                          urgent
                        </span>
                      )}
                      {t.dueDate && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
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
