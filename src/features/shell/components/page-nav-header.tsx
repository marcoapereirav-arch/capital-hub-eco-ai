"use client"

import { ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type PageNavItem = {
  id: string
  label: string
  icon?: LucideIcon
  count?: number
}

export type PageNavGroup = {
  label?: string
  items: PageNavItem[]
}

interface PageNavHeaderProps {
  title: string
  groups: PageNavGroup[]
  activeId: string
  onSelect: (id: string) => void
  rightSlot?: React.ReactNode
}

export function PageNavHeader({
  title,
  groups,
  activeId,
  onSelect,
  rightSlot,
}: PageNavHeaderProps) {
  const activeItem = groups
    .flatMap((g) => g.items)
    .find((i) => i.id === activeId)

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground" />
      <h1 className="font-heading text-sm font-semibold tracking-wide uppercase text-foreground">
        {title}
      </h1>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "group flex items-center gap-1.5 rounded-sm px-2 py-1 text-sm",
            "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "data-[state=open]:bg-secondary data-[state=open]:text-foreground"
          )}
        >
          <span className="text-muted-foreground/40">/</span>
          <span className="truncate max-w-[260px]">
            {activeItem?.label ?? "Seleccionar"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-72 max-h-[70vh] overflow-y-auto"
        >
          {groups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <DropdownMenuSeparator />}
              {group.label && (
                <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {group.label}
                </DropdownMenuLabel>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.id === activeId
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={() => onSelect(item.id)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      isActive && "bg-secondary text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                    <span className="flex-1 truncate">{item.label}</span>
                    {typeof item.count === "number" && item.count > 0 && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {item.count}
                      </span>
                    )}
                  </DropdownMenuItem>
                )
              })}
              {group.items.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground/60">
                  Sin elementos
                </div>
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
    </header>
  )
}
