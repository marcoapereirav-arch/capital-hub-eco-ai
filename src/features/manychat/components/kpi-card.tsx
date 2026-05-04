import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface KpiCardProps {
  title: string
  value: string | number
  hint?: string
  source?: string
}

export function KpiCard({ title, value, hint, source }: KpiCardProps) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        {source && (
          <span className="font-mono text-[9px] text-muted-foreground/60">{source}</span>
        )}
      </CardHeader>
      <CardContent>
        <div className="font-heading text-2xl font-semibold text-foreground">
          {typeof value === 'number' ? new Intl.NumberFormat('es-ES').format(value) : value}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
