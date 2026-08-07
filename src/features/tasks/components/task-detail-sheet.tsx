"use client"

import { useEffect, useState } from "react"
import { Check, Archive, Trash2, RotateCcw } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  PRIORITIES,
  PRIORITY_HINTS,
  type OsUser,
  type Priority,
  type Task,
} from "../types/task"

const CAMPO =
  "w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:text-sm"

/**
 * El detalle de una tarea: aqui se escribe la descripcion y se cambia todo lo demas.
 * Hoja inferior en telefono, cajon por la derecha en ordenador — decidido con clases,
 * NUNCA con JavaScript (useIsMobile miente en el primer pintado).
 */
export function TaskDetailSheet({
  task,
  users,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: Task | null
  users: OsUser[]
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}) {
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  useEffect(() => {
    setTitulo(task?.title ?? "")
    setDescripcion(task?.description ?? "")
    setConfirmandoBorrado(false)
  }, [task?.id, task?.title, task?.description])

  if (!task) return null

  const guardarTexto = () => {
    const t = titulo.trim()
    const cambios: Partial<Task> = {}
    if (t && t !== task.title) cambios.title = t
    if (descripcion !== task.description) cambios.description = descripcion
    if (Object.keys(cambios).length) onUpdate(task.id, cambios)
  }

  const estaHecha = task.status === "hecha"

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-xl pb-[calc(1rem+env(safe-area-inset-bottom))] md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[460px] md:max-w-[460px] md:rounded-none md:border-l md:pb-0"
      >
        <div aria-hidden className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="px-4 pb-0">
          <SheetTitle className="text-[17px] font-semibold">Tarea</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Título</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onBlur={guardarTexto}
              enterKeyHint="done"
              className={`${CAMPO} h-11 md:h-9`}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Descripción</span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              onBlur={guardarTexto}
              rows={6}
              placeholder="Qué hay que hacer exactamente"
              className={`${CAMPO} resize-y py-2`}
            />
          </label>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium text-muted-foreground">Prioridad</legend>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onUpdate(task.id, { priority: p })}
                  aria-pressed={task.priority === p}
                  className={
                    task.priority === p
                      ? "flex h-11 flex-col items-center justify-center rounded-lg bg-brand text-background md:h-10"
                      : "flex h-11 flex-col items-center justify-center rounded-lg border border-border bg-card text-foreground active:bg-muted md:h-10"
                  }
                >
                  <span className="text-[15px] font-semibold">{p}</span>
                  <span className="text-[11px] opacity-80">{PRIORITY_HINTS[p]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Responsable</span>
            <select
              value={task.assigneeId ?? ""}
              onChange={(e) => onUpdate(task.id, { assigneeId: e.target.value || null })}
              className={`${CAMPO} h-11 md:h-9`}
            >
              <option value="">Sin responsable</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="sticky bottom-0 mt-2 flex flex-col gap-2 border-t border-border bg-popover px-4 py-3">
          <button
            type="button"
            onClick={() => onUpdate(task.id, { status: estaHecha ? "pendiente" : "hecha" })}
            className={
              estaHecha
                ? "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-[15px] font-semibold text-foreground active:bg-muted"
                : "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[15px] font-semibold text-background active:opacity-90"
            }
          >
            {estaHecha ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
            {estaHecha ? "Volver a pendiente" : "Marcar como hecha"}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdate(task.id, {
                  status: task.status === "archivada" ? "pendiente" : "archivada",
                })
              }
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-[15px] text-foreground active:bg-muted"
            >
              <Archive className="size-4" />
              {task.status === "archivada" ? "Desarchivar" : "Archivar"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!confirmandoBorrado) {
                  setConfirmandoBorrado(true)
                  return
                }
                onDelete(task.id)
                onClose()
              }}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 text-[15px] text-destructive active:bg-destructive/20"
            >
              <Trash2 className="size-4" />
              {confirmandoBorrado ? "¿Seguro? Eliminar" : "Eliminar"}
            </button>
          </div>
          {confirmandoBorrado && (
            <p className="text-sm text-muted-foreground">
              Se borra para siempre. Pulsa otra vez para confirmar.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
