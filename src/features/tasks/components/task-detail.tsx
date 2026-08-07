"use client"

import { useState, useEffect, useRef } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Inbox,
  Zap,
  Clock,
  Bookmark,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTaskStore } from "../store/task-store"
import type { GTDStatus, Priority, Assignee } from "../types/task"
import { GTD_LABELS, PRIORITY_LABELS, ASSIGNEE_LABELS } from "../types/task"

const STATUS_ICONS: Record<GTDStatus, typeof Inbox> = {
  inbox: Inbox,
  next: Zap,
  waiting: Clock,
  someday: Bookmark,
  done: CheckCircle2,
}

// Boton de cada campo del detalle: 44 puntos en telefono, compacto en monitor.
const CAMPO_BOTON = "h-11 gap-1.5 text-[15px] md:h-7 md:text-sm"

export function TaskDetail() {
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId)
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask)
  const tasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const paraItems = useTaskStore((s) => s.paraItems)

  const task = tasks.find((t) => t.id === selectedTaskId)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setIsEditingTitle(false)
    }
  }, [task])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.setSelectionRange(
        titleInputRef.current.value.length,
        titleInputRef.current.value.length
      )
    }
  }, [isEditingTitle])

  function handleClose() {
    if (task) {
      if (title.trim() && title !== task.title) {
        updateTask(task.id, { title: title.trim() })
      }
      if (description !== task.description) {
        updateTask(task.id, { description })
      }
    }
    setIsEditingTitle(false)
    setSelectedTask(null)
  }

  function commitTitle() {
    if (task && title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() })
    }
    setIsEditingTitle(false)
  }

  function handleDelete() {
    if (task) {
      deleteTask(task.id)
    }
  }

  if (!task) return null

  const StatusIcon = STATUS_ICONS[task.status]
  const paraItem = task.paraId
    ? paraItems.find((p) => p.id === task.paraId)
    : null

  return (
    <Sheet open={!!selectedTaskId} onOpenChange={(open) => { if (!open) handleClose() }}>
      <SheetContent
        side="bottom"
        className={cn(
          // TELEFONO: hoja inferior. El alto maximo, el desplazamiento propio y la
          // zona segura de abajo ya vienen de sheet.tsx.
          "rounded-t-xl pb-safe-4",
          // ESCRITORIO: cajon por la derecha, decidido con CLASES y nunca con
          // JavaScript. Los overrides llevan el mismo selector de dato que la
          // base (md:data-[side=bottom]:...) porque una clase suelta pierde por
          // especificidad contra data-[side=bottom]:... y el cajon se quedaria
          // pegado abajo tambien en el monitor.
          "md:data-[side=bottom]:inset-x-auto md:data-[side=bottom]:inset-y-0",
          "md:data-[side=bottom]:right-0 md:data-[side=bottom]:left-auto",
          "md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none",
          "md:data-[side=bottom]:w-full md:data-[side=bottom]:max-w-[420px]",
          "md:data-[side=bottom]:rounded-t-none md:data-[side=bottom]:border-t-0",
          "md:data-[side=bottom]:border-l md:data-[side=bottom]:pb-0"
        )}
      >
        {/* Agarradera: es lo que hace que se lea como hoja y no como error */}
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />

        <SheetHeader className="pb-4">
          <SheetTitle className="sr-only">Detalle de tarea</SheetTitle>
          <SheetDescription className="sr-only">Editar los detalles de la tarea seleccionada</SheetDescription>

          {/* Title — click to edit */}
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              enterKeyHint="done"
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle()
                if (e.key === "Escape") {
                  setTitle(task.title)
                  setIsEditingTitle(false)
                }
              }}
              className="border-border bg-transparent font-medium text-foreground focus-visible:ring-1"
            />
          ) : (
            <button
              type="button"
              className="group -mx-2 flex min-h-11 w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-1 text-left transition-colors active:bg-muted md:hover:bg-muted/30"
              onClick={() => setIsEditingTitle(true)}
            >
              <h2 className="min-w-0 flex-1 text-[17px] leading-snug font-medium text-foreground md:text-base">
                {task.title}
              </h2>
              {/* Visible en telefono: sin raton, un lapiz que solo aparece al
                  pasar por encima no existe. */}
              <Pencil className="mt-1 h-4 w-4 shrink-0 text-muted-foreground md:text-transparent md:group-hover:text-muted-foreground" />
            </button>
          )}
        </SheetHeader>

        <div className="space-y-5 px-4 pt-2 pb-4">
          {/* Status */}
          <DetailRow label="Estado">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={CAMPO_BOTON}>
                  <StatusIcon className="h-4 w-4" />
                  {GTD_LABELS[task.status]}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(GTD_LABELS) as GTDStatus[]).map((status) => {
                  const Icon = STATUS_ICONS[status]
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => updateTask(task.id, { status })}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {GTD_LABELS[status]}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </DetailRow>

          {/* Priority */}
          <DetailRow label="Prioridad">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={CAMPO_BOTON}>
                  {PRIORITY_LABELS[task.priority]}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => (
                  <DropdownMenuItem
                    key={priority}
                    onClick={() => updateTask(task.id, { priority })}
                  >
                    {PRIORITY_LABELS[priority]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </DetailRow>

          {/* Assignee */}
          <DetailRow label="Asignado">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={CAMPO_BOTON}>
                  {ASSIGNEE_LABELS[task.assignee]}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(ASSIGNEE_LABELS) as Assignee[]).map((assignee) => (
                  <DropdownMenuItem
                    key={assignee}
                    onClick={() => updateTask(task.id, { assignee })}
                  >
                    {ASSIGNEE_LABELS[assignee]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </DetailRow>

          {/* PARA Context */}
          <DetailRow label="Proyecto / Area">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn(CAMPO_BOTON, "max-w-full")}>
                  <span className="min-w-0 truncate">{paraItem ? paraItem.name : "Sin asignar"}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto">
                <DropdownMenuItem onClick={() => updateTask(task.id, { paraId: null })}>
                  Sin asignar
                </DropdownMenuItem>
                {paraItems
                  .filter((p) => p.type !== "archive")
                  .map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => updateTask(task.id, { paraId: item.id })}
                    >
                      <Badge
                        variant="outline"
                        className="mr-2 border-border text-sm text-muted-foreground"
                      >
                        {item.type === "project" ? "P" : item.type === "area" ? "A" : "R"}
                      </Badge>
                      {item.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </DetailRow>

          {/* Due Date */}
          <DetailRow label="Fecha limite">
            <Input
              type="date"
              value={task.dueDate || ""}
              onChange={(e) =>
                updateTask(task.id, {
                  dueDate: e.target.value || null,
                })
              }
              className="w-auto border-border bg-transparent"
            />
          </DetailRow>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="notas-tarea" className="block text-sm font-medium text-muted-foreground">
              Notas
            </label>
            <textarea
              id="notas-tarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== task.description) {
                  updateTask(task.id, { description })
                }
              }}
              placeholder="Agregar notas..."
              className="min-h-[100px] w-full resize-none rounded-lg border border-border bg-secondary/30 p-3 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none md:text-sm"
            />
          </div>

          <Separator />

          {/* Meta */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Creada: {new Date(task.createdAt).toLocaleString("es-ES")}</p>
            {task.completedAt && (
              <p>Completada: {new Date(task.completedAt).toLocaleString("es-ES")}</p>
            )}
          </div>

          {/* Delete */}
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="w-full gap-2 text-[15px] text-destructive hover:bg-destructive/10 hover:text-destructive md:text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar tarea
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}
