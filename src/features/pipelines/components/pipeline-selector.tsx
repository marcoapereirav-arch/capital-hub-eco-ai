"use client"

import { Layers } from "lucide-react"
import type { Pipeline } from "../types/pipeline"
import { cn } from "@/lib/utils"

/**
 * Selector compacto del pipeline activo. Aparece como dropdown nativo (<select>)
 * para que coincida estilisticamente con el resto de filtros del CRM.
 */
export function PipelineSelector({
  pipelines,
  activeId,
  onChange,
  className,
}: {
  pipelines: Pipeline[]
  activeId: string | null
  onChange: (id: string) => void
  className?: string
}) {
  if (pipelines.length === 0) {
    return (
      <span className="text-[10px] font-mono text-muted-foreground">
        Sin pipelines. Crea en /crm/pipelines
      </span>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Layers className="h-3 w-3 text-muted-foreground" />
      <select
        value={activeId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-sm border border-border bg-background px-2 text-xs"
      >
        {pipelines.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}{p.isDefault ? " · default" : ""}
          </option>
        ))}
      </select>
    </div>
  )
}
