import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const assignSchema = z.object({
  tagId: z.string().uuid(),
})

/** POST /api/admin/contacts/[id]/tags — asignar un tag al contacto. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: contactId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = assignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "tagId requerido" }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await admin
    .from("contact_tags")
    .insert({
      contact_id: contactId,
      tag_id: parsed.data.tagId,
      assigned_by: user.id,
    })

  // 23505 = tag ya asignado (PRIMARY KEY conflict) — no es error
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
