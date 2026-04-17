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
      <SheetContent className="w-[420px] sm:w-[420px] overflow-y-auto">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle()
                if (e.key === "Escape") {
                  setTitle(task.title)
                  setIsEditingTitle(false)
                }
              }}
              className="text-base font-medium bg-transparent border-border px-2 h-auto focus-visible:ring-1 text-foreground"
            />
          ) : (
            <div
              className="group flex items-start gap-2 cursor-pointer rounded-sm px-2 py-1 -mx-2 hover:bg-accent/30 transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              <h2 className="text-base font-medium text-foreground leading-snug flex-1">
                {task.title}
              </h2>
              <Pencil className="h-3 w-3 mt-1 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
            </div>
          )}
        </SheetHeader>

        <div className="space-y-5 pt-2">
          {/* Status */}
          <DetailRow label="Estado">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  <StatusIcon className="h-3 w-3" />
                  {GTD_LABELS[task.status]}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
                      <Icon className="mr-2 h-3.5 w-3.5" />
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
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  {PRIORITY_LABELS[task.priority]}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  {ASSIGNEE_LABELS[task.assignee]}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  {paraItem ? paraItem.name : "Sin asignar"}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
                        className="font-mono text-[8px] px-1 py-0 mr-2 border-border text-muted-foreground"
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
              className="h-7 w-auto text-xs bg-transparent border-border"
            />
          </DetailRow>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Notas
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== task.description) {
                  updateTask(task.id, { description })
                }
              }}
              placeholder="Agregar notas..."
              className="w-full min-h-[100px] resize-none rounded-sm border border-border bg-secondary/30 p-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Separator />

          {/* Meta */}
          <div className="space-y-1 text-[10px] font-mono text-muted-foreground/40">
            <p>Creada: {new Date(task.createdAt).toLocaleString("es-ES")}</p>
            {task.completedAt && (
              <p>Completada: {new Date(task.completedAt).toLocaleString("es-ES")}</p>
            )}
          </div>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}
