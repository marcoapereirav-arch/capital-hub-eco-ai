"use client"

import { useState } from "react"
import { Globe, FileDown, Plus } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WebsTab = "funnels" | "lead_magnets"

const TABS: { id: WebsTab; label: string; icon: typeof Globe; description: string }[] = [
  {
    id: "funnels",
    label: "Funnels",
    icon: Globe,
    description: "Embudos de captación con sus steps (landing, checkout, thank you...)",
  },
  {
    id: "lead_magnets",
    label: "Lead Magnets",
    icon: FileDown,
    description: "Recursos descargables o accesos a contenido a cambio del email",
  },
]

export function WebsPage() {
  const [tab, setTab] = useState<WebsTab>("funnels")
  const active = TABS.find((t) => t.id === tab)!

  return (
    <>
      <ShellHeader title="Webs" />
      <div className="flex flex-col gap-6 p-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Header de la sección */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              {active.label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
          </div>
          <Button variant="secondary" size="sm" disabled className="font-mono text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo {active.label.slice(0, -1)}
          </Button>
        </div>

        {/* Empty state — Fase 1 traerá el listado real */}
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
          <active.icon className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Sin {active.label.toLowerCase()} todavía
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/60">
            La Fase 1 del módulo Webs traerá el listado, fichas y copy-link.
            Mientras tanto, la base de datos ya está lista para almacenarlos.
          </p>
        </div>
      </div>
    </>
  )
}
