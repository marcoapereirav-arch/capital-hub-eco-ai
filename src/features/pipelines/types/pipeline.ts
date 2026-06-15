export type StageKind = "active" | "won" | "lost" | "branch"

export type PipelineStage = {
  id: string
  pipelineId: string
  key: string
  name: string
  color: string
  kind: StageKind
  sortOrder: number
}

export type Pipeline = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  isDefault: boolean
  displayOrder: number
  createdAt: string
  stages: PipelineStage[]
}

export const STAGE_KIND_LABEL: Record<StageKind, string> = {
  active: "Activo",
  won: "Ganado",
  lost: "Perdido",
  branch: "Rama (seguimiento)",
}

export const STAGE_COLOR_PALETTE: { value: string; label: string }[] = [
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#6366f1", label: "Índigo" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#f97316", label: "Naranja" },
  { value: "#f59e0b", label: "Ámbar" },
  { value: "#eab308", label: "Amarillo" },
  { value: "#84cc16", label: "Lima" },
  { value: "#10b981", label: "Verde" },
  { value: "#71717a", label: "Gris" },
]
