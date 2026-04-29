"use client"

import { Handle, Position } from "@xyflow/react"
import { Target } from "lucide-react"

const KPIS = [
  { label: "Visita → Free Trial", obj: "30%" },
  { label: "Free Trial → Order Bump", obj: "30%" },
  { label: "Free Trial → Plan Anual", obj: "5%" },
  { label: "Free Trial → Agenda", obj: "70%" },
  { label: "Free Trial → One Año", obj: "60%" },
]

export function MissionNode() {
  return (
    <div
      className="relative rounded-2xl border-4 border-amber-400 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/15 px-6 py-5 shadow-2xl"
      style={{
        width: 320,
        boxShadow: "0 0 60px rgba(251, 191, 36, 0.35), 0 0 100px rgba(251, 146, 60, 0.15)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />

      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-full bg-amber-400/20 p-1.5">
          <Target className="h-4 w-4 text-amber-300" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">Misión</p>
      </div>

      <h2 className="font-heading text-xl font-bold leading-tight text-white mb-1">
        1.000€/día en publi
      </h2>
      <p className="font-mono text-[10px] uppercase tracking-wide text-amber-200/80 mb-4">
        alcanzando los 5 KPIs
      </p>

      <ul className="space-y-1.5">
        {KPIS.map((k, i) => (
          <li key={i} className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-amber-100/80 truncate">{k.label}</span>
            <span className="font-mono font-semibold text-amber-200 shrink-0">{k.obj}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
