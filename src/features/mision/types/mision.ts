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

export const STATUS_COLORS: Record<GTDStatus, string> = {
  inbox: "bg-muted text-muted-foreground",
  next: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  waiting: "bg-red-500/15 text-red-300 border-red-500/30",
  someday: "bg-muted text-muted-foreground border-border",
  done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "bg-red-500/15 text-red-300 border-red-500/30",
  high: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  normal: "bg-muted text-muted-foreground border-border",
  low: "bg-muted/50 text-muted-foreground/70 border-border",
}
