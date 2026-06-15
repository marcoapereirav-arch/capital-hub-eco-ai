"use client"

import { useState } from "react"
import { Layers, Settings } from "lucide-react"
import type { Pipeline } from "../types/pipeline"
import { PipelinesManagerDrawer } from "./pipelines-manager-drawer"
import { cn } from "@/lib/utils"

/**
 * Selector compacto del pipeline activo + boton para abrir el gestor de pipelines
 * en un drawer SIN salir del entorno. Reemplaza la pestana 'Pipelines' separada.
 */
export function PipelineSelector({
  pipelines,
  activeId,
  onChange,
  className,
  onPipelinesChanged,
}: {
  pipelines: Pipeline[]
  activeId: string | null
  onChange: (id: string) => void
  className?: string
  /** Callback opcional cuando se cierra el drawer (para refrescar). */
  onPipelinesChanged?: () => void
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Layers className="h-3 w-3 text-muted-foreground" />
      {pipelines.length === 0 ? (
        <span className="text-[10px] font-mono text-muted-foreground">Sin pipelines</span>
      ) : (
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
      )}
      <button
        onClick={() => setDrawerOpen(true)}
        className="h-8 inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        title="Configurar pipelines y stages"
      >
        <Settings className="h-3 w-3" />
        <span className="hidden md:inline">Configurar</span>
      </button>

      <PipelinesManagerDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          onPipelinesChanged?.()
        }}
      />
    </div>
  )
}
