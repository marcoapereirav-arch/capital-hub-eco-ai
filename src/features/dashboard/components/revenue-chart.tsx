"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RevenuePoint } from "../types/metrics"

function getMaxValue(data: RevenuePoint[]): number {
  return Math.max(...data.map((d) => Math.max(d.revenue, d.adSpend)))
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const max = getMaxValue(data)

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Revenue vs Ad Spend
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-foreground" />
              <span className="text-[10px] text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Ad Spend</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 h-48">
          {data.map((point) => (
            <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end gap-1 h-40">
                {/* Revenue bar */}
                <div
                  className="flex-1 bg-foreground/90 rounded-t-sm transition-all"
                  style={{ height: `${(point.revenue / max) * 100}%` }}
                />
                {/* Ad Spend bar */}
                <div
                  className="flex-1 bg-muted-foreground/40 rounded-t-sm transition-all"
                  style={{ height: `${(point.adSpend / max) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {point.month}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
