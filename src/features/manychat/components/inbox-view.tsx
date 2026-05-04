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
      <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay mensajes recibidos todavía. Configura el webhook en ManyChat para que los DMs lleguen aquí.
      </div>
    )
  }

  return (
    <div className="border border-border">
      <ul className="divide-y divide-border">
        {messages.map((m, idx) => (
          <li
            key={`${m.subscriberId ?? 'anon'}-${idx}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20"
          >
            <Avatar className="h-9 w-9">
              {m.profilePic && <AvatarImage src={m.profilePic} alt={m.subscriberName ?? ''} />}
              <AvatarFallback className="font-mono text-[10px]">
                {initials(m.subscriberName, m.igUsername)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {m.subscriberName ?? m.igUsername ?? m.subscriberId ?? 'Anónimo'}
                </span>
                {m.igUsername && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    @{m.igUsername}
                  </span>
                )}
              </div>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {m.text ?? 'Sin texto'}
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatDate(m.receivedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
