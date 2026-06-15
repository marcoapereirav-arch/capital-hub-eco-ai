import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const reorderSchema = z.object({
  orderedStageIds: z.array(z.string().uuid()).min(1),
})

/** POST /api/admin/pipelines/[id]/stages/reorder — reasignar sort_order. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: pipelineId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = reorderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "orderedStageIds invalido" }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Reordenar en paralelo
  const updates = parsed.data.orderedStageIds.map((stageId, idx) =>
    admin.from("pipeline_stages")
      .update({ sort_order: idx + 1 })
      .eq("id", stageId)
      .eq("pipeline_id", pipelineId),
  )
  const results = await Promise.all(updates)
  const errors = results.map((r) => r.error).filter(Boolean)
  if (errors.length > 0) return NextResponse.json({ error: errors[0]!.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: parsed.data.orderedStageIds.length })
}
