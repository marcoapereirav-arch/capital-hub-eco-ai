import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KpiOverview } from '../types/dashboard'

function formatEUR(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

interface KpiOverviewProps {
  kpis: KpiOverview
}

export function KpiOverviewGrid({ kpis }: KpiOverviewProps) {
  const cards = [
    { title: 'Clientes Totales', value: formatNumber(kpis.clientsTotal), source: 'WON' },
    { title: 'Revenue Total', value: formatEUR(kpis.revenueTotal), source: 'Facturado' },
    { title: 'Leads Totales', value: formatNumber(kpis.leadsTotal), source: 'GHL' },
    { title: 'Nuevos Leads', value: formatNumber(kpis.newLeadsInPeriod), source: 'En el periodo' },
    { title: 'Ticket Promedio', value: formatEUR(kpis.avgTicket), source: 'Revenue / Clientes' },
    { title: 'Pipeline Abierto', value: formatEUR(kpis.pipelineValue), source: 'En curso' },
    { title: 'Tasa Conversion', value: formatPercent(kpis.conversionRate), source: 'Won / Cerradas' },
    { title: 'Pipelines Activos', value: formatNumber(kpis.pipelinesCount), source: 'Funnels GHL' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title} className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {c.title}
            </CardTitle>
            <span className="font-mono text-[9px] text-muted-foreground/60">{c.source}</span>
          </CardHeader>
          <CardContent>
            <span className="font-heading text-2xl font-semibold text-foreground">
              {c.value}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
