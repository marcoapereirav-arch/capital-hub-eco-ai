"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationsBell } from "@/features/notifications/components/NotificationsPanel"
import { navAll } from "./nav-config"

interface MobileHeaderProps {
  userEmail: string
  userName: string | null
}

function deriveDisplayName(name: string | null, email: string): string {
  if (name && name.trim().length > 0) return name
  return email.split("@")[0] ?? "Usuario"
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function deriveTitle(pathname: string): string {
  const match = navAll.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )
  return match?.title ?? "Capital Hub"
}

export function MobileHeader({ userEmail, userName }: MobileHeaderProps) {
  const pathname = usePathname()
  const displayName = deriveDisplayName(userName, userEmail)
  const initials = deriveInitials(displayName)
  const title = deriveTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 pt-safe backdrop-blur-md md:hidden">
      <h1 className="font-heading text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <NotificationsBell />
        <Link
          href="/dashboard"
          className="tap-target flex items-center justify-center"
          aria-label="Perfil"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-[11px] font-mono font-semibold text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
