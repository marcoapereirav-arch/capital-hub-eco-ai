"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { Separator } from "@/components/ui/separator"
import { navSections } from "./nav-config"
import { UserMenu } from "./user-menu"

function SidebarLogo() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarHeader className="p-4">
      <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
        {isCollapsed ? (
          <span className="font-heading text-base font-semibold text-foreground">
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

interface AppSidebarProps {
  userEmail: string
  userName: string | null
  userRole: string | null
}

export function AppSidebar({ userEmail, userName, userRole }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarLogo />

      <Separator className="mx-4 w-auto" />

      <SidebarContent className="pt-2">
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {section.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
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
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserMenu email={userEmail} name={userName} role={userRole} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
