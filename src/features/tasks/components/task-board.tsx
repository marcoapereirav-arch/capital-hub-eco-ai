"use client"

import { useCallback, useId } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { useDroppable } from "@dnd-kit/core"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useState } from "react"
import { Inbox, Zap, Clock, Bookmark } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTaskStore } from "../store/task-store"
import { TaskCard } from "./task-card"
import type { GTDStatus, Task } from "../types/task"

const BOARD_COLUMNS: { status: GTDStatus; label: string; icon: typeof Inbox }[] = [
  { status: "inbox", label: "Inbox", icon: Inbox },
  { status: "next", label: "Next Action", icon: Zap },
  { status: "waiting", label: "Waiting For", icon: Clock },
  { status: "someday", label: "Someday", icon: Bookmark },
]

function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    cursor: "grab",
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} />
    </div>
  )
}

function DroppableColumn({
  status,
  label,
  icon: Icon,
  tasks,
}: {
  status: GTDStatus
  label: string
  icon: typeof Inbox
  tasks: Task[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className="flex shrink-0 flex-col md:w-[280px]"
    >
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2 px-1 py-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground">
          {label}
        </span>
        {tasks.length > 0 && (
          <Badge
            variant="secondary"
            className="h-5 min-w-[20px] justify-center px-1.5 text-sm tabular-nums"
          >
            {tasks.length}
          </Badge>
        )}
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div
          className={cn(
            "min-h-[80px] space-y-2.5 rounded-lg p-1 transition-colors",
            isOver && "bg-muted/20 ring-1 ring-primary/30"
          )}
        >
          {tasks.length === 0 ? (
            <div className={cn(
              "flex items-center justify-center rounded-lg border border-dashed p-10 transition-colors",
              isOver ? "border-primary/40 bg-muted/10" : "border-border"
            )}>
              <span className="text-sm text-muted-foreground">
                {isOver ? "Soltar aqui" : "Sin tareas"}
              </span>
            </div>
          ) : (
            tasks.map((task) => <DraggableCard key={task.id} task={task} />)
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export function TaskBoard() {
  const tasks = useTaskStore((s) => s.tasks)
  const filters = useTaskStore((s) => s.filters)
  const paraItems = useTaskStore((s) => s.paraItems)
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks)
  const moveTask = useTaskStore((s) => s.moveTask)

  void paraItems
  const filteredTasks = getFilteredTasks()

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  // En telefono se ve UNA columna a la vez. Cuatro columnas de 280 puntos en una
  // pantalla de 375 dejaban ver columna y media y el resto se arrastraba de lado.
  const [columnaActiva, setColumnaActiva] = useState<GTDStatus>(BOARD_COLUMNS[0].status)
  const dndId = useId()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id)
      if (task) setActiveTask(task)
    },
    [tasks]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTask(null)

      if (!over) return

      const taskId = active.id as string
      const newStatus = over.id as GTDStatus

      // Only move if dropping on a valid column
      if (BOARD_COLUMNS.some((col) => col.status === newStatus)) {
        moveTask(taskId, newStatus)
      }
    },
    [moveTask]
  )

  const tareasDeColumnaActiva = filteredTasks.filter((t) => t.status === columnaActiva)

  return (
    <>
      {/* ================= TELEFONO: una columna a la vez =================
          Arrastrar con el dedo pelea con el desplazamiento, asi que aqui una
          tarjeta se mueve desde su hoja de acciones ("Mover a"), no arrastrando. */}
      <div className="md:hidden">
        <div className="-mx-3 flex snap-x gap-1 overflow-x-auto px-3 pb-2">
          {BOARD_COLUMNS.map((column) => {
            const count = filteredTasks.filter((t) => t.status === column.status).length
            const activa = columnaActiva === column.status
            return (
              <button
                key={column.status}
                type="button"
                onClick={() => setColumnaActiva(column.status)}
                className={cn(
                  "inline-flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 text-[15px] whitespace-nowrap",
                  activa
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-card text-muted-foreground"
                )}
              >
                <column.icon className="h-4 w-4 shrink-0" />
                {column.label} <span className="tabular-nums">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="space-y-2.5">
          {tareasDeColumnaActiva.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border px-6 py-10 text-center">
              <span className="text-[15px] text-muted-foreground">Sin tareas</span>
            </div>
          ) : (
            tareasDeColumnaActiva.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>

      {/* ================= ESCRITORIO: el tablero en fila ================= */}
      <div className="hidden h-full md:block">
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-4 pb-4">
            {BOARD_COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.status)
              return (
                <DroppableColumn
                  key={column.status}
                  status={column.status}
                  label={column.label}
                  icon={column.icon}
                  tasks={columnTasks}
                />
              )
            })}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rotate-2 scale-105 opacity-90">
                <TaskCard task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  )
}
