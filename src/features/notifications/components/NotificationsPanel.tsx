"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  BellOff,
  AlertTriangle,
  Info,
  Target,
  CalendarCheck,
  CalendarX,
  UserX,
  BadgeEuro,
  ArrowRightLeft,
  Repeat2,
} from "lucide-react"
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

// Iconos por tipo de evento. Brandkit: monocromo + verde de marca para lo
// positivo (lead, venta, agenda), rojo solo para alertas/negativo.
const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  lead: { icon: Target, color: "text-green-400" },
  recurring_optin_webinar: { icon: Repeat2, color: "text-green-400" },
  recurring_optin_test_personalidad: { icon: Repeat2, color: "text-green-400" },
  venta: { icon: BadgeEuro, color: "text-green-400" },
  agenda: { icon: CalendarCheck, color: "text-green-400" },
  calendly_created: { icon: CalendarCheck, color: "text-green-400" },
  calendly_canceled: { icon: CalendarX, color: "text-red-400" },
  calendly_no_show: { icon: UserX, color: "text-red-400" },
  manual_stage_change: { icon: ArrowRightLeft, color: "text-muted-foreground" },
  gcal_disconnected: { icon: AlertTriangle, color: "text-red-400" },
  default: { icon: Info, color: "text-muted-foreground" },
}

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 1) return "ahora mismo"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

/**
 * Botón campana de notificaciones + drawer.
 *
 * El drawer se renderiza con <Sheet> (Radix Dialog) que SIEMPRE portalea a
 * `document.body`. Esto es deliberado y de raíz: el trigger vive dentro de la
 * <TopBar>/<MobileHeader>, que usan `backdrop-blur`. Un ancestro con
 * backdrop-filter/transform crea un *containing block* para los hijos `fixed`,
 * así que un drawer `fixed inset-0` anidado quedaría atrapado dentro de ese
 * contenedor (se "expandía toda jodida arriba a la derecha"). Al portalear a
 * body, el panel se ancla SIEMPRE al viewport, encaje perfecto, sin importar
 * dónde viva el botón. Bug recurrente cerrado definitivamente — 2026-06-26.
 */
export function NotificationsBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    load()
    const t = setInterval(load, 30_000) // REGLA #6: el OS en live, poll 15-30s
    const onVisible = () => {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener("visibilitychange", onVisible)
    }
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
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    await fetch("/api/admin/notifications", { method: "PATCH" }).catch(() => null)
    load()
  }

  /** Click en una notificación: la marca leída y navega a su destino (si tiene). */
  function openNotification(n: Notification) {
    if (!n.read) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
      setUnreadCount((c) => Math.max(0, c - 1))
      fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => null)
    }
    const url = typeof n.data?.url === "string" ? n.data.url : null
    if (url) {
      setOpen(false)
      router.push(url)
    }
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
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <BellOff className="h-6 w-6 opacity-40" />
            <span className="text-sm">Sin notificaciones</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {items.map((n) => {
              const meta = TYPE_ICONS[n.type] ?? TYPE_ICONS.default
              const Icon = meta.icon
              const hasUrl = typeof n.data?.url === "string"
              return (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={cn(
                    "flex w-full items-start gap-2.5 border-b border-border px-4 py-3 text-left transition-colors",
                    hasUrl ? "cursor-pointer hover:bg-card/60" : "cursor-default",
                    !n.read && "bg-card/30"
                  )}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{n.title}</div>
                    {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
                    <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" />}
                </button>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
