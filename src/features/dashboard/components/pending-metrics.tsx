import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import type { PendingMetrics } from '../types/dashboard'

interface PendingMetricsProps {
  pending: PendingMetrics
}

export function PendingMetricsGrid({ pending }: PendingMetricsProps) {
  const cards = [
    { key: 'CAC', title: 'Coste de Adquisicion', data: pending.cac },
    { key: 'LTV', title: 'Lifetime Value', data: pending.ltv },
    { key: 'MRR', title: 'Ingreso Recurrente Mensual', data: pending.mrr },
  ]

  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        Metricas avanzadas (proximamente)
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.key} className="border-border border-dashed bg-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {c.key}
              </CardTitle>
              <Lock className="h-3 w-3 text-muted-foreground/50" />
            </CardHeader>
            <CardContent className="space-y-1">
              <span className="font-heading text-2xl font-semibold text-muted-foreground/60">
                {c.data.label}
              </span>
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide">
                {c.title}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground/40 pt-1">
                {c.data.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
