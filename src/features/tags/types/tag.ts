export type Tag = {
  id: string
  name: string
  color: string
  description: string | null
  createdAt: string
  createdBy: string | null
}

export type ContactTag = {
  contactId: string
  tagId: string
  assignedAt: string
  assignedBy: string | null
}

/** Paleta predefinida estilo GoHighLevel — el usuario tambien puede meter color custom hex. */
export const TAG_COLOR_PALETTE: { value: string; label: string }[] = [
  { value: "#ef4444", label: "Rojo" },
  { value: "#f97316", label: "Naranja" },
  { value: "#f59e0b", label: "Ambar" },
  { value: "#eab308", label: "Amarillo" },
  { value: "#84cc16", label: "Lima" },
  { value: "#10b981", label: "Esmeralda" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#71717a", label: "Gris" },
]
