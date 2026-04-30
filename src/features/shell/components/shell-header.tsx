"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

export function ShellHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground" />
      <h1 className="font-heading text-sm font-semibold tracking-wide uppercase text-foreground">
        {title}
      </h1>
    </header>
  )
}
