"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsBell } from "@/features/notifications/components/NotificationsPanel"

/**
 * Header superior visible en desktop.
 * - Lado izquierdo: trigger del sidebar + título de la sección actual.
 * - Lado derecho: campana de notificaciones (sustituye al botón flotante
 *   que antes chocaba con los botones "+ Nuevo" de las páginas).
 *
 * h-14 fijo. shrink-0 para que NUNCA se mueva al hacer scroll del contenido.
 */
export function ShellHeader({ title }: { title: string }) {
  return (
    <header className="hidden h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:flex">
      <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground" />
      <h1 className="font-heading text-sm font-semibold tracking-wide uppercase text-foreground">
        {title}
      </h1>
      <div className="flex-1" />
      <NotificationsBell />
    </header>
  )
}
