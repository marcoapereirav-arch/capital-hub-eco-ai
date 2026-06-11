"use client"

import { NotificationsBell } from "@/features/notifications/components/NotificationsPanel"

/**
 * TopBar global del OS. Persistente en TODAS las rutas internas.
 *
 * Vive una sola vez en `(main)/layout.tsx`, encima del shell de cada página.
 * Garantiza que la campana de notificaciones está SIEMPRE visible — como
 * en una app nativa. No depende de que cada página renderice su propio
 * ShellHeader.
 *
 * Posicionado `fixed top-0 right-0` con z-50 alto para flotar encima del
 * sidebar y de cualquier contenido. Solo ocupa la esquina superior derecha
 * (no toda la barra) para no entrar en conflicto con el SidebarTrigger
 * del header de sección.
 */
export function OsTopBar() {
  return (
    <div
      className="fixed top-2 right-2 z-50 flex items-center gap-1 rounded-full border border-border bg-background/95 backdrop-blur-md shadow-md pl-1 pr-1 py-0.5"
      data-os-top-bar
    >
      <NotificationsBell />
    </div>
  )
}
