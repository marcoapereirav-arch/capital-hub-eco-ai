import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const Schema = z.object({ full_name: z.string().min(2).max(120) })

/** PATCH /api/me — el usuario actualiza SU propio nombre. */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = Schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Nombre inválido (mínimo 2 caracteres)" }, { status: 400 })
  const full_name = parsed.data.full_name.trim()

  const admin = createServiceRoleClient()
  const { error } = await admin.from("profiles").update({ full_name, updated_at: new Date().toISOString() }).eq("id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Propaga a user_metadata.full_name sin perder otros campos.
  const { data: au } = await admin.auth.admin.getUserById(user.id)
  const meta = (au.user?.user_metadata ?? {}) as Record<string, unknown>
  await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...meta, full_name } }).then(() => null, () => null)

  return NextResponse.json({ ok: true, full_name })
}
