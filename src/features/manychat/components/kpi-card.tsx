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
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-1 pb-2">
        <CardTitle className="min-w-0 flex-1 truncate text-sm font-semibold text-muted-foreground">
          {title}
        </CardTitle>
        {source && (
          <span className="shrink-0 text-sm text-muted-foreground">{source}</span>
        )}
      </CardHeader>
      <CardContent>
        {/* tabular-nums alinea las cifras sin recurrir a la fuente de maquina de
            escribir, que ya no forma parte de la marca. */}
        <div className="font-heading text-2xl font-semibold tabular-nums text-foreground">
          {typeof value === 'number' ? new Intl.NumberFormat('es-ES').format(value) : value}
        </div>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
