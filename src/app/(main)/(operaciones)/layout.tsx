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
        className="shrink-0 border-b border-border bg-background px-safe"
      >
        {/* Las cinco pestanas suman mas de 375 puntos, asi que en telefono la tira
            se desliza DENTRO de su propia caja. Es el unico deslizamiento lateral
            permitido y nunca arrastra la pagina entera. */}
        <div className="flex snap-x gap-1 overflow-x-auto px-2 py-1.5 md:overflow-visible md:px-4">
          {TABS.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + "/")
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 text-[15px] font-medium whitespace-nowrap transition-colors md:h-9 md:text-sm",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground active:bg-secondary/60 md:hover:bg-secondary/60 md:hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="relative flex-1 min-h-0">{children}</div>
    </div>
  )
}
