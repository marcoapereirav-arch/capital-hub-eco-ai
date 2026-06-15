import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const patchSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  description: z.string().max(200).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Input invalido" }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Si pasa a default, desmarca el resto primero (constraint de un solo default)
  if (parsed.data.isDefault === true) {
    await admin.from("pipelines").update({ is_default: false }).neq("id", id)
  }

  const update: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) update.name = parsed.data.name
  if (parsed.data.description !== undefined) update.description = parsed.data.description
  if (parsed.data.color !== undefined) update.color = parsed.data.color
  if (parsed.data.isDefault !== undefined) update.is_default = parsed.data.isDefault

  const { data, error } = await admin
    .from("pipelines")
    .update(update)
    .eq("id", id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // No permitir borrar el default si es el unico
  const { data: pipeline } = await admin.from("pipelines").select("is_default").eq("id", id).maybeSingle()
  if (pipeline?.is_default) {
    const { data: total } = await admin.from("pipelines").select("id")
    if ((total ?? []).length <= 1) {
      return NextResponse.json({ error: "No se puede borrar el unico pipeline" }, { status: 400 })
    }
  }

  const { error } = await admin.from("pipelines").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
