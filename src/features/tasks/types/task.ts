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

// Los cuatro niveles se pintan con los tokens del tema, no con familias sueltas de
// Tailwind: rojo de error para lo urgente, ambar de aviso para lo importante y
// grises de la marca para el resto. Antes eran red/amber/cyan/zinc, o sea cuatro
// colores que no existen en el brandkit de Capital Hub.
export const PARA_PRIORITY_COLORS: Record<ParaPriority, string> = {
  urgent: "border-destructive/40 text-destructive bg-destructive/10",
  important: "border-warn/40 text-warn bg-warn/10",
  normal: "border-border text-foreground bg-muted",
  low: "border-border text-muted-foreground bg-muted",
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
