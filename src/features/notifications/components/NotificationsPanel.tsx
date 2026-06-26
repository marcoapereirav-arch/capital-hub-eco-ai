"use client"

import { useEffect, useState } from "react"
import { Bell, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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

/**
 * Botón campana de notificaciones + drawer.
 *
 * El drawer se renderiza con <Sheet> (Radix Dialog) que SIEMPRE portalea a
 * `document.body`. Esto es deliberado y de raíz: el trigger vive dentro de la
 * píldora global <OsTopBar>, que usa `backdrop-blur`. Un ancestro con
 * backdrop-filter/transform crea un *containing block* para los hijos `fixed`,
 * así que un drawer `fixed inset-0` anidado quedaría atrapado dentro de esa
 * píldora diminuta (se "expandía toda jodida arriba a la derecha"). Al portalear
 * a body, el panel se ancla SIEMPRE al viewport, encaje perfecto, sin importar
 * dónde viva el botón. Bug recurrente cerrado definitivamente — 2026-06-26.
 */
export function NotificationsBell() {
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
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) load() // refresca al abrir
      }}
    >
      <SheetTrigger asChild>
        <button
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-mono font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 pr-12">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <SheetTitle className="text-sm font-semibold">Notificaciones</SheetTitle>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">
                {unreadCount} sin leer
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              Marcar leídas
            </button>
          )}
        </div>

        {/* Lista */}
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
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
                    "flex items-start gap-2.5 border-b border-border/40 px-4 py-3",
                    !n.read && "bg-card/30"
                  )}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{n.title}</div>
                    {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
                    <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" />}
                </div>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
