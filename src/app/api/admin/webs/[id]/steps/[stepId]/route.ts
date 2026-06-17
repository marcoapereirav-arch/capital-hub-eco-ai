import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).nullable().optional(),
  slug: z
    .string()
    .min(0)
    .max(120)
    .regex(/^([a-z0-9][a-z0-9-/_]*)?$/, "Solo minúsculas, números, guion, barra y guion bajo")
    .optional(),
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; stepId: string }> }) {
  const { stepId } = await ctx.params
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

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.name !== undefined) update.name = parsed.data.name
  if (parsed.data.description !== undefined) update.description = parsed.data.description
  if (parsed.data.slug !== undefined) update.slug = parsed.data.slug

  const { data, error } = await admin
    .from("web_steps")
    .update(update)
    .eq("id", stepId)
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ese slug ya está usado por otro step" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
