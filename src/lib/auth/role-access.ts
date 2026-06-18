/**
 * Sistema de roles y permisos del OS.
 *
 * Cada rol tiene una whitelist de rutas a las que puede acceder.
 * El gate se aplica en 2 sitios:
 *   1. Sidebar: filtra items mostrados según el rol del user
 *   2. Proxy/middleware: redirige a /dashboard si intenta abrir ruta no permitida
 *
 * Roles definidos por Marco (2026-06-17) — SOP 05 sprint arreglos:
 *   - super_admin / admin: acceso total + dropdown "Ver como Rol"
 *   - marketing: dashboard · operaciones · CRM · webs
 *   - formador: dashboard · operaciones · CRM (en App tiene rol ADMIN para editar su formación)
 *   - closer: dashboard · operaciones · CRM
 *   - setter: dashboard · operaciones · CRM
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
    "/contactos",
    "/webs",
  ],
  formador: [
    "/dashboard",
    "/overview",
    "/operaciones",
    "/crm",
    "/contactos",
  ],
  closer: [
    "/dashboard",
    "/overview",
    "/operaciones",
    "/crm",
    "/contactos",
  ],
  setter: [
    "/dashboard",
    "/overview",
    "/operaciones",
    "/crm",
    "/contactos",
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

/**
 * Devuelve el rol "efectivo" para gates de UI (sidebar, proxy gate).
 *
 * Si el usuario real es admin/super_admin y tiene cookie `view_as_role` con un rol válido,
 * la UI se renderiza con ese rol — útil para que el admin vea exactamente lo que ve un
 * marketing/closer/setter/formador.
 *
 * IMPORTANTE: esto es un override de UI READ-ONLY. Las mutaciones server-side siguen
 * verificándose contra el rol REAL del admin. No es impersonación real, es preview visual.
 */
export function getEffectiveRole(
  realRole: Role | string | null | undefined,
  viewAsCookie: string | null | undefined,
): Role | string | null {
  const isAdmin = realRole === "super_admin" || realRole === "admin"
  if (!isAdmin) return realRole ?? null
  if (!viewAsCookie) return realRole ?? null
  // Solo permitir impersonar roles no-admin
  const allowedImpersonations: Role[] = ["marketing", "formador", "closer", "setter"]
  if (allowedImpersonations.includes(viewAsCookie as Role)) {
    return viewAsCookie
  }
  return realRole ?? null
}

export const VIEW_AS_COOKIE_NAME = "view_as_role"
