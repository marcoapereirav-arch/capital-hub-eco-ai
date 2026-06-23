"use client"

import { useState } from "react"
import { Activity, BarChart3, GitBranch, Settings as SettingsIcon, Users } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { cn } from "@/lib/utils"
import { AdsTrackerPanel } from "./ads-tracker-panel"
import { AdsConfigPanel } from "./ads-config-panel"
import { AdsInsights } from "./ads-insights"
import { AdsAffiliatesPanel } from "./ads-affiliates-panel"

type AdsTab = "tracker" | "dashboard" | "atribucion" | "afiliados" | "config"

const TABS: { id: AdsTab; label: string; icon: typeof Activity; description: string }[] = [
  {
    id: "tracker",
    label: "Tracker",
    icon: Activity,
    description: "Audit trail de los eventos CAPI enviados a Meta — debug + envío manual",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description: "Métricas live de Meta Ads (spend, ROAS, CTR, top creatives)",
  },
  {
    id: "atribucion",
    label: "Atribución",
    icon: GitBranch,
    description: "Funnel breakdown + cost per stage cruzando Meta + datos propios",
  },
  {
    id: "afiliados",
    label: "Afiliados",
    icon: Users,
    description: "Fuentes de tráfico (Paolo, JP…) con su link único y sus stats (leads, agendados, alumnos, revenue)",
  },
  {
    id: "config",
    label: "Configuración",
    icon: SettingsIcon,
    description: "Pixel ID, CAPI token, Ad Account, test event, eventos configurados",
  },
]

interface Props {
  pixelIdMasked: string | null
  capiTokenMasked: string | null
  adAccountId: string | null
  hasTestEventCode: boolean
}

export function AdsPage({ pixelIdMasked, capiTokenMasked, adAccountId, hasTestEventCode }: Props) {
  const [tab, setTab] = useState<AdsTab>("tracker")
  const active = TABS.find((t) => t.id === tab)!

  return (
    <>
      <ShellHeader title="Ads" />
      <div className="flex flex-col gap-5 p-4 pb-mobile-nav md:gap-6 md:p-6">
        {/* Tabs */}
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

        {/* Header */}
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">{active.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
        </div>

        {/* Contenido */}
        {tab === "tracker" && <AdsTrackerPanel />}
        {tab === "config" && (
          <AdsConfigPanel
            pixelIdMasked={pixelIdMasked}
            capiTokenMasked={capiTokenMasked}
            adAccountId={adAccountId}
            hasTestEventCode={hasTestEventCode}
          />
        )}
        {tab === "dashboard" && <AdsInsights />}
        {tab === "afiliados" && <AdsAffiliatesPanel />}
        {tab === "atribucion" && (
          <ComingSoon
            title="Atribución del funnel"
            desc="Próximamente: visitas → leads → trials → bumps → llamadas → WON Mes/Año, conversion % entre cada paso, cost per stage (CPL, CPA, CAC), atribución por creative al WON Año (970€)."
          />
        )}
      </div>
    </>
  )
}

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
      <p className="font-heading text-sm text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}
