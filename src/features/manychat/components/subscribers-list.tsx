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
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
        <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay suscriptores</h3>
        <p className="max-w-[42ch] text-[15px] text-muted-foreground">
          No hay suscriptores aún. Cuando ManyChat envíe eventos al webhook, aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* TELEFONO: una ficha por suscriptor. Cinco columnas no caben en 375
          puntos, y encogerlas deja Tags y Estado fuera de la pantalla. */}
      <ul className="divide-y divide-border rounded-lg border border-border md:hidden">
        {subscribers.map(s => (
          <li key={s.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                {s.profile_pic && <AvatarImage src={s.profile_pic} alt={s.name ?? ''} />}
                <AvatarFallback className="text-sm">{initials(s)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium text-foreground">
                  {s.name ?? s.ig_username ?? s.id}
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  {s.ig_username ? `@${s.ig_username}` : '—'} · {formatDate(s.last_interaction_at)}
                </div>
              </div>
              <Badge
                variant={s.status === 'active' ? 'default' : 'secondary'}
                className="h-auto shrink-0 py-0.5 text-sm"
              >
                {s.status ?? '—'}
              </Badge>
            </div>
            {s.last_input_text && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{s.last_input_text}</p>
            )}
            {(s.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(s.tags ?? []).slice(0, 4).map(t => (
                  <Badge key={t} variant="secondary" className="h-auto py-0.5 text-sm">
                    {t}
                  </Badge>
                ))}
                {(s.tags ?? []).length > 4 && (
                  <span className="text-sm tabular-nums text-muted-foreground">
                    +{(s.tags ?? []).length - 4}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* MONITOR: la tabla de columnas de siempre */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                Suscriptor
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                IG
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                Tags
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                Última interacción
              </th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(s => (
              <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {s.profile_pic && <AvatarImage src={s.profile_pic} alt={s.name ?? ''} />}
                      <AvatarFallback className="text-sm">{initials(s)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-foreground">
                        {s.name ?? s.ig_username ?? s.id}
                      </span>
                      {s.last_input_text && (
                        <span className="line-clamp-1 max-w-xs text-sm text-muted-foreground">
                          {s.last_input_text}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {s.ig_username ? `@${s.ig_username}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(s.tags ?? []).slice(0, 4).map(t => (
                      <Badge key={t} variant="secondary" className="h-auto py-0.5 text-sm">
                        {t}
                      </Badge>
                    ))}
                    {(s.tags ?? []).length > 4 && (
                      <span className="text-sm tabular-nums text-muted-foreground">
                        +{(s.tags ?? []).length - 4}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={s.status === 'active' ? 'default' : 'secondary'}
                    className="h-auto py-0.5 text-sm"
                  >
                    {s.status ?? '—'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                  {formatDate(s.last_interaction_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
