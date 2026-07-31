"use client"

import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { AdsAffiliatesPanel } from "./ads-affiliates-panel"

/**
 * Afiliados como sección propia (Marco, 2026-07-31).
 *
 * Vivía metido como una pestaña dentro de Ads, donde no pintaba nada: Ads es la
 * configuración y el rendimiento de los anuncios de pago; esto son personas que traen
 * tráfico con su propio link. No se ha tocado el panel, solo se ha sacado de ahí.
 */
export function AfiliadosPage() {
  return (
    <>
      <ShellHeader title="Afiliados" />
      <PageContainer>
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">
            Fuentes de tráfico
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada persona con su link único y lo que ha traído: leads, agendados, alumnos e
            ingresos.
          </p>
        </div>
        <AdsAffiliatesPanel />
      </PageContainer>
    </>
  )
}
