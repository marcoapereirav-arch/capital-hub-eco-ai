/**
 * Operaciones = UNA lista de tareas. Un solo nivel.
 *
 * Marco (2026-08-07): "Solo va a existir un nivel de tareas y ya esta. Sera una lista
 * de todo las tareas y a partir de ahi ya iremos viendo si lo ponemos mas complejo".
 *
 * La tarea tiene CUATRO cosas y ni una mas: titulo, descripcion, prioridad y
 * responsable. Mas su estado. No hay proyectos, ni areas, ni focos, ni fechas limite,
 * ni dependencias. Si algo de eso hace falta algun dia, se anade entonces.
 */

export type Priority = "P1" | "P2" | "P3"
export type TaskStatus = "pendiente" | "hecha" | "archivada"

export const PRIORITIES: Priority[] = ["P1", "P2", "P3"]
export const STATUSES: TaskStatus[] = ["pendiente", "hecha", "archivada"]

export const PRIORITY_LABELS: Record<Priority, string> = {
  P1: "P1",
  P2: "P2",
  P3: "P3",
}

/** Se ensena al elegir prioridad, para que nadie tenga que adivinar que es P2. */
export const PRIORITY_HINTS: Record<Priority, string> = {
  P1: "Lo primero",
  P2: "Normal",
  P3: "Cuando haya hueco",
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  hecha: "Hecha",
  archivada: "Archivada",
}

/** Orden de urgencia para ordenar la lista. */
export const PRIORITY_RANK: Record<Priority, number> = { P1: 1, P2: 2, P3: 3 }

export type Task = {
  id: string
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  /** id del perfil del OS responsable. null = sin responsable. */
  assigneeId: string | null
  createdAt: string
  completedAt: string | null
}

/** Una persona del OS. Sale de `profiles`, no de una lista escrita a mano. */
export type OsUser = {
  id: string
  name: string
  email: string
}

export type SortBy = "prioridad" | "recientes" | "antiguas"

export const SORT_LABELS: Record<SortBy, string> = {
  prioridad: "Prioridad",
  recientes: "Más recientes",
  antiguas: "Más antiguas",
}

export type Filters = {
  status: TaskStatus | "todas"
  priority: Priority | "todas"
  assigneeId: string | "todos" | "sin"
  search: string
}

export const DEFAULT_FILTERS: Filters = {
  status: "pendiente",
  priority: "todas",
  assigneeId: "todos",
  search: "",
}

/** Cuantos filtros ha tocado el usuario. Se ensena en el boton "Filtros". */
export function countActiveFilters(f: Filters): number {
  let n = 0
  if (f.status !== DEFAULT_FILTERS.status) n++
  if (f.priority !== "todas") n++
  if (f.assigneeId !== "todos") n++
  if (f.search.trim()) n++
  return n
}

export function nombreDe(users: OsUser[], id: string | null): string | null {
  if (!id) return null
  return users.find((u) => u.id === id)?.name ?? null
}

/** Iniciales para el avatar. "Marco Antonio" -> "MA". */
export function inicialesDe(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}
