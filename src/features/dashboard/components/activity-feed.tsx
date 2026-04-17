import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type ActivityItem = {
  action: string
  detail: string
  time: string
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px] px-6 pb-4">
          <div className="space-y-0">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-border/30 py-3 last:border-0"
              >
                {/* Dot indicator */}
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm text-foreground">{item.action}</span>
                  <span className="text-xs text-muted-foreground">{item.detail}</span>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
