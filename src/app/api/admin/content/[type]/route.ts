import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { detectProvider } from "@/features/contenido/lib/video-embed"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Permite operaciones CRUD sobre routes/formations/modules/lessons */
type ContentType = "routes" | "formations" | "modules" | "lessons"
const VALID_TYPES = ["routes", "formations", "modules", "lessons"] as const

// Schemas por tipo
const RouteSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(160),
  slug: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  product_key: z.string().max(40).optional(),
  display_order: z.number().optional(),
  active: z.boolean().optional(),
})

const FormationSchema = z.object({
  id: z.number().optional(),
  route_id: z.number(),
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  image_url: z.string().max(500).optional().nullable(),
  level: z.string().max(40).optional(),
  display_order: z.number().optional(),
  active: z.boolean().optional(),
})

const ModuleSchema = z.object({
  id: z.number().optional(),
  formation_id: z.number(),
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  display_order: z.number().optional(),
  content_type: z.string().max(40).optional(),
})

const LessonSchema = z.object({
  id: z.number().optional(),
  module_id: z.number(),
  title: z.string().min(1).max(200),
  content: z.string().max(20000).optional(),
  video_url: z.string().max(800).optional().nullable(),
  duration: z.string().max(20).optional(),
  position: z.number().optional(),
  attachments: z.array(z.object({
    name: z.string().max(200),
    url: z.string().max(800),
    type: z.string().max(60).optional(),
    size: z.number().optional(),
  })).optional(),
})

const SCHEMAS = {
  routes: RouteSchema,
  formations: FormationSchema,
  modules: ModuleSchema,
  lessons: LessonSchema,
} as const

async function assertAdmin(req: NextRequest, ctxType: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!VALID_TYPES.includes(ctxType as ContentType)) {
    return { error: NextResponse.json({ error: "Invalid type" }, { status: 400 }) }
  }
  return { user, admin: getAdminClient(), type: ctxType as ContentType }
}

// POST /api/admin/content/[type]
export async function POST(req: NextRequest, ctx: { params: Promise<{ type: string }> }) {
  const { type: typeParam } = await ctx.params
  const guard = await assertAdmin(req, typeParam)
  if ("error" in guard) return guard.error
  const { admin, type } = guard

  const body = await req.json()
  const parsed = SCHEMAS[type].safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 })
  }
  const row = parsed.data as Record<string, unknown>

  // Auto-detect video provider en lessons
  if (type === "lessons" && row.video_url) {
    row.video_provider = detectProvider(row.video_url as string)
  }

  delete row.id  // INSERT
  const { data, error } = await admin.from(type).insert(row).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// PATCH /api/admin/content/[type]?id=...
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ type: string }> }) {
  const { type: typeParam } = await ctx.params
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const guard = await assertAdmin(req, typeParam)
  if ("error" in guard) return guard.error
  const { admin, type } = guard

  const body = await req.json()
  const parsed = SCHEMAS[type].partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 })
  }
  const row = parsed.data as Record<string, unknown>

  if (type === "lessons" && row.video_url) {
    row.video_provider = detectProvider(row.video_url as string)
  }

  delete row.id
  const { data, error } = await admin.from(type).update(row).eq("id", Number(id)).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/admin/content/[type]?id=...
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ type: string }> }) {
  const { type: typeParam } = await ctx.params
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const guard = await assertAdmin(req, typeParam)
  if ("error" in guard) return guard.error
  const { admin, type } = guard

  const { error } = await admin.from(type).delete().eq("id", Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
