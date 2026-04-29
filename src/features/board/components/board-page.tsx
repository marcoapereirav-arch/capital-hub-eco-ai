"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { boardService } from "../services/board-service"
import { buildLayout } from "../services/layout"
import type { TaskWithDeps } from "../types/board"
import type { ParaItem } from "@/features/tasks/types/task"
import { TaskNode } from "./task-node"
import { ProjectNode } from "./project-node"
import { MissionNode } from "./mission-node"
import { TaskDrawer } from "./task-drawer"

const nodeTypes = {
  task: TaskNode,
  project: ProjectNode,
  mission: MissionNode,
}

type Filters = {
  hideDone: boolean
  status: "all" | "next" | "waiting" | "someday" | "done"
  assignee: "all" | "marco" | "adrian" | "equipo"
}

export function BoardPage() {
  const [tasks, setTasks] = useState<TaskWithDeps[]>([])
  const [paraItems, setParaItems] = useState<ParaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithDeps | null>(null)
  const [filters, setFilters] = useState<Filters>({
    hideDone: false,
    status: "all",
    assignee: "all",
  })

  // Carga inicial + realtime
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await boardService.load()
        if (cancelled) return
        setTasks(data.tasks)
        setParaItems(data.paraItems)
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Error cargando board")
        setLoading(false)
      }
    }

    load()

    const unsub = boardService.subscribe(() => {
      load()
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  // Filtrado
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.hideDone && t.status === "done") return false
      if (filters.status !== "all" && t.status !== filters.status) return false
      if (filters.assignee !== "all" && t.assignee !== filters.assignee) return false
      return true
    })
  }, [tasks, filters])

  // Layout calculado
  const { nodes: initialNodes, edges } = useMemo(
    () => buildLayout(filteredTasks, paraItems),
    [filteredTasks, paraItems]
  )

  // Estado local de nodos para que se puedan arrastrar
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  // Click en nodo task → abrir drawer
  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      if (node.type === "task") {
        const task = tasks.find((t) => t.id === node.id)
        if (task) setSelectedTask(task)
      }
    },
    [tasks]
  )

  // Estadísticas para el header
  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === "done").length
    const next = tasks.filter((t) => t.status === "next").length
    const waiting = tasks.filter((t) => t.status === "waiting").length
    return { total, done, next, waiting, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [tasks])

  return (
    <>
      <ShellHeader title="Board" />
      <div className="relative flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/40 px-4 py-2.5">
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono text-muted-foreground">
              <span className="text-foreground font-semibold">{stats.total}</span> tareas
            </span>
            <span className="font-mono text-muted-foreground">
              <span className="text-blue-400 font-semibold">{stats.next}</span> next
            </span>
            <span className="font-mono text-muted-foreground">
              <span className="text-amber-400 font-semibold">{stats.waiting}</span> waiting
            </span>
            <span className="font-mono text-muted-foreground">
              <span className="text-green-400 font-semibold">{stats.done}</span> done ({stats.pct}%)
            </span>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as Filters["status"] })}
              className="rounded-sm border border-border bg-secondary px-2 py-1 text-xs"
            >
              <option value="all">Todos los status</option>
              <option value="next">Solo next</option>
              <option value="waiting">Solo waiting</option>
              <option value="someday">Solo someday</option>
              <option value="done">Solo done</option>
            </select>
            <select
              value={filters.assignee}
              onChange={(e) => setFilters({ ...filters, assignee: e.target.value as Filters["assignee"] })}
              className="rounded-sm border border-border bg-secondary px-2 py-1 text-xs"
            >
              <option value="all">Todos</option>
              <option value="marco">Marco</option>
              <option value="adrian">Adrián</option>
              <option value="equipo">Equipo</option>
            </select>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={filters.hideDone}
                onChange={(e) => setFilters({ ...filters, hideDone: e.target.checked })}
                className="h-3 w-3"
              />
              Ocultar done
            </label>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <p className="font-mono text-sm text-muted-foreground">Cargando red...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-x-4 top-4 rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive z-10">
              {error}
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2.5}
            defaultEdgeOptions={{ type: "default" }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} color="#2a2d34" />
            <Controls className="!bg-card !border-border" />
            <MiniMap
              className="!bg-card !border-border"
              nodeColor={(n) => {
                if (n.type === "mission") return "#fbbf24"
                if (n.type === "project") return (n.data as { color: string }).color
                const data = n.data as { projectColor: string; task: TaskWithDeps }
                if (!data.task) return "#6b7280"
                switch (data.task.status) {
                  case "done": return "#16a34a"
                  case "next": return "#2563eb"
                  case "waiting": return "#ca8a04"
                  case "someday": return "#71717a"
                  default: return "#52525b"
                }
              }}
              maskColor="rgba(15, 15, 18, 0.7)"
            />
          </ReactFlow>
        </div>

        {/* Drawer */}
        <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
      </div>
    </>
  )
}
