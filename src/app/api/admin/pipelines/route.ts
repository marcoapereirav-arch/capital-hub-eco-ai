import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

const createSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("pipelines")
    .select("*, stages:pipeline_stages(*)")
    .order("display_order")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Input invalido", details: parsed.error.format() }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let slug = slugify(parsed.data.name)
  let attempt = 0
  while (attempt < 10) {
    const candidate = attempt === 0 ? slug : `${slug}_${attempt}`
    const { data: exists } = await admin.from("pipelines").select("id").eq("slug", candidate).maybeSingle()
    if (!exists) { slug = candidate; break }
    attempt++
  }

  const { data: maxOrder } = await admin
    .from("pipelines").select("display_order").order("display_order", { ascending: false }).limit(1)
  const display_order = (maxOrder?.[0]?.display_order ?? 0) + 1

  const { data, error } = await admin
    .from("pipelines")
    .insert({
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      color: parsed.data.color ?? "#3b82f6",
      is_default: false,
      display_order,
      created_by: user.id,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un pipeline con ese nombre" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
