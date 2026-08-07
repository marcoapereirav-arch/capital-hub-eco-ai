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
 *
 * En telefono el desplegable ocupa la linea entera y el boton se queda en cuadrado:
 * es un <select> nativo, asi que el sistema lo pinta como rueda y se acierta con el
 * dedo. Los 44 puntos de alto (zona tactil minima) ya vienen de FIELD, igual que en
 * el resto de campos del CRM.
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
    <div className={cn("flex w-full items-center gap-2 md:inline-flex md:w-auto", className)}>
      {pipelines.length === 0 ? (
        <span className="text-[14px] text-muted-foreground">Sin pipelines</span>
      ) : (
        <select
          value={activeId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Pipeline que se está viendo"
          className={cn(FIELD, "min-w-0 flex-1 cursor-pointer pr-8 md:flex-none")}
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
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-2 rounded-[4px] border border-border px-3 text-[14px] font-semibold text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-popover hover:text-foreground md:min-w-0 md:justify-start"
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
