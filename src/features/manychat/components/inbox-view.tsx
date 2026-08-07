import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { InboxMessage } from '../types'

function formatDate(iso: string): string {
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

function initials(name: string | null, ig: string | null): string {
  const base = name ?? ig ?? '?'
  const parts = base.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function InboxView({ messages }: { messages: InboxMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
        <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay mensajes</h3>
        <p className="max-w-[42ch] text-[15px] text-muted-foreground">
          No hay mensajes recibidos todavía. Configura el webhook en ManyChat para que los DMs lleguen aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <ul className="divide-y divide-border">
        {messages.map((m, idx) => (
          <li
            key={`${m.subscriberId ?? 'anon'}-${idx}`}
            className="flex items-start gap-3 px-4 py-3 md:items-center md:gap-4 md:hover:bg-muted/20"
          >
            <Avatar className="h-9 w-9 shrink-0">
              {m.profilePic && <AvatarImage src={m.profilePic} alt={m.subscriberName ?? ''} />}
              <AvatarFallback className="text-sm">
                {initials(m.subscriberName, m.igUsername)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              {/* La fila se parte en el telefono en vez de empujar la fecha fuera */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="min-w-0 truncate text-[15px] font-medium text-foreground">
                  {m.subscriberName ?? m.igUsername ?? m.subscriberId ?? 'Anónimo'}
                </span>
                {m.igUsername && (
                  <span className="text-sm text-muted-foreground">
                    @{m.igUsername}
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground md:line-clamp-1">
                {m.text ?? 'Sin texto'}
              </p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {formatDate(m.receivedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
