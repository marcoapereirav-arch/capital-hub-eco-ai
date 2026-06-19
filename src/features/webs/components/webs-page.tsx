"use client"

import { Globe, Plus } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { Button } from "@/components/ui/button"
import { WebCard } from "./web-card"
import type { WebWithSteps } from "../types/web"

interface WebsPageProps {
  webs: WebWithSteps[]
  publicBaseUrl: string
}

/**
 * /webs — gestión de funnels.
 * Decisión Marco 2026-06-19: eliminado el tab "Lead Magnets" duplicado.
 * Lead Magnets viven en su propia ruta `/webs/lead-magnets` (link en nav).
 */
export function WebsPage({ webs, publicBaseUrl }: WebsPageProps) {
  const funnels = webs.filter((w) => w.type === "funnel")

  return (
    <>
      <ShellHeader title="Webs" />
      <div className="flex flex-col gap-5 p-4 pb-mobile-nav md:gap-6 md:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Funnels</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Embudos de captación con sus steps (landing, thank you, etc) y su estado (draft / published).
            </p>
          </div>
          <Button variant="secondary" size="sm" disabled className="font-mono text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo Funnel
          </Button>
        </div>

        {funnels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
            <Globe className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Sin funnels todavía
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground/60">
              Cuando crees uno, aparecerá aquí con su ficha, copy-link y métricas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {funnels.map((web) => (
              <WebCard key={web.id} web={web} publicBaseUrl={publicBaseUrl} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
