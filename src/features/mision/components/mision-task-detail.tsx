"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Lock,
  CheckCircle2,
  Zap,
  Clock,
  Calendar,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"
import {
  ASSIGNEE_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  type MisionTask,
} from "../types/mision"
import type { GTDStatus } from "@/features/tasks/types/task"

function formatDateShort(iso: string | null): string {
  if (!iso) return "Sin fecha"
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

/**
 * Detalle de una tarea de la mision.
 *
 * Hoja inferior en telefono y, con las mismas clases y cero JavaScript, cajon
 * por la derecha a partir de md:. El lado nunca se decide con useIsMobile():
 * devuelve false hasta que monta, y la primera pasada pintaria el cajon
 * lateral antes de saltar abajo.
 */
export function TaskDetailSheet({
  task,
  taskById,
  open,
  onOpenChange,
  onSelectTask,
  onChangeStatus,
  onToggleInProgress,
}: {
  task: MisionTask | null
  taskById: Map<string, MisionTask>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTask: (id: string) => void
  onChangeStatus: (id: string, status: GTDStatus) => Promise<void>
  onToggleInProgress: (id: string, value: boolean) => Promise<void>
}) {
  if (!task) return null

  const dependencies = task.dependsOn
    .map((id) => taskById.get(id))
    .filter((t): t is MisionTask => !!t)

  const unblocks = Array.from(taskById.values()).filter((t) =>
    t.dependsOn.includes(task.id)
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Los cinco `!` son obligatorios: sheet.tsx coloca la hoja inferior con
          `data-[side=bottom]:...`, que compila a `.clase[data-side=bottom]` y
          le gana en especificidad a cualquier `md:`. Sin ellos el detalle salia
          pegado al borde izquierdo y con solo el 85% de alto. */}
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-xl bg-card pb-safe-4 md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-full md:max-w-md md:rounded-t-none md:border-l md:pb-4"
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="text-left">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {task.launchBlock && <span>Bloque {task.launchBlock}</span>}
            <span aria-hidden>·</span>
            <span>{ASSIGNEE_LABELS[task.assignee]}</span>
          </div>
          <SheetTitle className="text-[17px] leading-tight font-semibold">
            {task.title}
          </SheetTitle>
          {task.description && (
            <SheetDescription className="text-[15px] leading-relaxed text-muted-foreground">
              {task.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6 md:px-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("border", PRIORITY_COLORS[task.priority])}>
              prioridad: {task.priority}
            </Badge>
            <Badge variant="outline" className={cn("border", STATUS_COLORS[task.status])}>
              {STATUS_LABELS[task.status]}
            </Badge>
            {task.dueDate && (
              <Badge variant="outline" className="border-border">
                <Calendar className="mr-1 size-3" />
                {formatDateShort(task.dueDate)}
              </Badge>
            )}
            {task.isInProgress && (
              <Badge variant="outline" className="border-primary/40 text-primary">
                en curso
              </Badge>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-muted-foreground">Cambiar estado</span>
            {/* Dos columnas en telefono, cuatro en monitor: cuatro botones con
                texto no caben en 375 puntos sin partirse. */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <ActionButton
                icon={<Zap className="size-4" />}
                label="En curso"
                active={task.isInProgress}
                onClick={() => onToggleInProgress(task.id, !task.isInProgress)}
              />
              <ActionButton
                icon={<Clock className="size-4" />}
                label="Bloquear"
                active={task.status === "waiting"}
                onClick={() => onChangeStatus(task.id, "waiting")}
              />
              <ActionButton
                icon={<CheckCircle2 className="size-4" />}
                label="Completar"
                active={task.status === "done"}
                onClick={() => onChangeStatus(task.id, "done")}
              />
              <ActionButton
                icon={<ArrowRight className="size-4" />}
                label="Pendiente"
                active={task.status === "next" && !task.isInProgress}
                onClick={() => onChangeStatus(task.id, "next")}
              />
            </div>
          </div>

          {dependencies.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-muted-foreground">Depende de</span>
                {dependencies.map((dep) => (
                  <DependencyRow key={dep.id} task={dep} onClick={() => onSelectTask(dep.id)} />
                ))}
              </div>
            </>
          )}

          {unblocks.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-muted-foreground">
                  Al completar, desbloquea
                </span>
                {unblocks.map((dep) => (
                  <DependencyRow key={dep.id} task={dep} onClick={() => onSelectTask(dep.id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "min-h-11 justify-start gap-2 border-border text-[15px] md:text-sm",
        // La accion activa es VERDE con tinta oscura. Antes era blanca sobre
        // fondo oscuro, que es el acento del brandkit anterior.
        active && "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      {icon}
      {label}
    </Button>
  )
}

function DependencyRow({ task, onClick }: { task: MisionTask; onClick: () => void }) {
  const done = task.status === "done"
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-muted/30 p-2 text-left transition active:bg-muted md:hover:border-foreground/40"
    >
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-primary" />
      ) : task.status === "waiting" ? (
        <AlertTriangle className="size-4 shrink-0 text-destructive" />
      ) : (
        <Lock className="size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[15px] font-medium text-foreground">{task.title}</div>
        <div className="text-sm text-muted-foreground">
          {ASSIGNEE_LABELS[task.assignee]} · {STATUS_LABELS[task.status]}
        </div>
      </div>
    </button>
  )
}
