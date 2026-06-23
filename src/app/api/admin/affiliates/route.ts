import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40)
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecoai.capitalhubapp.com"
const FUNNEL_PATH = "/test-personalidad"

/**
 * GET /api/admin/affiliates
 * Lista los afiliados con su link único y sus stats (leads/agendados/alumnos/revenue),
 * calculadas desde contacts.affiliate_slug. Es la "vista" de la atribución.
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const [{ data: affiliates }, { data: contacts }] = await Promise.all([
    admin.from("affiliates").select("slug, name, active, created_at").order("name"),
    admin
      .from("contacts")
      .select("affiliate_slug, stage, total_revenue")
      .not("affiliate_slug", "is", null),
  ])

  type Stat = { leads: number; agendados: number; alumnos: number; total: number; revenue: number }
  const statsBySlug = new Map<string, Stat>()
  for (const c of contacts ?? []) {
    const slug = c.affiliate_slug as string
    const s = statsBySlug.get(slug) ?? { leads: 0, agendados: 0, alumnos: 0, total: 0, revenue: 0 }
    s.total += 1
    if (c.stage === "lead") s.leads += 1
    else if (c.stage === "agendado") s.agendados += 1
    else if (c.stage === "alumno") s.alumnos += 1
    s.revenue += Number(c.total_revenue ?? 0)
    statsBySlug.set(slug, s)
  }

  const rows = (affiliates ?? []).map((a) => ({
    slug: a.slug,
    name: a.name,
    active: a.active,
    link: `${SITE_URL}${FUNNEL_PATH}?utm_source=${a.slug}`,
    stats: statsBySlug.get(a.slug) ?? { leads: 0, agendados: 0, alumnos: 0, total: 0, revenue: 0 },
  }))

  return NextResponse.json({ affiliates: rows })
}

/**
 * POST /api/admin/affiliates — crea un afiliado nuevo. Solo super_admin.
 * Body: { name: string, slug?: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Solo super_admin puede crear afiliados" }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as { name?: string; slug?: string }
  const name = (body.name ?? "").trim()
  if (name.length < 2) return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 })
  const slug = slugify(body.slug || name)
  if (!slug) return NextResponse.json({ error: "Slug inválido" }, { status: 400 })

  const { error } = await admin.from("affiliates").insert({ slug, name })
  if (error) {
    const dup = (error as { code?: string }).code === "23505"
    return NextResponse.json({ error: dup ? "Ese slug ya existe" : "No se pudo crear" }, { status: dup ? 409 : 500 })
  }
  return NextResponse.json({ ok: true, slug, name })
}
