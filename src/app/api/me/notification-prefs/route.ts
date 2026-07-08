import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"
import { PREF_KEYS } from "@/lib/notifications/prefs-catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/me/notification-prefs — mapa pref → enabled del usuario (sin fila = true). */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createServiceRoleClient()
  const { data, error } = await admin
    .from("notification_preferences")
    .select("pref, enabled")
    .eq("user_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const saved = new Map((data ?? []).map((r) => [r.pref as string, r.enabled as boolean]))
  const prefs: Record<string, boolean> = {}
  for (const key of PREF_KEYS) prefs[key] = saved.get(key) ?? true

  return NextResponse.json({ prefs })
}

const PatchSchema = z.object({
  pref: z.enum(PREF_KEYS as [string, ...string[]]),
  enabled: z.boolean(),
})

/** PATCH /api/me/notification-prefs — enciende/apaga UN grupo de avisos del usuario. */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Preferencia inválida" }, { status: 400 })

  const admin = createServiceRoleClient()
  const { error } = await admin
    .from("notification_preferences")
    .upsert(
      { user_id: user.id, pref: parsed.data.pref, enabled: parsed.data.enabled, updated_at: new Date().toISOString() },
      { onConflict: "user_id,pref" },
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
