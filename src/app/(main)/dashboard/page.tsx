import Link from 'next/link'
import { ShellHeader } from "@/features/shell/components/shell-header"
import { DateFilter } from "@/features/dashboard/components/date-filter"
import { KpiOverviewGrid } from "@/features/dashboard/components/kpi-overview"
import { FunnelCards } from "@/features/dashboard/components/funnel-cards"
import { PendingMetricsGrid } from "@/features/dashboard/components/pending-metrics"
import { Separator } from "@/components/ui/separator"
import { parseDateRangeFromParams } from "@/features/dashboard/services/date-ranges"
import { getDashboardData } from "@/features/dashboard/services/dashboard-service"

export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams: Promise<{
    range?: string
    start?: string
    end?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const range = parseDateRangeFromParams(params)
  const data = await getDashboardData(range)

  const lastSync = data.lastSyncAt
    ? new Date(data.lastSyncAt).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <>
      <ShellHeader title="Dashboard" />
      <div className="flex flex-col gap-6 p-6">
        {/* Top bar: filtro de fechas + last sync */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DateFilter
            currentPreset={range.preset}
            currentStart={range.start}
            currentEnd={range.end}
          />
          {lastSync && (
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
              Ultima sync: {lastSync}
            </span>
          )}
        </div>

        {/* Sin conexion */}
        {!data.hasConnection && (
          <div className="rounded-sm border border-dashed border-border bg-card p-6 text-sm">
            <p className="font-medium text-foreground">Sin metricas conectadas.</p>
            <p className="mt-1 text-muted-foreground">
              Conecta GHL en{' '}
              <Link href="/integrations" className="font-medium text-foreground underline underline-offset-4">
                Integraciones
              </Link>{' '}
              para empezar a ver datos reales aqui.
            </p>
          </div>
        )}

        {data.hasConnection && (
          <>
            {/* Panel General */}
            <section className="space-y-3">
              <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Panel General
              </h2>
              <KpiOverviewGrid kpis={data.kpis} />
            </section>

            <Separator />

            {/* Metricas avanzadas (CAC, LTV, MRR) */}
            <section className="space-y-3">
              <PendingMetricsGrid pending={data.pending} />
            </section>

            <Separator />

            {/* Panel por Funnel */}
            <section className="space-y-3">
              <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Por Funnel
              </h2>
              <FunnelCards funnels={data.funnels} />
            </section>
          </>
        )}
      </div>
    </>
  )
}
