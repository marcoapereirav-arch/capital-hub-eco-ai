"use client"

import { useState } from "react"
import { Activity, BarChart3, Settings as SettingsIcon } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { cn } from "@/lib/utils"
import { AdsTrackerPanel } from "./ads-tracker-panel"
import { AdsConfigPanel } from "./ads-config-panel"
import { AdsInsights } from "./ads-insights"
import { AdsEventsHealth, RegistroTecnico } from "./ads-events-health"

/**
 * Sección de Ads: TRES pestañas, no cinco (Marco, 2026-07-31).
 *
 * Antes había Tracker, Dashboard, Atribución, Afiliados y Configuración. Se entraba y lo
 * primero era una tabla técnica de eventos, no si estabas ganando o perdiendo dinero.
 * Atribución además estaba vacía (era un cartel de "próximamente"), así que ocupaba una
 * pestaña sin dar nada.
 *
 *   Campañas  qué gastas y qué produce
 *   Eventos   si la medición funciona, funnel por funnel
 *   Ajustes   píxel, token, cuenta y el interruptor prueba/real
 *
 * Afiliados se movió a su propia sección (`/afiliados`): son fuentes de tráfico de
 * personas, no configuración de anuncios.
 */

type AdsTab = "campanas" | "eventos" | "ajustes"

const TABS: { id: AdsTab; label: string; icon: typeof Activity; description: string }[] = [
  {
    id: "campanas",
    label: "Campañas",
    icon: BarChart3,
    description: "Lo que gastas y lo que produce, en vivo desde Meta",
  },
  {
    id: "eventos",
    label: "Eventos",
    icon: Activity,
    description: "Si la medición funciona: un funnel por fila, con lo que dispara y cuándo llegó",
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icon: SettingsIcon,
    description: "Píxel, token, cuenta publicitaria y el interruptor de prueba o real",
  },
]

interface Props {
  pixelIdMasked: string | null
  capiTokenMasked: string | null
  adAccountId: string | null
  hasTestEventCode: boolean
}

export function AdsPage({ pixelIdMasked, capiTokenMasked, adAccountId, hasTestEventCode }: Props) {
  // Se abre en Eventos: lo primero que hay que saber es si esto está midiendo.
  const [tab, setTab] = useState<AdsTab>("eventos")
  const active = TABS.find((t) => t.id === tab)!

  return (
    <>
      <ShellHeader title="Ads" />
      {/* PageContainer: márgenes y ancho máximo estándar del OS. Sin él la pantalla se
          pegaba a los bordes de la aplicación. El candado `npm run check:layout` impide
          que vuelva a pasar. */}
      {/* pb-24 extra: el botón flotante de "Registrar venta" tapaba la última fila. */}
      <PageContainer className="pb-mobile-nav [&>*:last-child]:mb-24">
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
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

        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">{active.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
        </div>

        {tab === "campanas" && <AdsInsights />}

        {tab === "eventos" && (
          <div className="flex flex-col gap-4">
            <AdsEventsHealth />
            <RegistroTecnico>
              <AdsTrackerPanel />
            </RegistroTecnico>
          </div>
        )}

        {tab === "ajustes" && (
          <AdsConfigPanel
            pixelIdMasked={pixelIdMasked}
            capiTokenMasked={capiTokenMasked}
            adAccountId={adAccountId}
            hasTestEventCode={hasTestEventCode}
          />
        )}
      </PageContainer>
    </>
  )
}
