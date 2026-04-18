'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FunnelMetrics } from '../types/dashboard'

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

interface FunnelCardsProps {
  funnels: FunnelMetrics[]
}

export function FunnelCards({ funnels }: FunnelCardsProps) {
  if (funnels.length === 0) {
    return (
      <Card className="border-border border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No hay funnels (pipelines) sincronizados todavia.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Ejecuta una sincronizacion desde Integraciones para traer los pipelines de GHL.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {funnels.map((f) => (
        <FunnelCard key={f.pipelineId} funnel={f} />
      ))}
    </div>
  )
}

function FunnelCard({ funnel }: { funnel: FunnelMetrics }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="border-border">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              {funnel.name}
            </CardTitle>
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
              {funnel.pipelineId.slice(0, 12)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[9px] border-border text-muted-foreground">
              {formatPercent(funnel.revenueShare)} del total
            </Badge>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FunnelStat label="Clientes" value={formatNumber(funnel.clientsWon)} />
            <FunnelStat label="Revenue" value={formatEUR(funnel.revenueWon)} />
            <FunnelStat label="Pipeline abierto" value={formatEUR(funnel.pipelineValue)} />
            <FunnelStat label="Ticket promedio" value={formatEUR(funnel.avgTicket)} />
          </div>
        </CardContent>
      </button>

      {expanded && (
        <>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FunnelStat label="Opps abiertas" value={formatNumber(funnel.openOppsCount)} />
              <FunnelStat label="Tasa conversion" value={formatPercent(funnel.conversionRate)} />
            </div>

            {funnel.stages.length > 0 && (
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Etapas del pipeline
                </p>
                <div className="flex gap-2 overflow-x-auto">
                  {funnel.stages.map((s) => (
                    <StageColumn key={s.id} name={s.name} count={s.count} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  )
}

function FunnelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-heading text-base font-semibold text-foreground">
        {value}
      </span>
    </div>
  )
}

function StageColumn({ name, count }: { name: string; count: number }) {
  return (
    <div
      className={cn(
        'flex min-w-[120px] flex-col gap-1 rounded-sm border border-border bg-secondary/30 p-3'
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground truncate">
        {name}
      </span>
      <span className="font-heading text-lg font-semibold text-foreground">
        {count}
      </span>
    </div>
  )
}
