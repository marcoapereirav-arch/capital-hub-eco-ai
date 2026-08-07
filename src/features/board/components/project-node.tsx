"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

type ProjectNodeData = {
  label: string
  color: string
  paraType: "project" | "area" | "resource" | "archive"
}

// Diametro del circulo en puntos. Circulo mas grande que antes (100/80) porque la
// etiqueta subio a 14 puntos, que es el minimo legible. Los proyectos orbitan a
// 750 puntos del centro, asi que crecer 28 puntos no acerca ningun nodo a otro.
// layout.ts importa estos numeros para centrar el nodo sobre su orbita: escritos
// dos veces se separaban, y el circulo quedaba descentrado con las lineas saliendo
// de un lado en vez de del centro.
export const PROJECT_NODE_SIZE = 128
export const AREA_NODE_SIZE = 108

export function ProjectNode({ data }: NodeProps) {
  const { label, color, paraType } = data as unknown as ProjectNodeData
  const isProject = paraType === "project"
  const size = isProject ? PROJECT_NODE_SIZE : AREA_NODE_SIZE

  return (
    <div
      className="flex items-center justify-center rounded-full border-4 px-3 text-center font-heading leading-tight font-semibold text-foreground shadow-lg"
      style={{
        width: size,
        height: size,
        // El color del proyecto es dato de producto (la paleta ciclica de
        // layout.ts), asi que se usa tal cual como relleno translucido en vez
        // del degradado radial que habia antes.
        backgroundColor: color + "1F",
        borderColor: color,
        fontSize: 14,
      }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <span className="break-words">{label}</span>
    </div>
  )
}
