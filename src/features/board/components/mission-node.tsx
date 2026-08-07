"use client"

import { Handle, Position } from "@xyflow/react"
import { Target } from "lucide-react"
import { FUNNEL_KPIS, FUNNEL_GOAL } from "../services/strategy-data"

// El nodo de la MISION era un panel ambar con degradado y sombras escritas a mano.
// Ahora es la tarjeta de la marca: carbon con el verde de acento marcando el foco.
export function MissionNode() {
  return (
    <div
      className="relative rounded-xl border-2 border-primary bg-card px-6 py-5 shadow-lg"
      style={{ width: 360 }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />

      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-full bg-primary/15 p-1.5">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-semibold text-primary">Misión</p>
      </div>

      <h2 className="mb-1 font-heading text-xl leading-tight font-bold tracking-tight text-foreground">
        {FUNNEL_GOAL.daily_ad_spend_eur.toLocaleString()}€/día en publi
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        alcanzando los 5 KPIs · proyección · objetivo
      </p>

      <div className="space-y-1.5">
        {FUNNEL_KPIS.map((k) => (
          <div key={k.step} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">
              {k.fromStage} → {k.toStage}
            </span>
            <span className="flex shrink-0 items-center gap-1 tabular-nums">
              <span className="text-muted-foreground">{k.proyeccion}%</span>
              <span className="text-border">·</span>
              <span className="font-semibold text-primary">{k.objetivo}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
