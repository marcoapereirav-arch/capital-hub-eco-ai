"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, User, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
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
  const [menuAbierto, setMenuAbierto] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const displayName = deriveDisplayName(userName, userEmail)
  const initials = deriveInitials(displayName)
  const title = deriveSectionTitle(pathname)

  // El alto INCLUYE la franja del notch. Antes era h-14 fijo con pt-safe por
  // dentro, asi que en un iPhone con notch al titulo le quedaban 9 puntos y se
  // desbordaba encima de la pagina.
  return (
    <header className="sticky top-0 z-30 flex h-[calc(3.5rem+var(--sat))] shrink-0 items-center justify-between border-b border-border bg-popover px-4 pt-safe md:hidden">
      <h1 className="truncate pr-3 font-heading text-base font-extrabold text-foreground">
        {title}
      </h1>
      {/* Derecha: campana + avatar (perfil), alineados con la línea del header. */}
      <div className="flex items-center gap-1">
        <NotificationsBell />
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          className="tap-target flex items-center justify-center rounded-full transition-transform active:scale-95"
          aria-label="Tu cuenta"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>

      {/* Tu cuenta. Antes el avatar era un enlace suelto y al tocarlo no pasaba
          nada visible; ahora abre las dos cosas que se hacen desde aqui, con su
          salida a la vista. */}
      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="bottom" className="rounded-t-xl border-border bg-popover" showCloseButton={false}>
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />

          <SheetHeader className="flex-row items-center justify-between gap-3 px-4 pt-3 pb-1">
            <SheetTitle className="text-base font-extrabold text-foreground">
              {displayName}
            </SheetTitle>
            <button
              type="button"
              onClick={() => setMenuAbierto(false)}
              className="tap-target -mr-2 inline-flex items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors active:bg-secondary active:text-foreground"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              Cerrar
            </button>
          </SheetHeader>

          <p className="px-4 pb-2 text-sm text-muted-foreground">{userEmail}</p>

          <div className="space-y-2 px-4 pb-4">
            <Link
              href="/perfil"
              onClick={() => setMenuAbierto(false)}
              className="tap-target flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-base text-foreground transition-colors active:bg-secondary"
            >
              <User className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              Mi perfil
            </Link>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push("/login")
                router.refresh()
              }}
              className="tap-target flex w-full items-center gap-3 rounded-lg border border-border px-3 py-3 text-base text-foreground transition-colors active:bg-secondary"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              Cerrar sesión
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
