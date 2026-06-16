/**
 * Sistema de roles y permisos del OS.
 *
 * Cada rol tiene una whitelist de rutas a las que puede acceder.
 * El gate se aplica en 2 sitios:
 *   1. Sidebar: filtra items mostrados según el rol del user
 *   2. Proxy/middleware: redirige a /dashboard si intenta abrir ruta no permitida
 *
 * Roles definidos por Marco (2026-06-16):
 *   - super_admin / admin: acceso total
 *   - marketing: 8 secciones (dashboard, operaciones, CRM, calendario,
 *     email marketing, webs, automatizaciones, instagram)
 *   - formador: MISMAS 8 secciones que marketing
 *   - closer / setter: pendientes de definir (acceso vacío de momento)
 */

export type Role = "super_admin" | "admin" | "marketing" | "closer" | "setter" | "formador"

/** Rutas siempre permitidas para cualquier usuario autenticado (logout, perfil, etc). */
const ALWAYS_ALLOWED = ["/login", "/logout", "/api/", "/auth/", "/_next/", "/favicon", "/manifest"]

/** Rol → prefijos de ruta permitidos (o "*" para acceso total). */
export const ROLE_ROUTES: Record<Role, string[] | "*"> = {
  super_admin: "*",
  admin: "*",
  marketing: [
    "/dashboard",
    "/overview",
    "/operaciones",
    "/crm",
    "/calendario",
    "/email-marketing",
    "/webs",
    "/automatizaciones",
    "/instagram",
  ],
  formador: [
    "/dashboard",
    "/overview",
    "/operaciones",
    "/crm",
    "/calendario",
    "/email-marketing",
    "/webs",
    "/automatizaciones",
    "/instagram",
  ],
  closer: [
    // Pendiente definir por Marco. De momento solo dashboard.
    "/dashboard",
  ],
  setter: [
    // Pendiente definir por Marco. De momento solo dashboard.
    "/dashboard",
  ],
}

/** True si el rol puede acceder al pathname. */
export function canAccessRoute(role: Role | string | null | undefined, pathname: string): boolean {
  if (!role) return false
  // Rutas siempre permitidas
  if (ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))) return true
  const allowed = ROLE_ROUTES[role as Role]
  if (!allowed) return false
  if (allowed === "*") return true
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
}

/** Lista de prefijos permitidos para un rol (para filtrar sidebar). */
export function allowedPrefixesFor(role: Role | string | null | undefined): string[] | "*" {
  if (!role) return []
  const r = ROLE_ROUTES[role as Role]
  return r ?? []
}
