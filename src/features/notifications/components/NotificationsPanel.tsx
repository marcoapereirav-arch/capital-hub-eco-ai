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
import { ListaPaginada } from "@/components/ui/lista-paginada"
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
// positivo (lead, venta, agenda), rojo solo para alertas/negativo. Antes los
// verdes y los rojos iban escritos a mano; ahora los pone el tema.
const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  lead: { icon: Target, color: "text-primary" },
  lead_cualificado: { icon: Target, color: "text-primary" },
  recurring_optin_webinar: { icon: Repeat2, color: "text-primary" },
  recurring_optin_test_personalidad: { icon: Repeat2, color: "text-primary" },
  venta: { icon: BadgeEuro, color: "text-primary" },
  agenda: { icon: CalendarCheck, color: "text-primary" },
  calendly_created: { icon: CalendarCheck, color: "text-primary" },
  calendly_canceled: { icon: CalendarX, color: "text-destructive" },
  calendly_no_show: { icon: UserX, color: "text-destructive" },
  manual_stage_change: { icon: ArrowRightLeft, color: "text-muted-foreground" },
  gcal_disconnected: { icon: AlertTriangle, color: "text-destructive" },
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
 * Botón campana de notificaciones + panel.
 *
 * El panel se renderiza con <Sheet> (Radix Dialog) que SIEMPRE portalea a
 * `document.body`. Esto es deliberado y de raíz: el trigger vive dentro de la
 * <TopBar>/<MobileHeader>, que usan `backdrop-blur`. Un ancestro con
 * backdrop-filter/transform crea un *containing block* para los hijos `fixed`,
 * así que un panel `fixed inset-0` anidado quedaría atrapado dentro de ese
 * contenedor (se "expandía toda jodida arriba a la derecha"). Al portalear a
 * body, el panel se ancla SIEMPRE al viewport, encaje perfecto, sin importar
 * dónde viva el botón. Bug recurrente cerrado definitivamente — 2026-06-26.
 *
 * En TELEFONO es hoja inferior y en escritorio cajón por la derecha, y el lado
 * NO se decide con JavaScript: `side="bottom"` fijo mas clases md:.
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
          className="relative inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-muted md:size-8 md:hover:bg-card md:hover:text-foreground"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-sm font-bold tabular-nums text-background md:-top-0.5 md:-right-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      {/* Los `!` son obligatorios: sheet.tsx coloca la hoja inferior con
          `data-[side=bottom]:...`, que compila a `.clase[data-side=bottom]` y
          le gana en especificidad a cualquier clase suelta o `md:`. Sin ellos
          la campana salia por la IZQUIERDA en monitor, con el borde en el lado
          equivocado.

          `overflow-hidden!` apaga el `data-[side=bottom]:overflow-y-auto` de la
          base por el mismo motivo. Sin el habia DOS sitios desplazandose a la
          vez (la hoja entera y el listado de dentro) peleandose por el dedo, y
          ademas el boton de cerrar, que va `absolute` dentro de la hoja, se iba
          hacia arriba al desplazar y dejaba la ventana sin salida a la vista.
          Ahora se desplaza UNA sola cosa: el listado. */}
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] w-full gap-0 overflow-hidden! rounded-t-xl p-0 pb-safe md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-full md:max-w-md md:rounded-t-none md:border-l"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />

        {/* Header. Va shrink-0 y el que se desplaza es SOLO el listado de abajo:
            si el desplazamiento lo hace la hoja entera, con muchos avisos el
            titulo y "Marcar leidas" se van hacia arriba y hay que subir del todo
            para volver a alcanzarlos.

            El `pr-12` reserva el hueco de la salida: el boton de cerrar de
            <Sheet>, arriba a la derecha, que mide 44 puntos en telefono
            (`icon-sm` = `size-11 md:size-7`). Tocar el fondo tambien cierra. */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border p-4 pr-12">
          <div className="flex min-w-0 items-center gap-2">
            <Bell className="size-4 shrink-0 text-muted-foreground" />
            <SheetTitle className="text-base font-semibold">Notificaciones</SheetTitle>
            {unreadCount > 0 && (
              <span className="shrink-0 text-sm tabular-nums text-destructive">
                {unreadCount} sin leer
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex h-11 shrink-0 items-center rounded-lg px-2 text-sm text-muted-foreground active:bg-muted md:h-8"
            >
              Marcar leídas
            </button>
          )}
        </div>

        {/* Lista */}
        {items.length === 0 ? (
          <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <BellOff className="size-6 text-muted-foreground" />
            <h3 className="text-[17px] font-semibold text-foreground">Sin notificaciones</h3>
            <p className="max-w-[38ch] text-[15px] text-muted-foreground">
              Aquí aparecen los avisos de leads, agendas y ventas en cuanto ocurren.
            </p>
          </div>
        ) : (
          /* NINGUNA lista se pinta entera: maximo 20 por pagina, y el limite lo
             pone <ListaPaginada>, no esta pantalla. Antes se pintaban de golpe
             los 50 avisos que devuelve el API. La clave de filtros es el estado
             de la hoja: al volver a abrir la campana se empieza por la pagina 1,
             que es donde estan los avisos nuevos. */
          <ListaPaginada
            items={items}
            claveDeFiltros={String(open)}
            className="min-h-0 flex-1"
            nombreSingular="aviso"
            nombrePlural="avisos"
          >
            {(pagina) =>
              pagina.map((n) => {
                const meta = TYPE_ICONS[n.type] ?? TYPE_ICONS.default
                const Icon = meta.icon
                const hasUrl = typeof n.data?.url === "string"
                return (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={cn(
                      "flex w-full min-h-14 items-start gap-2.5 border-b border-border px-4 py-3 text-left transition-colors",
                      hasUrl ? "cursor-pointer active:bg-muted" : "cursor-default",
                      !n.read && "bg-muted/40"
                    )}
                  >
                    <Icon className={cn("mt-0.5 size-4 shrink-0", meta.color)} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] text-foreground">{n.title}</div>
                      {n.body && (
                        <div className="mt-0.5 text-sm text-muted-foreground">{n.body}</div>
                      )}
                      <div className="mt-1 text-sm tabular-nums text-muted-foreground">
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.read && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-destructive" />
                    )}
                  </button>
                )
              })
            }
          </ListaPaginada>
        )}
      </SheetContent>
    </Sheet>
  )
}
