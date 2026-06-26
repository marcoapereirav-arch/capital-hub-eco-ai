"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { navSections } from "./nav-config"
import { canAccessRoute } from "@/lib/auth/role-access"
import { UserMenu } from "./user-menu"
import { ViewAsRoleDropdown } from "./view-as-role-dropdown"

function SidebarLogo() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarHeader
      className={`h-14 flex-row items-center py-0 border-b border-border ${
        isCollapsed ? "justify-center px-0" : "justify-start px-4"
      }`}
    >
      <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
        {isCollapsed ? (
          <span className="font-heading text-sm font-semibold text-foreground tracking-wide">
            CH
          </span>
        ) : (
          <span className="font-heading text-sm font-semibold tracking-[0.15em] uppercase text-foreground whitespace-nowrap">
            Capital Hub
          </span>
        )}
      </Link>
    </SidebarHeader>
  )
}

function GoToAppButton({ isCollapsed }: { isCollapsed: boolean }) {
  // Cuando colapsado: solo icono centrado (mismo patrón que los items del menú).
  // Cuando expandido: icono + label + flechita.
  if (isCollapsed) {
    return (
      <a
        href="https://app.capitalhubapp.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto my-1 flex items-center justify-center w-8 h-8 rounded-md border border-border/40 hover:bg-card transition-colors"
        title="Ir a la App"
      >
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </a>
    )
  }
  return (
    <a
      href="https://app.capitalhubapp.com"
      target="_blank"
      rel="noopener noreferrer"
      className="mx-2 mb-2 flex items-center justify-between gap-2 rounded-md border border-border/40 px-2.5 py-2 text-xs hover:bg-card transition-colors group"
      title="Abre la App en una pestaña nueva (misma sesion)"
    >
      <span className="flex items-center gap-2 min-w-0">
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
        <span className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground group-hover:text-foreground truncate">
          Ir a la App
        </span>
      </span>
      <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0">↗</span>
    </a>
  )
}

interface AppSidebarProps {
  userEmail: string
  userName: string | null
  /** Rol efectivo (puede ser el real o el impersonado por view_as). Filtra sidebar. */
  userRole: string | null
  /** Rol real del user (sin impersonación). Si es admin se muestra el dropdown View as Role. */
  realRole?: string | null
}

export function AppSidebar({ userEmail, userName, userRole, realRole }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = realRole === "super_admin" || realRole === "admin"
  const currentViewAs = realRole !== userRole && typeof userRole === "string" ? userRole : null

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarLogo />

      <SidebarContent className="pt-2">
        {navSections.map((section) => {
          // Filtrar items segun rol del user. Si la seccion queda vacia, no la renderizamos.
          const visibleItems = section.items.filter((item) => canAccessRoute(userRole, item.href))
          if (visibleItems.length === 0) return null
          return (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {section.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge>
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] px-1 py-0 border-muted-foreground/30 text-muted-foreground"
                        >
                          {item.badge}
                        </Badge>
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <AppSidebarFooterInner
          isAdmin={isAdmin}
          currentViewAs={currentViewAs}
          userEmail={userEmail}
          userName={userName}
          userRole={userRole}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

/**
 * Footer del sidebar — cuando el sidebar está colapsado oculta los textos
 * y muestra solo los iconos centrados (mismo patrón que los items del menú).
 * Sin esto los botones se cortaban porque el ancho colapsado es muy estrecho.
 */
function AppSidebarFooterInner({
  isAdmin,
  currentViewAs,
  userEmail,
  userName,
  userRole,
}: {
  isAdmin: boolean
  currentViewAs: string | null
  userEmail: string
  userName: string | null
  userRole: string | null
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <>
      {isAdmin && !isCollapsed && (
        <div className="mx-2 mb-1">
          <ViewAsRoleDropdown currentViewAs={currentViewAs} />
        </div>
      )}
      <GoToAppButton isCollapsed={isCollapsed} />
      <UserMenu email={userEmail} name={userName} role={userRole} />
    </>
  )
}
