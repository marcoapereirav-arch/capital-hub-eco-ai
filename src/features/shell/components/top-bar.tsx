"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsBell } from "@/features/notifications/components/NotificationsPanel"
import { deriveSectionTitle } from "./nav-config"

/**
 * Barra superior ÚNICA del OS (desktop). Vive una sola vez en (main)/layout.tsx,
 * encima del contenido de cada página. Garantiza un chrome superior COHERENTE en
 * TODAS las secciones:
 *   - altura fija h-14 + border-b → su línea inferior se alinea exactamente con la
 *     línea del header del sidebar (también h-14 border-b) y queda por encima de
 *     cualquier sub-nav (operaciones/CRM), que vive debajo.
 *   - izquierda: trigger del sidebar + título de la sección (derivado de la ruta).
 *   - derecha: campana de notificaciones, anclada a la línea (ya no es una píldora
 *     flotante descoordinada arriba a la derecha).
 *
 * Sustituye al antiguo <OsTopBar> flotante y a la cabecera por página, ya retirada.
 */
export function TopBar() {
  const pathname = usePathname()
  const title = deriveSectionTitle(pathname)

  return (
    <header className="hidden h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 md:flex">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground" />
        <h1 className="truncate font-heading text-base font-extrabold text-foreground">
          {title}
        </h1>
      </div>
      <NotificationsBell />
    </header>
  )
}
