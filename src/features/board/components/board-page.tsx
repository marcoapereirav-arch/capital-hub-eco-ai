"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  Panel,
  applyNodeChanges,
  useReactFlow,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Compass, HelpCircle, SlidersHorizontal, RotateCcw, Zap, Plus, Minus, Maximize } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { boardService } from "../services/board-service"
import { buildLayout } from "../services/layout"
import { loadPositions, savePosition, loadFilters, saveFilters } from "../services/board-persist"
import type { TaskWithDeps } from "../types/board"
import type { ParaItem } from "@/features/tasks/types/task"
import { TaskNode } from "./task-node"
import { ProjectNode } from "./project-node"
import { MissionNode } from "./mission-node"
import { TaskDrawer } from "./task-drawer"
import { LegendModal } from "./legend-modal"
import { StrategyDrawer } from "./strategy-drawer"
import { PriorityQueue } from "./priority-queue"

const nodeTypes = {
  task: TaskNode,
  project: ProjectNode,
  mission: MissionNode,
}

type StatusKey = "next" | "waiting" | "someday" | "done" | "inbox"
type AssigneeKey = "marco" | "adrian" | "equipo"
type PriorityKey = "urgent" | "high" | "normal" | "low"

type Filters = {
  status: Set<StatusKey>
  assignee: Set<AssigneeKey>
  priority: Set<PriorityKey>
  projects: Set<string>
  onlyInProgress: boolean
  onlyWithDate: boolean
}

const ALL_STATUS: StatusKey[] = ["next", "waiting", "someday", "done", "inbox"]
const ALL_ASSIGNEE: AssigneeKey[] = ["marco", "adrian", "equipo"]
const ALL_PRIORITY: PriorityKey[] = ["urgent", "high", "normal", "low"]

function emptyFilters(projects: string[]): Filters {
  return {
    status: new Set(ALL_STATUS),
    assignee: new Set(ALL_ASSIGNEE),
    priority: new Set(ALL_PRIORITY),
    projects: new Set(projects),
    onlyInProgress: false,
    onlyWithDate: false,
  }
}

export function BoardPage() {
  return (
    <ReactFlowProvider>
      <BoardPageInner />
    </ReactFlowProvider>
  )
}

function BoardControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const cls =
    "flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-secondary"
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-card/95 backdrop-blur p-1.5 shadow-lg">
      <button onClick={() => zoomIn({ duration: 200 })} className={cls} title="Acercar zoom">
        <Plus className="h-4 w-4" />
      </button>
      <button onClick={() => zoomOut({ duration: 200 })} className={cls} title="Alejar zoom">
        <Minus className="h-4 w-4" />
      </button>
      <button
        onClick={() => fitView({ padding: 0.15, duration: 600 })}
        className={cls}
        title="Centrar todo el board"
      >
        <Maximize className="h-4 w-4" />
      </button>
    </div>
  )
}

// Refit cuando cambia el set de nodos visibles. Sin esto, el board carga con la cámara
// en una posición arbitraria (la del último estado del provider) y a menudo encima de la MISIÓN.
function AutoFitOnMount({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    if (nodeCount === 0) return
    // Doble RAF para esperar a que xyflow mida los nodos antes de fitView
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => {
        fitView({ padding: 0.15, duration: 0 })
      })
      return () => cancelAnimationFrame(r2)
    })
    return () => cancelAnimationFrame(r1)
    // Solo cuando aparece el primer nodo (carga inicial). No re-disparamos en cada filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeCount > 0])
  return null
}

function BoardPageInner() {
  const [tasks, setTasks] = useState<TaskWithDeps[]>([])
  const [paraItems, setParaItems] = useState<ParaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithDeps | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [showStrategy, setShowStrategy] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const projectIds = useMemo(
    () => paraItems.filter((p) => p.type === "project" || p.type === "area").map((p) => p.id),
    [paraItems]
  )

  // Filtros: cargados de localStorage si existían, si no defaults
  const [filters, setFilters] = useState<Filters>(() => {
    const saved = loadFilters()
    if (!saved) return emptyFilters([])
    return {
      status: new Set(saved.status as StatusKey[]),
      assignee: new Set(saved.assignee as AssigneeKey[]),
      priority: new Set(saved.priority as PriorityKey[]),
      projects: new Set(saved.projects),
      onlyInProgress: saved.onlyInProgress,
      onlyWithDate: saved.onlyWithDate,
    }
  })

  // Cuando aparecen proyectos nuevos en BD, los añadimos al filtro (sin desactivar nada).
  useEffect(() => {
    setFilters((f) => {
      const merged = new Set(f.projects)
      projectIds.forEach((id) => {
        if (!merged.has(id)) merged.add(id)
      })
      return { ...f, projects: merged }
    })
  }, [projectIds])

  // Persistir filtros cada vez que cambien
  useEffect(() => {
    saveFilters({
      status: Array.from(filters.status),
      assignee: Array.from(filters.assignee),
      priority: Array.from(filters.priority),
      projects: Array.from(filters.projects),
      onlyInProgress: filters.onlyInProgress,
      onlyWithDate: filters.onlyWithDate,
    })
  }, [filters])

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
      if (!filters.status.has(t.status as StatusKey)) return false
      if (!filters.assignee.has(t.assignee as AssigneeKey)) return false
      if (!filters.priority.has(t.priority as PriorityKey)) return false
      if (t.paraId && !filters.projects.has(t.paraId)) return false
      if (filters.onlyInProgress && !t.isInProgress) return false
      if (filters.onlyWithDate && !t.dueDate) return false
      return true
    })
  }, [tasks, filters])

  // Posiciones manuales guardadas. Se carga 1 vez del localStorage.
  const [savedPositions, setSavedPositions] = useState<Record<string, { x: number; y: number }>>({})
  useEffect(() => {
    setSavedPositions(loadPositions())
  }, [])

  // Layout calculado: parte del cálculo galáctico, sobreescribe con posiciones manuales si existen.
  const { nodes: initialNodes, edges } = useMemo(
    () => buildLayout(filteredTasks, paraItems, savedPositions),
    [filteredTasks, paraItems, savedPositions]
  )

  // Estado local de nodos para que se puedan arrastrar
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes])

  // Aplicar cambios + persistir posiciones cuando termina un drag.
  // También actualiza el state local de savedPositions para que un realtime update
  // no resetee la posición que el usuario acaba de mover.
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
    let dirty = false
    const next: Record<string, { x: number; y: number }> = {}
    for (const c of changes) {
      if (c.type === "position" && c.dragging === false && c.position) {
        savePosition(c.id, c.position)
        next[c.id] = c.position
        dirty = true
      }
    }
    if (dirty) setSavedPositions((p) => ({ ...p, ...next }))
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
    const live = tasks.filter((t) => t.isInProgress).length
    return { total, done, next, waiting, live, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [tasks])

  // Toggle helpers
  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  function resetFilters() {
    setFilters(emptyFilters(projectIds))
  }

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
            {stats.live > 0 && (
              <span className="flex items-center gap-1 font-mono text-cyan-400">
                <Zap className="h-3 w-3 animate-pulse" />
                <span className="font-semibold">{stats.live}</span> en vivo
              </span>
            )}
          </div>

          {/* Botones acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStrategy(true)}
              className="flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-2.5 py-1 text-xs hover:bg-secondary/70"
            >
              <Compass className="h-3.5 w-3.5" />
              Estrategia
            </button>
            <button
              onClick={() => setShowLegend(true)}
              className="flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-2.5 py-1 text-xs hover:bg-secondary/70"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Leyenda
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs ${
                showFilters
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-secondary hover:bg-secondary/70"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </button>
          </div>
        </div>

        {/* Panel filtros desplegable */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border bg-card/30 px-4 py-3 text-xs">
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {ALL_STATUS.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={filters.status.has(s)}
                      onChange={() => setFilters({ ...filters, status: toggleSet(filters.status, s) })}
                      className="h-3 w-3"
                    />
                    <span className="capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Assignee</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {ALL_ASSIGNEE.map((a) => (
                  <label key={a} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={filters.assignee.has(a)}
                      onChange={() => setFilters({ ...filters, assignee: toggleSet(filters.assignee, a) })}
                      className="h-3 w-3"
                    />
                    <span className="capitalize">{a}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Prioridad</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {ALL_PRIORITY.map((p) => (
                  <label key={p} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={filters.priority.has(p)}
                      onChange={() => setFilters({ ...filters, priority: toggleSet(filters.priority, p) })}
                      className="h-3 w-3"
                    />
                    <span className="capitalize">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Otros</p>
              <div className="flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={filters.onlyInProgress}
                    onChange={(e) => setFilters({ ...filters, onlyInProgress: e.target.checked })}
                    className="h-3 w-3"
                  />
                  <span>Solo en vivo (⚡)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={filters.onlyWithDate}
                    onChange={(e) => setFilters({ ...filters, onlyWithDate: e.target.checked })}
                    className="h-3 w-3"
                  />
                  <span>Solo con fecha (📅)</span>
                </label>
                <button
                  onClick={resetFilters}
                  className="mt-1 flex items-center gap-1.5 self-start text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>
            </div>

            {projectIds.length > 0 && (
              <div className="col-span-2 md:col-span-4">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Proyectos / Áreas
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {paraItems
                    .filter((p) => p.type === "project" || p.type === "area")
                    .map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={filters.projects.has(p.id)}
                          onChange={() => setFilters({ ...filters, projects: toggleSet(filters.projects, p.id) })}
                          className="h-3 w-3"
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

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
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.1}
            maxZoom={2.5}
            defaultEdgeOptions={{ type: "default" }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable
          >
            <AutoFitOnMount nodeCount={nodes.length} />
            <Background gap={20} size={1} color="#2a2d34" />
            <Panel position="top-left" className="!m-2">
              <PriorityQueue tasks={tasks} onSelectTask={setSelectedTask} />
            </Panel>
            <Panel position="bottom-left" className="!m-3">
              <BoardControls />
            </Panel>
            <MiniMap
              className="!bg-card !border-border"
              nodeColor={(n) => {
                if (n.type === "mission") return "#fbbf24"
                if (n.type === "project") return (n.data as { color: string }).color
                const data = n.data as { projectColor: string; task: TaskWithDeps }
                if (!data.task) return "#6b7280"
                if (data.task.isInProgress) return "#06b6d4"
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

        {/* Modales y drawers */}
        <LegendModal open={showLegend} onClose={() => setShowLegend(false)} />
        <StrategyDrawer open={showStrategy} onClose={() => setShowStrategy(false)} />
        <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
      </div>
    </>
  )
}
