import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KpiCard } from './kpi-card'
import type { ManychatOverview, ManychatEvent } from '../types'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  const days = Math.floor(h / 24)
  return `hace ${days}d`
}

function eventLabel(eventType: string): string {
  const map: Record<string, string> = {
    subscriber_added: 'Nuevo suscriptor',
    tag_added: 'Tag asignado',
    tag_removed: 'Tag removido',
    flow_triggered: 'Flow disparado',
    message_received: 'DM recibido',
    message_sent: 'DM enviado',
    field_updated: 'Custom field actualizado',
  }
  return map[eventType] ?? eventType
}

export function ManychatOverviewView({ overview }: { overview: ManychatOverview }) {
  // Solo tarjetas SIN fecha (totales). Las métricas por período viven en
  // <ManychatPeriodKpis/> con el filtro global. Tags/CustomFields → pestaña Tags.
  const cards = [
    { title: 'Suscriptores Totales', value: overview.totalSubscribers, source: 'manychat' },
    { title: 'Activos', value: overview.activeStatus, source: 'manychat' },
  ]

  const maxTagCount = Math.max(1, ...overview.topTags.map(t => t.count))

  return (
    <div className="flex flex-col gap-6">
      {overview.syncError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Último sync con error: {overview.syncError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {cards.map(c => (
          <KpiCard key={c.title} title={c.title} value={c.value} source={c.source} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
              Top Tags
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tags con más suscriptores asignados.
            </p>
          </CardHeader>
          <CardContent>
            {overview.topTags.length === 0 ? (
              <EmptyHint
                title="Todavía no hay tags"
                message="Aún no hay tags con suscriptores. Webhook arrancará a poblarlos."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {overview.topTags.map(t => (
                  <li key={t.name} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 truncate text-foreground md:w-32">
                      {t.name}
                    </span>
                    <div className="flex h-1.5 min-w-0 flex-1 items-center rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(t.count / maxTagCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                      {t.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
              Eventos Recientes
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Últimos 20 eventos recibidos vía webhook.
            </p>
          </CardHeader>
          <CardContent>
            {overview.recentEvents.length === 0 ? (
              <EmptyHint
                title="Sin eventos todavía"
                message="Configura External Request en ManyChat para empezar a recibir."
              />
            ) : (
              <ul className="flex flex-col">
                {overview.recentEvents.map((e: ManychatEvent) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-b-0"
                  >
                    <span className="min-w-0 truncate text-[15px] text-foreground">{eventLabel(e.event_type)}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {formatDate(e.received_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground md:gap-3">
        <span>Último sync: {formatDate(overview.lastSync)}</span>
        <span>•</span>
        <Badge variant="secondary" className="h-auto py-0.5 text-sm">
          IG: {overview.igChannelActive ? 'Conectado' : 'Inactivo'}
        </Badge>
      </div>
    </div>
  )
}

function EmptyHint({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
      <p className="max-w-[38ch] text-[15px] text-muted-foreground">{message}</p>
    </div>
  )
}
