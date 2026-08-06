"use client"

import { useState } from "react"
import { Layers, Settings } from "lucide-react"
import type { Pipeline } from "../types/pipeline"
import { PipelinesManagerDrawer } from "./pipelines-manager-drawer"
import { cn } from "@/lib/utils"

/**
 * Selector del pipeline activo + boton para abrir el gestor de pipelines en una
 * hoja SIN salir del entorno. Reemplaza la pestana 'Pipelines' separada.
 *
 * En telefono el desplegable ocupa la linea entera y mide 44 puntos: es un
 * <select> nativo, asi que el sistema lo pinta como rueda y se acierta con el dedo.
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
    <div className={cn("flex w-full items-center gap-2 md:w-auto", className)}>
      <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
      {pipelines.length === 0 ? (
        <span className="text-sm text-muted-foreground">Sin pipelines</span>
      ) : (
        <select
          value={activeId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Pipeline activo"
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-base text-foreground md:h-8 md:flex-none md:px-2 md:text-sm"
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
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[15px] text-muted-foreground transition-colors md:h-8 md:px-2 md:text-sm md:hover:text-foreground"
        title="Configurar pipelines y stages"
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
