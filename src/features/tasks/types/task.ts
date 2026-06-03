export type GTDStatus = "inbox" | "next" | "waiting" | "someday" | "done"
export type Priority = "urgent" | "high" | "normal" | "low"
export type ParaType = "project" | "area" | "resource" | "archive"
export type ParaStatus = "active" | "completed"
export type Assignee = "marco" | "adrian" | "equipo" | "ai"

export type ParaItem = {
  id: string
  name: string
  type: ParaType
  status: ParaStatus
  parentId: string | null
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
