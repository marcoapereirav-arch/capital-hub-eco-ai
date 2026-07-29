import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Lista canónica de items del nav OS. Cada row = (label, href).
 * UI matriz: filas = roles (sin super_admin), columnas = estos items.
 * super_admin tiene siempre acceso a todo (no se chequea en BD).
 */
const NAV_SECTIONS = [
  // Operaciones
  { href: "/dashboard", label: "Dashboard", group: "Operaciones" },
  { href: "/overview", label: "Operaciones", group: "Operaciones" },
  { href: "/operaciones", label: "Operaciones (alt)", group: "Operaciones" },
  { href: "/knowledge", label: "Knowledge", group: "Operaciones" },
  { href: "/team", label: "Equipo", group: "Operaciones" },
  // Marketing
  { href: "/crm", label: "CRM", group: "Marketing" },
  { href: "/contactos", label: "Contactos", group: "Marketing" },
  { href: "/calendario", label: "Calendario", group: "Marketing" },
  { href: "/email-marketing", label: "Email Marketing", group: "Marketing" },
  { href: "/webs", label: "Webs", group: "Marketing" },
  { href: "/sistemas", label: "Sistema visual", group: "Marketing" },
  { href: "/webs/lead-magnets", label: "Lead Magnets", group: "Marketing" },
  { href: "/automatizaciones", label: "Automatizaciones", group: "Marketing" },
  { href: "/ads", label: "Ads", group: "Marketing" },
  { href: "/content-intel", label: "Content Intel", group: "Marketing" },
  { href: "/instagram", label: "Instagram", group: "Marketing" },
  { href: "/manychat", label: "ManyChat", group: "Marketing" },
  // Producto
  { href: "/invitaciones", label: "Invitaciones App", group: "Producto" },
  { href: "/integrations", label: "Integraciones", group: "Producto" },
  { href: "/mision", label: "Misión", group: "Producto" },
]

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
    sections: NAV_SECTIONS,
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
  if (!NAV_SECTIONS.find((s) => s.href === route_href)) {
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
