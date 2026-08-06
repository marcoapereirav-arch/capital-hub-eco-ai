"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Inbox,
  Zap,
  Clock,
  Bookmark,
  CheckCircle2,
  Trash2,
  Calendar,
} from "lucide-react"
import { useTaskStore } from "../store/task-store"
import type { Task, GTDStatus, Priority } from "../types/task"
import { GTD_LABELS } from "../types/task"

// La franja de la izquierda marca la prioridad con los tokens del tema.
const PRIORITY_STYLES: Record<Priority, string> = {
  urgent: "border-l-primary",
  high: "border-l-foreground",
  normal: "border-l-muted-foreground",
  low: "border-l-border",
}

const STATUS_ICONS: Record<GTDStatus, typeof Inbox> = {
  inbox: Inbox,
  next: Zap,
  waiting: Clock,
  someday: Bookmark,
  done: CheckCircle2,
}

export function TaskCard({ task }: { task: Task }) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask)
  const moveTask = useTaskStore((s) => s.moveTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const paraItems = useTaskStore((s) => s.paraItems)

  // Hoja de acciones del telefono. En movil un menu flotante de 128 puntos corta
  // las opciones a la mitad, asi que las acciones viven en una hoja inferior.
  const [accionesAbiertas, setAccionesAbiertas] = useState(false)

  const paraItem = task.paraId
    ? paraItems.find((p) => p.id === task.paraId)
    : null

  return (
    <>
    <div
      onClick={() => setSelectedTask(task.id)}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3.5 transition-colors md:hover:border-primary/50",
        "border-l-2",
        PRIORITY_STYLES[task.priority]
      )}
    >
      {/* Title + menu */}
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 flex-1 text-[15px] leading-relaxed md:text-sm",
            task.status === "done"
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {task.title}
        </p>

        {/* TELEFONO: hoja inferior de acciones, siempre visible (no hay raton
            que descubra un icono escondido). */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setAccionesAbiertas(true)
          }}
          aria-label="Acciones de la tarea"
          className="-my-1.5 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:hidden"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {/* ESCRITORIO: el mismo contenido en un desplegable */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 shrink-0 transition-opacity md:opacity-0 md:group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Mover a</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(Object.keys(GTD_LABELS) as GTDStatus[]).map((status) => {
                    const Icon = STATUS_ICONS[status]
                    return (
                      <DropdownMenuItem
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation()
                          moveTask(task.id, status)
                        }}
                        disabled={task.status === status}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {GTD_LABELS[status]}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  deleteTask(task.id)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {paraItem && (
            <Badge
              variant="outline"
              className="max-w-full shrink-0 truncate border-border text-sm text-muted-foreground"
            >
              {paraItem.name}
            </Badge>
          )}
          {task.dueDate && (
            <span className="flex shrink-0 items-center gap-1 text-sm tabular-nums text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(task.dueDate).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>

        {/* 28 puntos, no 20: "MA" en semibold a 14 puntos mide unos 21 de ancho y
            el circulo no recorta, asi que a 20 las letras se salian encima del
            titulo. Se agranda el circulo, no se encoge la letra. */}
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
            {task.assignee === "marco" ? "MA" : task.assignee === "adrian" ? "AV" : "EQ"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>

    {/* Hoja de acciones del telefono. Va FUERA del div que abre el detalle: los
        eventos de React suben por el arbol de React aunque la hoja se pinte en el
        body, asi que desde dentro un toque para cerrarla abria ademas la tarea. */}
    <Sheet open={accionesAbiertas} onOpenChange={setAccionesAbiertas}>
      <SheetContent side="bottom" className="rounded-t-xl pb-safe-4">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="px-4 pb-0">
            <SheetTitle className="text-[17px] font-semibold">Mover a</SheetTitle>
          </SheetHeader>
          <div className="pb-2">
            {(Object.keys(GTD_LABELS) as GTDStatus[]).map((status) => {
              const Icon = STATUS_ICONS[status]
              return (
                <button
                  key={status}
                  type="button"
                  disabled={task.status === status}
                  onClick={(e) => {
                    e.stopPropagation()
                    moveTask(task.id, status)
                    setAccionesAbiertas(false)
                  }}
                  className="flex h-12 w-full items-center gap-2 px-4 text-left text-[15px] text-foreground active:bg-muted disabled:opacity-40"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {GTD_LABELS[status]}
                </button>
              )
            })}
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                deleteTask(task.id)
                setAccionesAbiertas(false)
              }}
              className="flex h-12 w-full items-center gap-2 px-4 text-left text-[15px] text-destructive active:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Eliminar
            </button>
          </div>
      </SheetContent>
    </Sheet>
    </>
  )
}
