"use client"

import { useState } from "react"
import { Globe, FileDown, Plus } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WebCard } from "./web-card"
import type { WebWithSteps, WebType } from "../types/web"

type WebsTab = "funnels" | "lead_magnets"

const TABS: { id: WebsTab; type: WebType; label: string; icon: typeof Globe; description: string }[] = [
  {
    id: "funnels",
    type: "funnel",
    label: "Funnels",
    icon: Globe,
    description: "Embudos de captación con sus steps (landing, checkout, thank you...)",
  },
  {
    id: "lead_magnets",
    type: "lead_magnet",
    label: "Lead Magnets",
    icon: FileDown,
    description: "Recursos descargables o accesos a contenido a cambio del email",
  },
]

interface WebsPageProps {
  webs: WebWithSteps[]
  publicBaseUrl: string
}

export function WebsPage({ webs, publicBaseUrl }: WebsPageProps) {
  const [tab, setTab] = useState<WebsTab>("funnels")
  const active = TABS.find((t) => t.id === tab)!
  const filtered = webs.filter((w) => w.type === active.type)

  return (
    <>
      <ShellHeader title="Webs" />
      <div className="flex flex-col gap-6 p-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = tab === t.id
            const count = webs.filter((w) => w.type === t.type).length
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
                {count > 0 && (
                  <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {count}
                  </span>
                )}
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

        {/* Lista o empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
            <active.icon className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Sin {active.label.toLowerCase()} todavía
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground/60">
              Cuando crees uno, aparecerá aquí con su ficha, copy-link y métricas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((web) => (
              <WebCard key={web.id} web={web} publicBaseUrl={publicBaseUrl} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
