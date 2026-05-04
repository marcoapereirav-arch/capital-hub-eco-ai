import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { ManychatSubscriber } from '../types'

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

function initials(s: ManychatSubscriber): string {
  const name = s.name ?? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() ?? s.ig_username ?? '?'
  const parts = name.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function SubscribersList({ subscribers }: { subscribers: ManychatSubscriber[] }) {
  if (subscribers.length === 0) {
    return (
      <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay suscriptores aún. Cuando ManyChat envíe eventos al webhook, aparecerán aquí.
      </div>
    )
  }

  return (
    <div className="border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left">
            <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Suscriptor
            </th>
            <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              IG
            </th>
            <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Tags
            </th>
            <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Estado
            </th>
            <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Última interacción
            </th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map(s => (
            <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    {s.profile_pic && <AvatarImage src={s.profile_pic} alt={s.name ?? ''} />}
                    <AvatarFallback className="font-mono text-[10px]">{initials(s)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-foreground">
                      {s.name ?? s.ig_username ?? s.id}
                    </span>
                    {s.last_input_text && (
                      <span className="line-clamp-1 max-w-xs text-xs text-muted-foreground">
                        {s.last_input_text}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {s.ig_username ? `@${s.ig_username}` : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(s.tags ?? []).slice(0, 4).map(t => (
                    <Badge key={t} variant="secondary" className="font-mono text-[10px]">
                      {t}
                    </Badge>
                  ))}
                  {(s.tags ?? []).length > 4 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{(s.tags ?? []).length - 4}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={s.status === 'active' ? 'default' : 'secondary'}
                  className="font-mono text-[10px]"
                >
                  {s.status ?? '—'}
                </Badge>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {formatDate(s.last_interaction_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
