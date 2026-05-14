import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncGoogleDoc } from '@/features/content-intel/services/ideas-sync'
import { toErrorMessage } from '@/features/content-intel/lib/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * GET /api/cron/sync-ideas
 *
 * Endpoint disparado por Vercel Cron diariamente. Sincroniza TODOS los
 * docs activos de TODOS los usuarios.
 *
 * Auth: Vercel Cron envía header `Authorization: Bearer <CRON_SECRET>`.
 * Si CRON_SECRET no está configurada, también aceptamos x-internal-key
 * (para test local).
 */
export async function GET(req: NextRequest) {
  // Auth
  const auth = req.headers.get('authorization')
  const internal = req.headers.get('x-internal-key')
  const cronSecret = process.env.CRON_SECRET
  const internalKey = process.env.INTERNAL_TRIGGER_KEY

  const validCron = cronSecret && auth === `Bearer ${cronSecret}`
  const validInternal = internalKey && internal === internalKey
  if (!validCron && !validInternal) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const startedAt = Date.now()

  // Cargar todas las fuentes activas
  const { data: sources, error } = await supabase
    .from('ci_ideas_sources')
    .select('id, user_id, source_id, display_name')
    .eq('is_active', true)

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  const results: Array<{
    source_id: string
    user_id: string
    imported?: number
    skipped?: number
    error?: string
  }> = []

  for (const src of sources ?? []) {
    const sourceUuid = src.id as string
    const userId = src.user_id as string
    try {
      const r = await syncGoogleDoc(userId, sourceUuid)
      results.push({
        source_id: sourceUuid,
        user_id: userId,
        imported: r.imported,
        skipped: r.skipped_existing,
      })
    } catch (err) {
      results.push({
        source_id: sourceUuid,
        user_id: userId,
        error: toErrorMessage(err),
      })
    }
  }

  const elapsed_ms = Date.now() - startedAt
  return Response.json({
    ok: true,
    sources_processed: results.length,
    total_imported: results.reduce((acc, r) => acc + (r.imported ?? 0), 0),
    elapsed_ms,
    results,
  })
}
