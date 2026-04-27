"use client"

import { Users, KanbanSquare } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { Button } from "@/components/ui/button"

export function CrmPage() {
  return (
    <>
      <ShellHeader title="CRM" />
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Pipeline de oportunidades
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vista kanban con drag-and-drop. Opportunities desde funnels propios y GHL.
            </p>
          </div>
          <Button variant="secondary" size="sm" disabled className="font-mono text-xs">
            Configurar pipeline
          </Button>
        </div>

        {/* Empty state — Fase 6 traerá el kanban real */}
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
          <KanbanSquare className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Kanban próximamente
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/60">
            La Fase 6 traerá el pipeline completo con drag-and-drop, filtros y conexión
            a las opportunities de GHL más las de funnels propios.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/50">
            <Users className="h-3.5 w-3.5" />
            <span>Pipeline default &quot;Ventas&quot; ya creado con 6 stages</span>
          </div>
        </div>
      </div>
    </>
  )
}
