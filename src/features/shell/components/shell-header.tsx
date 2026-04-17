"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function ShellHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="font-heading text-sm font-semibold tracking-wide uppercase text-foreground">
        {title}
      </h1>
    </header>
  )
}
