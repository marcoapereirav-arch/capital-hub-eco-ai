"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationsBell } from "@/features/notifications/components/NotificationsPanel"
import { deriveSectionTitle } from "./nav-config"

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

export function MobileHeader({ userEmail, userName }: MobileHeaderProps) {
  const pathname = usePathname()
  const displayName = deriveDisplayName(userName, userEmail)
  const initials = deriveInitials(displayName)
  const title = deriveSectionTitle(pathname)

  // El alto INCLUYE la franja del notch. Antes era h-14 fijo con pt-safe por
  // dentro, asi que en un iPhone con notch al titulo le quedaban 9 puntos y se
  // desbordaba encima de la pagina.
  return (
    <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 pt-safe backdrop-blur-md md:hidden">
      <h1 className="truncate pr-3 font-heading text-base font-extrabold text-foreground">
        {title}
      </h1>
      {/* Derecha: campana + avatar (perfil), alineados con la línea del header. */}
      <div className="flex items-center gap-1">
        <NotificationsBell />
        <Link
          href="/perfil"
          className="tap-target flex items-center justify-center"
          aria-label="Perfil"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
