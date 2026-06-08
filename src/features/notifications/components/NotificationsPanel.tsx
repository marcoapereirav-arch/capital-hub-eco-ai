"use client"

import { useEffect, useState } from "react"
import { Bell, X, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  gcal_disconnected: { icon: AlertTriangle, color: "text-red-400" },
  default: { icon: Info, color: "text-blue-400" },
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000) // poll cada minuto
    return () => clearInterval(t)
  }, [])

  async function load() {
    try {
      const data = await fetch("/api/admin/notifications").then((r) => r.json())
      setItems(data.notifications ?? [])
      setUnreadCount((data.notifications ?? []).filter((n: Notification) => !n.read).length)
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    await fetch("/api/admin/notifications", { method: "PATCH" })
    load()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-30 inline-flex items-center justify-center h-9 w-9 rounded-full border border-border/40 bg-background hover:bg-card transition-colors"
        title="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setOpen(false)}>
          <div className="flex-1" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background border-l border-border h-full flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Notificaciones</h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">
                    {unreadCount} sin leer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    Marcar leídas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Sin notificaciones
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {items.map((n) => {
                  const meta = TYPE_ICONS[n.type] ?? TYPE_ICONS.default
                  const Icon = meta.icon
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-border/40 flex items-start gap-2.5",
                        !n.read && "bg-card/30"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", meta.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{n.title}</div>
                        {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                        <div className="text-[10px] font-mono text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-red-400 shrink-0 mt-1" />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
