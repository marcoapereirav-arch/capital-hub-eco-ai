import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function slugifyKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

const createStageSchema = z.object({
  name: z.string().min(1).max(60),
  key: z.string().min(1).max(60).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  kind: z.enum(["active", "won", "lost", "branch"]).optional(),
  sortOrder: z.number().int().optional(),
})

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: pipelineId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createStageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Input invalido" }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const key = parsed.data.key ?? slugifyKey(parsed.data.name)

  // sort_order = max+1 si no se especifica
  let sort_order = parsed.data.sortOrder
  if (sort_order === undefined) {
    const { data: maxRow } = await admin
      .from("pipeline_stages")
      .select("sort_order")
      .eq("pipeline_id", pipelineId)
      .order("sort_order", { ascending: false })
      .limit(1)
    sort_order = (maxRow?.[0]?.sort_order ?? 0) + 1
  }

  const { data, error } = await admin
    .from("pipeline_stages")
    .insert({
      pipeline_id: pipelineId,
      key,
      name: parsed.data.name,
      color: parsed.data.color ?? "#71717a",
      kind: parsed.data.kind ?? "active",
      sort_order,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ya existe un stage con esa clave" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
