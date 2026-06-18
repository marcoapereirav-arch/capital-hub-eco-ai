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

/**
 * Lista completa de hrefs del sidebar (todos los items independientes).
 * Se usa para resolver QUÉ item del nav corresponde a un pathname dado y aplicar el
 * permiso de ESE item específico, no del padre por convención de URL.
 *
 * Ejemplo: /webs/sistema NO es sub-ruta de /webs aunque la URL lo parezca — es un item
 * independiente del sidebar con su propio permiso. Marketing tiene /webs pero NO /webs/sistema.
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
  "/webs/sistema",
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

/** True si el rol puede acceder al pathname. */
export function canAccessRoute(role: Role | string | null | undefined, pathname: string): boolean {
  if (!role) return false
  // Rutas siempre permitidas
  if (ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))) return true
  const allowed = ROLE_ROUTES[role as Role]
  if (!allowed) return false
  if (allowed === "*") return true

  // Encontrar el item del nav más específico que matchee este pathname (longest match wins).
  // Si la ruta coincide con un item del nav → ese item específico debe estar en allowed.
  // Si NO coincide con ningún item → es sub-ruta dinámica y hereda del padre permitido.
  const matchedNav = ALL_NAV_HREFS.find(
    (href) => pathname === href || pathname.startsWith(href + "/"),
  )
  if (matchedNav) {
    return allowed.includes(matchedNav)
  }

  // Sub-ruta dinámica no mapeada en el nav (ej. /perfil/abc, /reporte/xyz)
  // Heredar del prefijo permitido más cercano.
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
