import { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { manychatAdapter } from "@/features/integrations/adapters/manychat"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * GET /api/cron/manychat-sync
 *
 * Sincroniza desde la API de ManyChat hacia las tablas de caché del OS:
 *  - manychat_tags_cache        (tags definidos en el panel)
 *  - manychat_custom_fields_cache (custom fields)
 *  - api_connections.last_sync_at (heartbeat para el dashboard /manychat)
 *
 * NO trae suscriptores: esos llegan por webhook (subscriber_added). Este cron
 * solo mantiene vivos tags/fields + el latido de "último sync".
 *
 * Auth: Bearer CRON_SECRET (Vercel cron) o header x-internal-key.
 * Registrado en vercel.json + panel /automatizaciones (SOP producto/20).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const internal = req.headers.get("x-internal-key")
  const cronSecret = process.env.CRON_SECRET
  const internalKey = process.env.INTERNAL_TRIGGER_KEY
  const validCron = cronSecret && auth === `Bearer ${cronSecret}`
  const validInternal = internalKey && internal === internalKey
  if (!validCron && !validInternal) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.MANYCHAT_API_KEY
  if (!apiKey) {
    return Response.json({ ok: false, error: "MANYCHAT_API_KEY not set" }, { status: 500 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const result = await manychatAdapter.fetchMetrics({ apiKey })

  if (result.error) {
    await supabase
      .from("api_connections")
      .update({ last_sync_at: now, last_error: result.error, status: "error", updated_at: now })
      .eq("platform", "manychat")
    return Response.json({ ok: false, error: result.error }, { status: 502 })
  }

  const raw = (result.rawData ?? {}) as {
    manychatTags?: Array<{ id: string; name: string }>
    manychatCustomFields?: Array<{ id: string; name: string; type: string | null; description: string | null }>
  }
  const tags = raw.manychatTags ?? []
  const fields = raw.manychatCustomFields ?? []

  let tagsWritten = 0
  let fieldsWritten = 0

  if (tags.length) {
    const { error } = await supabase
      .from("manychat_tags_cache")
      .upsert(
        tags.map((t) => ({ id: String(t.id), name: t.name, synced_at: now })),
        { onConflict: "id" },
      )
    if (!error) tagsWritten = tags.length
    else console.error("[manychat-sync] tags upsert failed:", error.message)
  }

  if (fields.length) {
    const { error } = await supabase
      .from("manychat_custom_fields_cache")
      .upsert(
        fields.map((f) => ({
          id: String(f.id),
          name: f.name,
          type: f.type ?? null,
          description: f.description ?? null,
          synced_at: now,
        })),
        { onConflict: "id" },
      )
    if (!error) fieldsWritten = fields.length
    else console.error("[manychat-sync] custom_fields upsert failed:", error.message)
  }

  await supabase
    .from("api_connections")
    .update({ last_sync_at: now, last_error: null, status: "connected", updated_at: now })
    .eq("platform", "manychat")

  return Response.json({ ok: true, tags: tagsWritten, customFields: fieldsWritten, syncedAt: now })
}
