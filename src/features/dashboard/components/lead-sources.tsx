import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LeadSource } from "../types/metrics"

export function LeadSources({ sources }: { sources: LeadSource[] }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Fuentes de Leads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((source) => (
            <div key={source.source} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{source.source}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {source.count}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {source.percentage}%
                  </span>
                </div>
              </div>
              {/* Barra de progreso monocromatica */}
              <div className="h-1 w-full rounded-full bg-secondary">
                <div
                  className="h-1 rounded-full bg-foreground/70 transition-all"
                  style={{ width: `${source.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
