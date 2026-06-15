"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Layers, Tag as TagIcon, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShellHeader } from "@/features/shell/components/shell-header"

/**
 * Header del CRM con título "CRM" y 2 sub-pestañas.
 * Visible siempre que el path empiece con /crm.
 * Las pestañas comparten ancho fijo para evitar layout shift.
 */
export function CrmTabsHeader() {
  const pathname = usePathname()
  const inContactos = pathname.startsWith("/crm/contactos")
  // /crm/pipelines (gestion multi-pipeline) tiene prioridad sobre /crm/pipeline (kanban)
  const inPipelines = pathname.startsWith("/crm/pipelines")
  const inPipeline = pathname.startsWith("/crm/pipeline") && !inPipelines
  const inTags = pathname.startsWith("/crm/tags")

  return (
    <>
      <ShellHeader title="CRM" />
      <div className="shrink-0 border-b border-border bg-background">
        <div className="px-4 md:px-6 py-2 flex items-center gap-1 overflow-x-auto">
          <TabLink href="/crm/contactos" active={inContactos} icon={Users} label="Contactos" />
          <TabLink href="/crm/pipeline" active={inPipeline} icon={Layers} label="Pipeline" />
          <TabLink href="/crm/pipelines" active={inPipelines} icon={GitBranch} label="Pipelines" />
          <TabLink href="/crm/tags" active={inTags} icon={TagIcon} label="Tags" />
        </div>
      </div>
    </>
  )
}

function TabLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string
  active: boolean
  icon: typeof Users
  label: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-wider transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  )
}
