import type { Node, Edge } from "@xyflow/react"
import type { ParaItem } from "@/features/tasks/types/task"
import type { TaskWithDeps } from "../types/board"

// Paleta de colores por proyecto (cíclica). Cada PARA item recibe un color estable.
const PROJECT_PALETTE = [
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

export function colorForProject(paraIndex: number): string {
  return PROJECT_PALETTE[paraIndex % PROJECT_PALETTE.length]
}

export type LayoutData = {
  nodes: Node[]
  edges: Edge[]
}

/**
 * Layout galáctico con MISIÓN al centro:
 *   Nivel 0 (centro): MISIÓN — los 5 KPIs y el goal 1.000€/día
 *   Nivel 1 (órbita amplia): PROYECTOS (PARA items con tasks)
 *   Nivel 2 (orbitan cada proyecto): TASKS de ese proyecto
 *
 * Espaciado generoso para evitar solapamientos.
 */
export function buildLayout(tasks: TaskWithDeps[], paraItems: ParaItem[]): LayoutData {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // 1) NODO CENTRAL: MISIÓN
  nodes.push({
    id: "mission",
    type: "mission",
    position: { x: -160, y: -100 }, // -160 = -width/2; -100 = -height/2 aprox
    data: {},
    draggable: true,
    selectable: false,
  })

  // 2) PROYECTOS (solo project + area con tasks asociadas)
  const projectsAndAreas = paraItems.filter((p) => p.type === "project" || p.type === "area")
  const usedParaIds = new Set(tasks.map((t) => t.paraId).filter(Boolean) as string[])
  const visibleParas = projectsAndAreas.filter((p) => usedParaIds.has(p.id))

  // Radio amplio para que los proyectos no se choquen con la misión ni entre ellos
  const projectRadius = Math.max(550, visibleParas.length * 130)

  visibleParas.forEach((para, i) => {
    const angle = (i / visibleParas.length) * 2 * Math.PI - Math.PI / 2 // empieza arriba
    const px = projectRadius * Math.cos(angle)
    const py = projectRadius * Math.sin(angle)
    const color = colorForProject(i)

    nodes.push({
      id: `project-${para.id}`,
      type: "project",
      position: { x: px - 50, y: py - 50 }, // centrado (radio del project node ~50)
      data: {
        label: para.name,
        color,
        paraType: para.type,
      },
    })

    // Edge sutil proyecto → misión
    edges.push({
      id: `edge-mission-${para.id}`,
      source: `project-${para.id}`,
      target: "mission",
      type: "default",
      style: {
        stroke: "#fbbf24",
        strokeOpacity: 0.15,
        strokeWidth: 1,
        strokeDasharray: "3 6",
      },
      animated: false,
    })

    // 3) TASKS de este proyecto orbitando alrededor
    const myTasks = tasks.filter((t) => t.paraId === para.id)
    // Radio mayor cuanto más tasks, para evitar solapes
    const orbitRadius = Math.max(240, myTasks.length * 40)

    myTasks.forEach((task, j) => {
      // Distribuir en círculo alrededor del proyecto
      const tAngle = (j / Math.max(myTasks.length, 1)) * 2 * Math.PI
      const tx = px + orbitRadius * Math.cos(tAngle)
      const ty = py + orbitRadius * Math.sin(tAngle)

      nodes.push({
        id: task.id,
        type: "task",
        position: { x: tx - 100, y: ty - 25 }, // centrado aprox
        data: {
          task,
          projectColor: color,
        },
      })

      // Edge task → proyecto (sutil, color del proyecto)
      edges.push({
        id: `edge-${task.id}-${para.id}`,
        source: task.id,
        target: `project-${para.id}`,
        type: "default",
        style: {
          stroke: color,
          strokeOpacity: 0.3,
          strokeWidth: 1,
        },
      })
    })
  })

  // Tasks sin PARA → cluster orphan abajo
  const orphans = tasks.filter((t) => !t.paraId || !visibleParas.find((p) => p.id === t.paraId))
  if (orphans.length > 0) {
    const orphanRadius = projectRadius + 250
    orphans.forEach((task, i) => {
      const angle = (i / Math.max(orphans.length, 1)) * 2 * Math.PI
      nodes.push({
        id: task.id,
        type: "task",
        position: { x: orphanRadius * Math.cos(angle) - 100, y: orphanRadius * Math.sin(angle) - 25 },
        data: {
          task,
          projectColor: "#6b7280",
        },
      })
    })
  }

  // 4) EDGES de dependencias (task → task) — animadas y visibles
  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      const depExists = tasks.find((t) => t.id === depId)
      if (!depExists) continue
      const bothActive = depExists.status !== "done" && task.status !== "done"
      edges.push({
        id: `dep-${depId}-${task.id}`,
        source: depId,
        target: task.id,
        type: "default",
        style: {
          stroke: bothActive ? "#fb923c" : "#3f3f46",
          strokeWidth: 2,
          strokeDasharray: "5 5",
        },
        animated: bothActive,
        label: "depende",
        labelStyle: {
          fill: "#fbbf24",
          fontSize: 9,
          fontFamily: "var(--font-mono), monospace",
        },
        labelBgStyle: {
          fill: "#0F0F12",
          fillOpacity: 0.85,
        },
        labelBgPadding: [4, 4],
      })
    }
  }

  return { nodes, edges }
}
