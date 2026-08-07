"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MoreHorizontal, LogOut, User } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { navPrimary, navSecondary } from "./nav-config"
import { canAccessRoute } from "@/lib/auth/role-access"

interface MobileBottomNavProps {
  userEmail: string
  userName: string | null
  userRole: string | null
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

export function MobileBottomNav({
  userEmail,
  userName,
  userRole,
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  const displayName = deriveDisplayName(userName, userEmail)
  const initials = deriveInitials(displayName)
  const roleLabel = (userRole === "admin" || userRole === "super_admin") ? "Admin" : userRole ?? "Miembro"

  const isSecondaryActive = navSecondary.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  )

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-safe backdrop-blur-md md:hidden">
        {/* Reparto a partes iguales entre los que DE VERDAD se pintan. Antes
            eran 5 columnas fijas con 4 botones (o 3, segun el rol): la barra
            salia corrida a la izquierda con un hueco vacio a la derecha. */}
        <ul className="flex">
          {navPrimary.filter((item) => canAccessRoute(userRole, item.href)).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href} className="contents">
                <Link
                  href={item.href}
                  className={cn(
                    "tap-target relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground active:text-foreground"
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-foreground"
                    />
                  )}
                  <item.icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                  <span className="text-sm font-semibold leading-none">
                    {item.title}
                  </span>
                </Link>
              </li>
            )
          })}
          <li className="contents">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "tap-target relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                isSecondaryActive || moreOpen
                  ? "text-foreground"
                  : "text-muted-foreground active:text-foreground"
              )}
              aria-label="Más opciones"
            >
              {(isSecondaryActive || moreOpen) && (
                <span
                  aria-hidden
                  className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-foreground"
                />
              )}
              <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={1.75} />
              <span className="text-sm font-semibold leading-none">
                Más
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-xl border-border bg-popover pb-safe"
          showCloseButton={false}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />

          <SheetHeader className="px-4 pt-3">
            <SheetTitle className="text-base font-extrabold text-foreground">
              Más
            </SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2 px-4 pb-2">
            {navSecondary.filter((item) => canAccessRoute(userRole, item.href)).map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "tap-target flex items-center gap-3 rounded-md border border-border px-3 py-3 text-sm transition-colors active:bg-secondary",
                    isActive
                      ? "border-foreground/40 bg-secondary text-foreground"
                      : "text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </div>

          <Separator className="my-2" />

          <div className="px-4 pb-4">
            <div className="mb-3 flex items-center gap-3 rounded-md bg-secondary px-3 py-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{displayName}</span>
                <span className="text-xs text-muted-foreground">{userEmail}</span>
              </div>
              <span className="rounded-lg bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {roleLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="tap-target flex w-full items-center gap-3 rounded-md border border-border px-3 py-3 text-sm text-foreground transition-colors active:bg-secondary"
            >
              <User className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
              <span className="font-medium">Perfil</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="tap-target mt-2 flex w-full items-center gap-3 rounded-md border border-destructive/30 px-3 py-3 text-sm text-destructive transition-colors active:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.75} />
              <span className="font-medium">Cerrar sesión</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
