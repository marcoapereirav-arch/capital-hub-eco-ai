import { NextResponse } from "next/server"
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
 * GET /api/admin/content/tree
 * Devuelve el árbol completo Routes → Formations → Modules → Lessons
 * para la UI de gestión.
 */
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()

  const [routesRes, formationsRes, modulesRes, lessonsRes] = await Promise.all([
    admin.from("routes").select("id, name, slug, description, product_key, display_order, active").order("display_order"),
    admin.from("formations").select("id, route_id, name, description, image_url, level, display_order, active").order("display_order"),
    admin.from("modules").select("id, formation_id, name, description, display_order, content_type").order("display_order"),
    admin.from("lessons").select("id, module_id, title, content, video_url, video_provider, duration, position, attachments").order("position"),
  ])

  return NextResponse.json({
    routes: routesRes.data ?? [],
    formations: formationsRes.data ?? [],
    modules: modulesRes.data ?? [],
    lessons: lessonsRes.data ?? [],
  })
}
