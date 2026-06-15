export type GTDStatus = "inbox" | "next" | "waiting" | "someday" | "done"
export type Priority = "urgent" | "high" | "normal" | "low"
export type ParaType = "project" | "area" | "resource" | "archive"
export type ParaStatus = "active" | "paused" | "completed"

export const PARA_STATUS_LABELS: Record<ParaStatus, string> = {
  active: "En progreso",
  paused: "En pausa",
  completed: "Completados",
}
export type Assignee = "marco" | "adrian" | "equipo" | "ai"

export type ParaPriority = "urgent" | "important" | "normal" | "low"

export type ParaItem = {
  id: string
  name: string
  type: ParaType
  status: ParaStatus
  parentId: string | null
  focusId: string | null
  displayOrder?: number | null
  priority?: ParaPriority | null
}

export const PARA_PRIORITY_RANK: Record<ParaPriority, number> = {
  urgent: 1,
  important: 2,
  normal: 3,
  low: 4,
}

export const PARA_PRIORITY_LABELS: Record<ParaPriority, string> = {
  urgent: "Urgente",
  important: "Importante",
  normal: "Normal",
  low: "Baja",
}

export const PARA_PRIORITY_COLORS: Record<ParaPriority, string> = {
  urgent: "border-red-500/40 text-red-400 bg-red-500/[0.06]",
  important: "border-amber-500/40 text-amber-400 bg-amber-500/[0.06]",
  normal: "border-cyan-500/40 text-cyan-400 bg-cyan-500/[0.06]",
  low: "border-zinc-500/40 text-muted-foreground bg-zinc-500/[0.06]",
}

export type Focus = {
  id: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  color: string
  active: boolean
  sortOrder: number
}

// IDs deterministas de las 4 áreas raíz (deben existir en BD via migration 0024)
export const AREA_IDS = {
  MARKETING: "area_marketing",
  PRODUCTO: "area_producto",
  VENTAS: "area_ventas",
  FINANZAS: "area_finanzas",
} as const

export const ROOT_AREAS: { id: string; name: string }[] = [
  { id: AREA_IDS.MARKETING, name: "Marketing" },
  { id: AREA_IDS.PRODUCTO, name: "Producto" },
  { id: AREA_IDS.VENTAS, name: "Ventas" },
  { id: AREA_IDS.FINANZAS, name: "Finanzas" },
]

export type Task = {
  id: string
  title: string
  description: string
  status: GTDStatus
  priority: Priority
  assignee: Assignee
  paraId: string | null
  dueDate: string | null
  createdAt: string
  completedAt: string | null
}

export const GTD_LABELS: Record<GTDStatus, string> = {
  inbox: "Inbox",
  next: "Next Action",
  waiting: "Waiting For",
  someday: "Someday",
  done: "Done",
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgente",
  high: "Alta",
  normal: "Normal",
  low: "Baja",
}

export const PARA_TYPE_LABELS: Record<ParaType, string> = {
  project: "Proyectos",
  area: "Areas",
  resource: "Recursos",
  archive: "Archivo",
}

export const ASSIGNEE_LABELS: Record<Assignee, string> = {
  marco: "Marco Antonio",
  adrian: "Adrian",
  equipo: "Equipo",
  ai: "AI · Agente",
}
