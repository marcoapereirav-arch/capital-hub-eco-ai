"use client"

import { Handle, Position } from "@xyflow/react"
import { Target } from "lucide-react"
import { FUNNEL_KPIS, FUNNEL_GOAL } from "../services/strategy-data"

export function MissionNode() {
  return (
    <div
      className="relative rounded-2xl border-4 border-amber-400 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/15 px-6 py-5 shadow-2xl"
      style={{
        width: 360,
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
        {FUNNEL_GOAL.daily_ad_spend_eur.toLocaleString()}€/día en publi
      </h2>
      <p className="font-mono text-[10px] uppercase tracking-wide text-amber-200/80 mb-4">
        alcanzando los 5 KPIs · proyección · objetivo
      </p>

      <div className="space-y-1.5">
        {FUNNEL_KPIS.map((k) => (
          <div key={k.step} className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-amber-100/80 truncate">
              {k.fromStage} → {k.toStage}
            </span>
            <span className="font-mono shrink-0 flex items-center gap-1">
              <span className="text-amber-200/60">{k.proyeccion}%</span>
              <span className="text-amber-200/30">·</span>
              <span className="text-amber-200 font-semibold">{k.objetivo}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
