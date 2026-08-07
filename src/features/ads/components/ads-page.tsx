"use client"

import { useState } from "react"
import { Activity, BarChart3, Settings as SettingsIcon } from "lucide-react"
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
  // Se entra por Campanas, que es la primera pestana y lo que Marco quiere ver
  // al abrir Ads: si esta ganando o perdiendo dinero. Eventos es el detalle
  // tecnico y solo hace falta cuando algo falla (Marco, 2026-08-07).
  const [tab, setTab] = useState<AdsTab>("campanas")
  const active = TABS.find((t) => t.id === tab)!

  return (
    <>
      {/* PageContainer: márgenes y ancho máximo estándar del OS. Sin él la pantalla se
          pegaba a los bordes de la aplicación. El candado `npm run check:layout` impide
          que vuelva a pasar. */}
      {/* pb-24 extra: el botón flotante de "Registrar venta" tapaba la última fila.
          El hueco de la barra de abajo ya lo reserva PageContainer, asi que aqui
          no se repite (`pb-mobile-nav` ademas dejaba el monitor sin margen). */}
      <PageContainer className="[&>*:last-child]:mb-24">
        {/* Tira de pestanas a 44 puntos, deslizable y sangrada al borde para que
            se vea que hay mas de las que caben. */}
        <div className="-mx-4 flex snap-x items-center gap-1 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px flex h-11 shrink-0 snap-start items-center gap-2 border-b-2 px-3 text-[15px] font-medium whitespace-nowrap transition-colors md:h-9 md:text-sm",
                  isActive
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground md:hover:text-foreground"
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
