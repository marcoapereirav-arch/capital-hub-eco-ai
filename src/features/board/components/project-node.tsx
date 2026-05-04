"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

type ProjectNodeData = {
  label: string
  color: string
  paraType: "project" | "area" | "resource" | "archive"
}

export function ProjectNode({ data }: NodeProps) {
  const { label, color, paraType } = data as unknown as ProjectNodeData
  const isProject = paraType === "project"
  const size = isProject ? 100 : 80

  return (
    <div
      className="flex items-center justify-center rounded-full border-4 font-heading font-semibold text-center px-3 leading-tight shadow-lg"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}40 0%, ${color}15 70%, transparent 100%)`,
        borderColor: color,
        color: "#fff",
        fontSize: isProject ? 11 : 10,
        boxShadow: `0 0 30px ${color}30`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <span className="break-words">{label}</span>
    </div>
  )
}
