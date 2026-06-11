import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

/**
 * Servicio admin para gestionar contenido de formaciones / módulos / lecciones.
 * Usa service_role en server actions para bypass de RLS (solo admins ven /contenido).
 */

export type Route = {
  id: number
  name: string
  slug: string
  product_key: string
  description: string | null
  active: boolean
}

export type Formation = {
  id: number
  route_id: number
  name: string
  description: string | null
  display_order: number
  active: boolean
}

export type ContenidoModule = {
  id: number
  formation_id: number
  name: string
  description: string | null
  display_order: number
  content_type: string | null
}

export type Lesson = {
  id: number
  module_id: number
  title: string
  content: string | null
  video_url: string | null
  position: number
  duration: string | null
  bunny_video_id: string | null
  bunny_library_id: string | null
  bunny_status: string | null
  duration_seconds: number | null
  thumbnail_url: string | null
}

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Carga toda la jerarquía: routes → formations → modules → lessons.
 * Una sola llamada para que el componente lo muestre como árbol expandible.
 */
export async function loadAllContent() {
  const sb = adminClient()
  const [routesRes, formationsRes, modulesRes, lessonsRes] = await Promise.all([
    sb.from("routes").select("*").order("display_order"),
    sb.from("formations").select("*").order("display_order"),
    sb.from("modules").select("*").order("display_order"),
    sb.from("lessons").select("*").order("position"),
  ])
  return {
    routes: (routesRes.data ?? []) as Route[],
    formations: (formationsRes.data ?? []) as Formation[],
    modules: (modulesRes.data ?? []) as ContenidoModule[],
    lessons: (lessonsRes.data ?? []) as Lesson[],
  }
}

// ============ Módulos ============

export async function createModule(formationId: number, name: string) {
  const sb = adminClient()
  // Encuentra el siguiente display_order
  const { data: existing } = await sb
    .from("modules")
    .select("display_order")
    .eq("formation_id", formationId)
    .order("display_order", { ascending: false })
    .limit(1)
  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1

  const { data, error } = await sb
    .from("modules")
    .insert({
      formation_id: formationId,
      name: name.trim(),
      display_order: nextOrder,
      content_type: "TECHNICAL",
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ContenidoModule
}

export async function updateModule(id: number, updates: Partial<Pick<ContenidoModule, "name" | "description" | "display_order">>) {
  const sb = adminClient()
  const { error } = await sb.from("modules").update(updates).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteModule(id: number) {
  const sb = adminClient()
  // Borra lecciones del módulo primero
  await sb.from("lessons").delete().eq("module_id", id)
  const { error } = await sb.from("modules").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ============ Lecciones ============

export async function createLesson(moduleId: number, title: string) {
  const sb = adminClient()
  const { data: existing } = await sb
    .from("lessons")
    .select("position")
    .eq("module_id", moduleId)
    .order("position", { ascending: false })
    .limit(1)
  const nextPos = (existing?.[0]?.position ?? 0) + 1

  const { data, error } = await sb
    .from("lessons")
    .insert({
      module_id: moduleId,
      title: title.trim(),
      position: nextPos,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Lesson
}

export async function updateLesson(
  id: number,
  updates: Partial<Pick<Lesson, "title" | "content" | "video_url" | "position" | "bunny_video_id" | "bunny_library_id" | "bunny_status" | "duration_seconds" | "thumbnail_url">>,
) {
  const sb = adminClient()
  const { error } = await sb.from("lessons").update(updates).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteLesson(id: number) {
  const sb = adminClient()
  const { error } = await sb.from("lessons").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ============ Auth gate ============

export async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("no auth")
  const role = (user.user_metadata?.role as string | undefined) ?? (user.app_metadata?.role as string | undefined)
  if (role !== "ADMIN") throw new Error("not admin")
  return user
}
