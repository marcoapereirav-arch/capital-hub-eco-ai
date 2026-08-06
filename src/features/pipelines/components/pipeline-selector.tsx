"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import type { Pipeline } from "../types/pipeline"
import { PipelinesManagerDrawer } from "./pipelines-manager-drawer"
import { FIELD } from "@/features/crm/lib/brand"
import { cn } from "@/lib/utils"

/**
 * Elige que pipeline se ve en el kanban, y abre su configuracion en un panel lateral
 * SIN salir de la pantalla.
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
    <div className={cn("inline-flex items-center gap-2", className)}>
      {pipelines.length === 0 ? (
        <span className="text-[14px] text-[#A6AAB2]">Sin pipelines</span>
      ) : (
        <select
          value={activeId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Pipeline que se está viendo"
          className={cn(FIELD, "cursor-pointer pr-8")}
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.isDefault ? " (por defecto)" : ""}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={() => setDrawerOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-[rgba(245,246,247,0.1)] px-3 text-[14px] font-semibold text-[#A6AAB2] transition-colors hover:border-[rgba(245,246,247,0.2)] hover:bg-[#16161B] hover:text-[#F5F6F7]"
        title="Configurar pipelines y sus columnas"
      >
        <Settings className="h-4 w-4" />
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
