"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  Panel,
  applyNodeChanges,
  useReactFlow,
  useNodesInitialized,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { BookOpen, HelpCircle, SlidersHorizontal, RotateCcw, Zap, Plus, Minus, Maximize } from "lucide-react"
import Link from "next/link"
import { LoadingScreen } from "@/components/ui/loading-screen"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
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
import { PriorityQueue } from "./priority-queue"

const nodeTypes = {
  task: TaskNode,
  project: ProjectNode,
  mission: MissionNode,
}

type StatusKey = "next" | "waiting" | "someday" | "done" | "inbox"
type AssigneeKey = "marco" | "adrian" | "equipo" | "ai"
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
const ALL_ASSIGNEE: AssigneeKey[] = ["marco", "adrian", "equipo", "ai"]
const ALL_PRIORITY: PriorityKey[] = ["urgent", "high", "normal", "low"]

// Boton de la barra de arriba: 44 puntos en telefono, compacto en monitor.
const BOTON_BARRA =
  "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 text-[15px] whitespace-nowrap active:bg-secondary/70 md:h-8 md:px-2.5 md:text-sm md:hover:bg-secondary/70"

// Casilla de filtro: la fila entera mide 44 puntos para que se acierte con el dedo.
const FILA_CASILLA =
  "flex min-h-11 cursor-pointer items-center gap-2 text-[15px] md:min-h-0 md:text-sm"

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
    "flex size-11 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors active:bg-secondary md:size-8 md:hover:bg-secondary"
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur">
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

// Centra el board cuando los nodos custom están medidos por xyflow.
// useNodesInitialized se vuelve true cuando todos los nodos tienen width/height reales.
// Sin esperar esto, fitView dispara con dimensiones 0 y la cámara aterriza en cualquier sitio.
function AutoFitOnMount() {
  const initialized = useNodesInitialized()
  const { fitView } = useReactFlow()
  const didFit = useRef(false)
  useEffect(() => {
    if (!initialized || didFit.current) return
    didFit.current = true
    // Una RAF más para garantizar que el DOM ha pintado los tamaños
    requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 0, maxZoom: 0.9 })
    })
  }, [initialized, fitView])
  return null
}

function BoardPageInner() {
  const [tasks, setTasks] = useState<TaskWithDeps[]>([])
  const [paraItems, setParaItems] = useState<ParaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithDeps | null>(null)
  // Telefono y monitor llevan estados SEPARADOS a proposito. La capa de fondo de
  // la hoja inferior se monta en sheet.tsx y no admite clases, asi que un solo
  // estado compartido la levantaba tambien en monitor: el board quedaba borroso,
  // Radix bloqueaba el raton y solo se salia con Escape.
  const [leyendaHoja, setLeyendaHoja] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [filtrosHoja, setFiltrosHoja] = useState(false)
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

  // El contenido de los filtros se escribe UNA vez y se pinta en la hoja del
  // telefono y en el panel del monitor. Nada se decide con JavaScript.
  const contenidoFiltros = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-muted-foreground">Status</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0">
          {ALL_STATUS.map((s) => (
            <label key={s} className={FILA_CASILLA}>
              <input
                type="checkbox"
                checked={filters.status.has(s)}
                onChange={() => setFilters({ ...filters, status: toggleSet(filters.status, s) })}
                className="h-5 w-5 shrink-0 accent-primary md:h-4 md:w-4"
              />
              <span className="capitalize">{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-muted-foreground">Assignee</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0">
          {ALL_ASSIGNEE.map((a) => (
            <label key={a} className={FILA_CASILLA}>
              <input
                type="checkbox"
                checked={filters.assignee.has(a)}
                onChange={() => setFilters({ ...filters, assignee: toggleSet(filters.assignee, a) })}
                className="h-5 w-5 shrink-0 accent-primary md:h-4 md:w-4"
              />
              <span className="capitalize">{a}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-muted-foreground">Prioridad</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0">
          {ALL_PRIORITY.map((p) => (
            <label key={p} className={FILA_CASILLA}>
              <input
                type="checkbox"
                checked={filters.priority.has(p)}
                onChange={() => setFilters({ ...filters, priority: toggleSet(filters.priority, p) })}
                className="h-5 w-5 shrink-0 accent-primary md:h-4 md:w-4"
              />
              <span className="capitalize">{p}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-muted-foreground">Otros</p>
        <div className="flex flex-col">
          <label className={FILA_CASILLA}>
            <input
              type="checkbox"
              checked={filters.onlyInProgress}
              onChange={(e) => setFilters({ ...filters, onlyInProgress: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-primary md:h-4 md:w-4"
            />
            <span>Solo en vivo</span>
          </label>
          <label className={FILA_CASILLA}>
            <input
              type="checkbox"
              checked={filters.onlyWithDate}
              onChange={(e) => setFilters({ ...filters, onlyWithDate: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-primary md:h-4 md:w-4"
            />
            <span>Solo con fecha</span>
          </label>
          <button
            onClick={resetFilters}
            className="mt-1 inline-flex h-11 items-center gap-1.5 self-start rounded-lg px-1 text-[15px] text-muted-foreground active:bg-secondary md:h-8 md:text-sm md:hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            Reset
          </button>
        </div>
      </div>

      {projectIds.length > 0 && (
        <div className="md:col-span-4">
          <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
            Proyectos / Áreas
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-0">
            {paraItems
              .filter((p) => p.type === "project" || p.type === "area")
              .map((p) => (
                <label key={p.id} className={FILA_CASILLA}>
                  <input
                    type="checkbox"
                    checked={filters.projects.has(p.id)}
                    onChange={() => setFilters({ ...filters, projects: toggleSet(filters.projects, p.id) })}
                    className="h-5 w-5 shrink-0 accent-primary md:h-4 md:w-4"
                  />
                  <span>{p.name}</span>
                </label>
              ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="relative flex h-full min-h-0 flex-col">
        {/* Top bar */}
        <div className="shrink-0 border-b border-border bg-card/40 px-safe">
          <div className="flex flex-col gap-2 px-3 py-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:px-4 md:py-2.5">
            {/* Stats. En telefono la fila se desliza dentro de su caja: cinco
                cifras seguidas no caben en 375 puntos. */}
            <div className="-mx-3 flex gap-4 overflow-x-auto px-3 text-sm md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              <span className="shrink-0 whitespace-nowrap text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{stats.total}</span> tareas
              </span>
              <span className="shrink-0 whitespace-nowrap text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{stats.next}</span> next
              </span>
              <span className="shrink-0 whitespace-nowrap text-muted-foreground">
                <span className="font-semibold tabular-nums text-warn">{stats.waiting}</span> waiting
              </span>
              <span className="shrink-0 whitespace-nowrap text-muted-foreground">
                <span className="font-semibold tabular-nums text-primary">{stats.done}</span> done ({stats.pct}%)
              </span>
              {stats.live > 0 && (
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-primary">
                  <Zap className="h-3.5 w-3.5 animate-pulse" />
                  <span className="font-semibold tabular-nums">{stats.live}</span> en vivo
                </span>
              )}
            </div>

            {/* Botones accion. Leyenda y Filtros van duplicados a proposito: el
                boton del telefono abre la hoja inferior y el del monitor abre el
                panel de escritorio. Cada uno mueve SU estado, asi la hoja no se
                monta nunca por encima de 768 puntos. */}
            <div className="flex gap-2">
              <Link href="/knowledge" className={cn(BOTON_BARRA, "flex-1 md:flex-none")}>
                <BookOpen className="h-4 w-4 shrink-0" />
                Knowledge
              </Link>

              <button
                onClick={() => setLeyendaHoja(true)}
                className={cn(BOTON_BARRA, "flex-1 md:hidden")}
              >
                <HelpCircle className="h-4 w-4 shrink-0" />
                Leyenda
              </button>
              <button
                onClick={() => setShowLegend(true)}
                className={cn(BOTON_BARRA, "hidden md:inline-flex")}
              >
                <HelpCircle className="h-4 w-4 shrink-0" />
                Leyenda
              </button>

              <button
                onClick={() => setFiltrosHoja(true)}
                className={cn(BOTON_BARRA, "flex-1 md:hidden")}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                Filtros
              </button>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  BOTON_BARRA,
                  "hidden md:inline-flex",
                  showFilters && "border-primary bg-primary text-primary-foreground"
                )}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                Filtros
              </button>
            </div>
          </div>
        </div>

        {/* TELEFONO: los filtros viven en una hoja inferior. Solo la abre el boton
            `md:hidden`, asi que en monitor no llega a montarse. */}
        <Sheet open={filtrosHoja} onOpenChange={setFiltrosHoja}>
          <SheetContent side="bottom" className="rounded-t-xl pb-safe-4">
            <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
            <SheetHeader className="px-4 pb-0">
              <SheetTitle className="text-[17px] font-semibold">Filtros</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">{contenidoFiltros}</div>
          </SheetContent>
        </Sheet>

        {/* ESCRITORIO: panel desplegable debajo de la barra */}
        {showFilters && (
          <div className="hidden shrink-0 border-b border-border bg-card/30 px-4 py-3 md:block">
            {contenidoFiltros}
          </div>
        )}

        {/* Canvas */}
        <div className="relative flex-1">
          {loading && (
            <LoadingScreen fullscreen={false} className="absolute inset-0 z-10" />
          )}
          {error && (
            <div className="absolute inset-x-4 top-4 z-10 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[15px] text-destructive">
              {error}
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={onNodeClick}
            minZoom={0.05}
            maxZoom={2.5}
            defaultEdgeOptions={{ type: "default" }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable
          >
            <AutoFitOnMount />
            {/* Los puntos del fondo leen el token del borde en vez de llevar el
                gris grabado a mano. */}
            <Background gap={20} size={1} color="var(--border)" />
            <Panel position="top-left" className="!m-2">
              <PriorityQueue tasks={tasks} onSelectTask={setSelectedTask} />
            </Panel>
            <Panel position="bottom-left" className="!m-3">
              <BoardControls />
            </Panel>
            <MiniMap
              className="!bg-card !border-border hidden md:block"
              nodeColor={(n) => {
                if (n.type === "mission") return "var(--primary)"
                if (n.type === "project") return (n.data as { color: string }).color
                const data = n.data as { projectColor: string; task: TaskWithDeps }
                if (!data.task) return "var(--muted-foreground)"
                if (data.task.isInProgress) return "var(--primary)"
                switch (data.task.status) {
                  case "done": return "var(--primary)"
                  case "next": return "var(--foreground)"
                  case "waiting": return "var(--muted-foreground)"
                  case "someday": return "var(--border)"
                  default: return "var(--secondary)"
                }
              }}
              maskColor="color-mix(in srgb, var(--background) 70%, transparent)"
            />
          </ReactFlow>
        </div>

        {/* Modales y drawers */}
        <LegendModal
          hojaAbierta={leyendaHoja}
          onCerrarHoja={() => setLeyendaHoja(false)}
          panelAbierto={showLegend}
          onCerrarPanel={() => setShowLegend(false)}
        />
        <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />
      </div>
    </>
  )
}
