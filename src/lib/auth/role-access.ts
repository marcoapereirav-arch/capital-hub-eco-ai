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
const ALWAYS_ALLOWED = ["/login", "/logout", "/api/", "/auth/", "/_next/", "/favicon", "/manifest", "/formacion"]

/**
 * Defaults hardcoded — fallback si la BD no responde.
 * Source of truth runtime: tabla role_permissions (editable desde /team).
 */
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
    "/tutoriales",
  ],
  formador: [
    "/dashboard",
    "/overview",
    "/operaciones",
    "/crm",
    "/contactos",
    "/tutoriales",
  ],
  closer: [
    "/dashboard",
    "/overview",
    "/operaciones",
    "/crm",
    "/contactos",
    "/tutoriales",
  ],
  setter: [
    "/dashboard",
    "/overview",
    "/operaciones",
    "/crm",
    "/contactos",
    "/tutoriales",
  ],
}

/**
 * Lista completa de hrefs del sidebar (todos los items independientes).
 * Se usa para resolver QUÉ item del nav corresponde a un pathname dado y aplicar el
 * permiso de ESE item específico, no del padre por convención de URL.
 *
 * Ejemplo: /sistemas es un item independiente del sidebar con su propio permiso (antes
 * vivía en /webs/sistema y por eso el OS lo agrupaba bajo Webs; ya no).
 *
 * Las sub-rutas DINÁMICAS sí heredan del padre. Ejemplo: /webs/[funnelId] hereda de /webs;
 * /contactos/[id] hereda de /contactos.
 */
const ALL_NAV_HREFS = [
  "/dashboard",
  "/overview",
  "/operaciones",
  "/knowledge",
  "/team",
  "/crm",
  "/contactos",
  "/calendario",
  "/email-marketing",
  "/webs",
  "/sistemas",
  "/webs/lead-magnets",
  "/automatizaciones",
  "/ads",
  "/content-intel",
  "/instagram",
  "/manychat",
  "/invitaciones",
  "/integrations",
  "/mision",
].sort((a, b) => b.length - a.length)

/**
 * Cache module-level de los permisos de role_permissions.
 * setCachedRolePerms() lo hidrata desde el layout server component.
 * Si está null → fallback al ROLE_ROUTES hardcoded.
 */
let cachedRolePerms: Record<string, string[]> | null = null

export function setCachedRolePerms(snapshot: Record<string, string[]>): void {
  cachedRolePerms = snapshot
}

function getAllowedForRole(role: Role | string | null | undefined): string[] | "*" {
  if (!role) return []
  if (role === "super_admin" || role === "admin") return "*"
  if (cachedRolePerms && cachedRolePerms[role]) return cachedRolePerms[role]
  const fallback = ROLE_ROUTES[role as Role]
  return fallback ?? []
}

/** True si el rol puede acceder al pathname. */
export function canAccessRoute(role: Role | string | null | undefined, pathname: string): boolean {
  if (!role) return false
  if (ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))) return true
  const allowed = getAllowedForRole(role)
  if (allowed === "*") return true
  if (!allowed.length) return false

  const matchedNav = ALL_NAV_HREFS.find(
    (href) => pathname === href || pathname.startsWith(href + "/"),
  )
  if (matchedNav) {
    return allowed.includes(matchedNav)
  }
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
}

/** Lista de prefijos permitidos para un rol (sidebar filtering). */
export function allowedPrefixesFor(role: Role | string | null | undefined): string[] | "*" {
  if (!role) return []
  return getAllowedForRole(role)
}

/**
 * Lee la matriz completa de role_permissions de BD con un service-role client.
 * Usado por server components / proxy middleware para hidratar el cache.
 * Si falla, devuelve null (cache NO se actualiza, sigue usando fallback).
 */
export async function loadRolePermsFromDb(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<Record<string, string[]> | null> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/role_permissions?select=role,route_href`, {
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      // Caching por request: Next.js no cachea automáticamente fetches en server components con auth
      cache: "no-store",
    })
    if (!res.ok) return null
    const rows = await res.json() as { role: string; route_href: string }[]
    const out: Record<string, string[]> = {}
    for (const row of rows) {
      if (!out[row.role]) out[row.role] = []
      out[row.role].push(row.route_href)
    }
    return out
  } catch {
    return null
  }
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
