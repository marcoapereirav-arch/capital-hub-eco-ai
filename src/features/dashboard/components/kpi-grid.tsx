import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import type { MetricCard, MetricTrend } from "../types/metrics"

function TrendIcon({ trend }: { trend: MetricTrend }) {
  if (trend === "up") return <ArrowUpRight className="h-3 w-3" />
  if (trend === "down") return <ArrowDownRight className="h-3 w-3" />
  return <Minus className="h-3 w-3" />
}

function trendColor(trend: MetricTrend, change: string): string {
  if (trend === "neutral") return "text-muted-foreground"
  // Para metricas como churn, "down" es bueno
  if (change.startsWith("-") && trend === "up") return "text-foreground"
  if (trend === "up") return "text-foreground"
  return "text-muted-foreground"
}

export function KpiGrid({ cards }: { cards: MetricCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.id} className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.title}
            </CardTitle>
            <span className="font-mono text-[9px] text-muted-foreground/60">
              {card.source}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-semibold text-foreground">
                {card.value}
              </span>
              <span className={`flex items-center gap-0.5 font-mono text-xs ${trendColor(card.trend, card.change)}`}>
                <TrendIcon trend={card.trend} />
                {card.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
