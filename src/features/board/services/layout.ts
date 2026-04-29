import type { Node, Edge } from "@xyflow/react"
import type { ParaItem } from "@/features/tasks/types/task"
import type { TaskWithDeps } from "../types/board"

// Paleta para proyectos (cíclica). Cada PARA item recibe un color estable.
const PALETTE = [
  "#3b82f6", // blue
  "#a78bfa", // violet
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f43f5e", // rose
  "#84cc16", // lime
  "#8b5cf6", // purple
  "#14b8a6", // teal
]

export function colorForPara(paraId: string | null, paraIndex: number): string {
  if (!paraId) return "#6b7280" // gray for orphans
  return PALETTE[paraIndex % PALETTE.length]
}

export type LayoutData = {
  nodes: Node[]
  edges: Edge[]
}

/**
 * Layout estilo "constellation" — cada proyecto es un sol, sus tasks son planetas
 * orbitando alrededor en círculo. Tasks sin proyecto van al centro como cluster orphan.
 */
export function buildLayout(tasks: TaskWithDeps[], paraItems: ParaItem[]): LayoutData {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Solo proyectos (type=project) reciben nodo central destacado.
  // Áreas/recursos también pero más pequeños.
  const projectsAndAreas = paraItems.filter((p) => p.type === "project" || p.type === "area")

  // Filtramos PARA items que tienen al menos una task asociada (para no llenar de nodos vacíos)
  const usedParaIds = new Set(tasks.map((t) => t.paraId).filter(Boolean) as string[])
  const visibleParas = projectsAndAreas.filter((p) => usedParaIds.has(p.id))

  // Layout circular global: cada proyecto en un punto del círculo grande
  const galaxyRadius = Math.max(300, visibleParas.length * 90)
  const centerX = 0
  const centerY = 0

  visibleParas.forEach((para, i) => {
    const angle = (i / visibleParas.length) * 2 * Math.PI - Math.PI / 2 // empieza arriba
    const px = centerX + galaxyRadius * Math.cos(angle)
    const py = centerY + galaxyRadius * Math.sin(angle)
    const color = colorForPara(para.id, i)

    nodes.push({
      id: `project-${para.id}`,
      type: "project",
      position: { x: px, y: py },
      data: {
        label: para.name,
        color,
        paraType: para.type,
      },
    })

    // Tasks asociadas a este PARA: orbitan alrededor
    const myTasks = tasks.filter((t) => t.paraId === para.id)
    const orbitRadius = Math.max(180, myTasks.length * 25)

    myTasks.forEach((task, j) => {
      const tAngle = (j / Math.max(myTasks.length, 1)) * 2 * Math.PI
      const tx = px + orbitRadius * Math.cos(tAngle)
      const ty = py + orbitRadius * Math.sin(tAngle)

      nodes.push({
        id: task.id,
        type: "task",
        position: { x: tx, y: ty },
        data: {
          task,
          projectColor: color,
        },
      })

      // Edge task → project (sutil)
      edges.push({
        id: `edge-${task.id}-${para.id}`,
        source: task.id,
        target: `project-${para.id}`,
        type: "default",
        style: {
          stroke: color,
          strokeOpacity: task.status === "done" ? 0.15 : 0.35,
          strokeWidth: 1,
        },
        animated: false,
      })
    })
  })

  // Tasks sin PARA → cluster orphan al centro
  const orphans = tasks.filter((t) => !t.paraId || !visibleParas.find((p) => p.id === t.paraId))
  orphans.forEach((task, i) => {
    const angle = (i / Math.max(orphans.length, 1)) * 2 * Math.PI
    const r = 80
    nodes.push({
      id: task.id,
      type: "task",
      position: { x: r * Math.cos(angle), y: r * Math.sin(angle) },
      data: {
        task,
        projectColor: "#6b7280",
      },
    })
  })

  // Edges de dependencias (task → task) — animadas y más visibles
  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      const depExists = tasks.find((t) => t.id === depId)
      if (!depExists) continue
      // edge va FROM la dependencia TO la task que la necesita
      edges.push({
        id: `dep-${depId}-${task.id}`,
        source: depId,
        target: task.id,
        type: "default",
        style: {
          stroke: task.status === "done" || depExists.status === "done" ? "#374151" : "#f59e0b",
          strokeWidth: 2,
          strokeDasharray: "5 5",
        },
        animated: depExists.status !== "done" && task.status !== "done",
        label: "depends",
        labelStyle: {
          fill: "#9ca3af",
          fontSize: 9,
          fontFamily: "var(--font-mono), monospace",
        },
        labelBgStyle: {
          fill: "#0F0F12",
          fillOpacity: 0.8,
        },
        labelBgPadding: [4, 4],
      })
    }
  }

  return { nodes, edges }
}
