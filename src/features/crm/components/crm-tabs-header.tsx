"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Layers, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Las 3 sub-pestanas del CRM. El titulo "CRM" ya lo pinta la barra superior global
 * (<TopBar>), asi que aqui NO se repite: ver `docs/sops/producto/47`.
 *
 * Diseno: brandkit oficial. La pestana activa lleva la superficie verde (#101710 sobre
 * borde #24462F), que es el unico acento de la marca. Antes iba en blanco solido con
 * mono en mayusculas espaciadas, que es el diseno antiguo.
 */
export function CrmTabsHeader() {
  const pathname = usePathname()

  return (
    <div className="shrink-0 border-b border-[rgba(245,246,247,0.1)] bg-[#0F0F12]">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:px-6">
        <TabLink
          href="/crm/contactos"
          active={pathname.startsWith("/crm/contactos")}
          icon={Users}
          label="Contactos"
        />
        <TabLink
          href="/crm/pipeline"
          active={pathname.startsWith("/crm/pipeline")}
          icon={Layers}
          label="Pipeline"
        />
        <TabLink
          href="/crm/tags"
          active={pathname.startsWith("/crm/tags")}
          icon={TagIcon}
          label="Etiquetas"
        />
      </div>
    </div>
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-[4px] px-3.5 text-[14px] font-semibold",
        "min-h-[44px] transition-colors md:min-h-[38px]",
        active
          ? "border border-[#24462F] bg-[#101710] text-[#4ADE80]"
          : "border border-transparent text-[#A6AAB2] hover:bg-[#16161B] hover:text-[#F5F6F7]"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
