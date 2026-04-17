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
      className="flex w-[280px] shrink-0 flex-col"
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 py-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {tasks.length > 0 && (
          <Badge
            variant="secondary"
            className="font-mono text-[9px] px-1.5 py-0 h-4 min-w-[18px] justify-center"
          >
            {tasks.length}
          </Badge>
        )}
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div
          className={`space-y-2.5 min-h-[80px] rounded-sm p-1 transition-colors ${
            isOver ? "bg-accent/20 ring-1 ring-foreground/10" : ""
          }`}
        >
          {tasks.length === 0 ? (
            <div className={`flex items-center justify-center rounded-sm border border-dashed p-10 transition-colors ${
              isOver ? "border-foreground/30 bg-accent/10" : "border-border/40"
            }`}>
              <span className="text-xs text-muted-foreground/30">
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

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full pb-4">
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
          <div className="opacity-90 rotate-2 scale-105">
            <TaskCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
