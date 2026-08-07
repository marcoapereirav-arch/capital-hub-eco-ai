import type { GTDStatus, Priority } from "@/features/tasks/types/task"

export type MisionAssignee = "marco" | "adrian" | "equipo" | "ai" | "jp" | "paolo" | "steven"

export type LaunchPhase = {
  id: string
  slug: string
  name: string
  description: string
  order: number
  targetDate: string
}

export type MisionTask = {
  id: string
  title: string
  description: string
  status: GTDStatus
  priority: Priority
  assignee: MisionAssignee
  paraId: string | null
  dueDate: string | null
  dependsOn: string[]
  isInProgress: boolean
  completedAt: string | null
  launchPhaseId: string | null
  launchBlock: string | null
}

export const ASSIGNEE_LABELS: Record<MisionAssignee, string> = {
  adrian: "Adrián",
  marco: "Marco",
  jp: "JP",
  paolo: "Paolo",
  steven: "Steven",
  equipo: "Equipo",
  ai: "AI",
}

export const ASSIGNEE_INITIALS: Record<MisionAssignee, string> = {
  adrian: "AV",
  marco: "MA",
  jp: "JP",
  paolo: "PA",
  steven: "ST",
  equipo: "EQ",
  ai: "AI",
}

export const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export const STATUS_LABELS: Record<GTDStatus, string> = {
  inbox: "Inbox",
  next: "Pendiente",
  waiting: "Bloqueada",
  someday: "Más adelante",
  done: "Completada",
}

/* La marca es carbon y verde: lo hecho va en verde, lo bloqueado en el rojo del
 * tema, lo que pide atencion en el ambar de aviso y el resto en gris. Antes
 * cada estado traia una familia de Tailwind escrita a mano (blue, emerald,
 * orange), que son colores distintos a los de la marca. */
export const STATUS_COLORS: Record<GTDStatus, string> = {
  inbox: "bg-muted text-muted-foreground border-border",
  next: "bg-muted text-foreground border-border",
  waiting: "bg-destructive/10 text-destructive border-destructive/30",
  someday: "bg-muted text-muted-foreground border-border",
  done: "bg-primary/10 text-primary border-primary/30",
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-warn/10 text-warn border-warn/30",
  normal: "bg-muted text-muted-foreground border-border",
  low: "bg-muted text-muted-foreground border-border",
}
