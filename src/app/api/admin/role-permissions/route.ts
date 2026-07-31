import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { navSections } from "@/features/shell/components/nav-config"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Las secciones de la matriz SE DERIVAN DEL MENU LATERAL. No se escriben aqui.
 *
 * Antes habia una segunda lista escrita a mano en este archivo, y el menu tenia
 * la suya. Cada seccion nueva habia que escribirla en los dos sitios, asi que
 * tarde o temprano se desincronizaban: al añadir Tutoriales (2026-07-31) entro
 * en el menu pero no en la matriz, y no habia forma de darle acceso a nadie.
 * Ademas la matriz arrastraba dos filas de secciones que ya no existian.
 *
 * Derivandola, cualquier seccion nueva aparece sola y para siempre.
 */
function seccionesDelMenu() {
  return navSections.flatMap((seccion) =>
    seccion.items.map((item) => ({
      href: item.href,
      label: item.title,
      group: seccion.label,
    })),
  )
}

/**
 * Rutas que NO tienen entrada propia en el menu pero si necesitan permiso.
 *
 * Son pantallas a las que se llega desde dentro de otra seccion. Si no
 * estuvieran aqui, no habria forma de abrirlas ni cerrarlas por rol.
 * Esta lista es la UNICA excepcion, y cada linea dice por que existe.
 */
const RUTAS_SIN_MENU = [
  // Se abre desde CRM, y `ROLE_ROUTES` la concede por separado.
  { href: "/contactos", label: "Contactos", group: "Marketing" },
  // Prefijo de las pantallas de Operaciones (board, tareas, proyectos, areas).
  { href: "/operaciones", label: "Operaciones (pantallas internas)", group: "Operaciones" },
]

function catalogoDeSecciones() {
  const delMenu = seccionesDelMenu()
  const yaEstan = new Set(delMenu.map((s) => s.href))
  // Si alguna ruta extra acaba teniendo su propia entrada en el menu, la del
  // menu manda y no se duplica la fila.
  return [...delMenu, ...RUTAS_SIN_MENU.filter((r) => !yaEstan.has(r.href))]
}

const EDITABLE_ROLES = ["marketing", "closer", "setter", "formador"] as const

/**
 * GET /api/admin/role-permissions
 * Devuelve catálogo nav + permisos actuales por rol.
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: rows } = await admin
    .from("role_permissions")
    .select("role, route_href")

  const allowed: Record<string, Set<string>> = {}
  for (const r of EDITABLE_ROLES) allowed[r] = new Set()
  for (const row of (rows ?? []) as { role: string; route_href: string }[]) {
    if (allowed[row.role]) allowed[row.role].add(row.route_href)
  }

  return NextResponse.json({
    sections: catalogoDeSecciones(),
    roles: EDITABLE_ROLES,
    allowed: Object.fromEntries(
      Object.entries(allowed).map(([role, set]) => [role, Array.from(set)])
    ),
  })
}

/**
 * PUT /api/admin/role-permissions
 * Body: { role, route_href, enabled: boolean }
 * Si enabled=true: insert. Si false: delete.
 */
export async function PUT(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verifica que el caller es super_admin (RLS también lo hace, pero damos error claro)
  const admin = getAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Solo super_admin puede editar permisos" }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    role?: string
    route_href?: string
    enabled?: boolean
  }
  const role = body.role
  const route_href = body.route_href
  if (!role || !route_href || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "role, route_href, enabled son obligatorios" }, { status: 400 })
  }
  if (!EDITABLE_ROLES.includes(role as typeof EDITABLE_ROLES[number])) {
    return NextResponse.json({ error: "Rol no editable" }, { status: 400 })
  }
  // Mismo catalogo que ve la matriz: si no se puede ver, no se puede conceder.
  if (!catalogoDeSecciones().find((s) => s.href === route_href)) {
    return NextResponse.json({ error: "route_href no reconocido" }, { status: 400 })
  }

  if (body.enabled) {
    const { error } = await admin
      .from("role_permissions")
      .insert({ role, route_href })
      .select()
      .maybeSingle()
    // Ignore duplicate key (ya está enabled)
    if (error && !error.message.includes("duplicate key")) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await admin
      .from("role_permissions")
      .delete()
      .eq("role", role)
      .eq("route_href", route_href)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
