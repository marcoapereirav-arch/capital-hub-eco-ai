"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckSquare, FolderKanban, Network, LayoutGrid, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/overview", label: "Dashboard", icon: Gauge },
  { href: "/areas", label: "Áreas", icon: LayoutGrid },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/tasks", label: "Tareas", icon: CheckSquare },
  { href: "/board", label: "Board", icon: Network },
]

export default function OperacionesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full min-h-mobile-content flex-col md:min-h-0">
      <nav
        aria-label="Operaciones"
        className="flex shrink-0 items-center gap-1 border-b border-border bg-background px-2 py-1.5 md:px-4"
      >
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/")
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="relative flex-1 min-h-0">{children}</div>
    </div>
  )
}
