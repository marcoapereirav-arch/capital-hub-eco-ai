import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PlatformStat } from "../types/metrics"

export function PlatformTable({ stats }: { stats: PlatformStat[] }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Plataformas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div
              key={stat.platform}
              className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {stat.platform}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {stat.followers} seguidores
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-mono text-xs text-muted-foreground">
                    {stat.posts} posts
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] border-border text-foreground"
                >
                  {stat.engagement}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
