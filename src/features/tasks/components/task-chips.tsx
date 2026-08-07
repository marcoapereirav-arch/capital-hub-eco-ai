"use client"

import { cn } from "@/lib/utils"
import { inicialesDe, PRIORITY_LABELS, STATUS_LABELS, type Priority, type TaskStatus } from "../types/task"

/**
 * Piezas pequenas que se repiten en la lista y en el detalle.
 * El verde de marca es `brand` (--brand: 34 197 94). NO se usa `primary`: en modo
 * oscuro `--primary` es BLANCO, que es el acento del diseno antiguo.
 */

const PRIORITY_STYLES: Record<Priority, string> = {
  P1: "border-destructive/40 bg-destructive/10 text-destructive",
  P2: "border-brand/40 bg-brand/10 text-brand",
  P3: "border-border bg-muted text-muted-foreground",
}

export function PriorityChip({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-sm border px-2 text-sm font-semibold tabular-nums",
        PRIORITY_STYLES[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  pendiente: "border-border bg-card text-foreground",
  hecha: "border-brand/40 bg-brand/10 text-brand",
  archivada: "border-border bg-muted text-muted-foreground",
}

export function StatusChip({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-sm border px-2 text-sm",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

/** Quien tiene que accionar la tarea. Sin responsable se dice, no se deja en blanco. */
export function PersonChip({ nombre, className }: { nombre: string | null; className?: string }) {
  if (!nombre) {
    return (
      <span className={cn("inline-flex items-center text-sm text-muted-foreground", className)}>
        Sin responsable
      </span>
    )
  }
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground"
      >
        {inicialesDe(nombre)}
      </span>
      <span className="truncate text-sm text-muted-foreground">{nombre}</span>
    </span>
  )
}
