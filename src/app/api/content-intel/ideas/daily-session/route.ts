import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { createDailySession } from '@/features/content-intel/services/corpus-chat'
import { PLATFORMS } from '@/features/content-intel/types/platform'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const FiltersSchema = z.object({
  account_ids: z.array(z.string().uuid()).optional(),
  min_views: z.number().int().min(0).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  order_by: z
    .enum(['views', 'engagement_rate', 'comments', 'likes', 'posted_at'])
    .optional(),
  top_n_per_account: z.number().int().min(1).max(20).optional(),
})

const Schema = z.object({
  filters: FiltersSchema.optional(),
  platform: z.enum(PLATFORMS).optional().default('instagram'),
  total_limit: z.number().int().min(3).max(50).optional().default(25),
})

/**
 * POST /api/content-intel/ideas/daily-session
 *
 * Crea una "sesión del día":
 *  - Chat de corpus persistente con session_type='daily'
 *  - Las ideas pendientes del usuario están en el system prompt
 *  - El modelo opera en modo selección + generación uno a uno
 *
 * Devuelve chat_id + el primer mensaje sugerido para auto-enviar desde el cliente.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Defaults razonables si el usuario no pasa filtros
  const filters = parsed.data.filters ?? {
    min_views: 100000,
    from_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    order_by: 'engagement_rate' as const,
    top_n_per_account: 3,
  }

  try {
    const result = await createDailySession({
      userId: auth.session.userId,
      filters,
      platform: parsed.data.platform,
      totalLimit: parsed.data.total_limit,
    })
    return Response.json({
      ok: true,
      chat_id: result.chat.id,
      first_user_message: result.firstUserMessage,
    })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
