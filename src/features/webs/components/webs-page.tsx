"use client"

import { Globe, Plus } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
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
      {/* PageContainer pone los margenes del shell y reserva el hueco de la barra
          de abajo del telefono. Antes esta pantalla ponia su propio padding y la
          ultima tarjeta quedaba debajo del menu. */}
      <PageContainer>
        {/* En telefono el titulo y el boton no caben en la misma fila: se apilan
            y el boton pasa a ancho completo, que es donde acierta el dedo. */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Funnels</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Embudos de captación con sus steps (landing, thank you, etc) y su estado (draft / published).
            </p>
          </div>
          <Button variant="secondary" disabled className="w-full shrink-0 md:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Funnel
          </Button>
        </div>

        {funnels.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
            <Globe className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-[17px] font-semibold text-foreground">Sin funnels todavía</h3>
            <p className="max-w-[38ch] text-[15px] text-muted-foreground">
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
      </PageContainer>
    </>
  )
}
