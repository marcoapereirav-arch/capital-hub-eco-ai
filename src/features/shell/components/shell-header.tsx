"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

/**
 * Header de sección (solo desktop). Lado izquierdo: trigger sidebar + título.
 *
 * NOTA: la campana de notificaciones NO vive aquí — vive en <OsTopBar>
 * global montado una sola vez en (main)/layout.tsx. Eso garantiza que el
 * bell está SIEMPRE visible, no importa qué página estés viendo o si esa
 * página usa este header o no.
 */
export function ShellHeader({ title }: { title: string }) {
  return (
    <header className="hidden h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:flex">
      <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground" />
      <h1 className="font-heading text-sm font-semibold tracking-wide uppercase text-foreground">
        {title}
      </h1>
    </header>
  )
}
