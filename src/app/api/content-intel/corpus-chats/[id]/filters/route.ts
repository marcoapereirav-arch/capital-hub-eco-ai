import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { updateCorpusChatFilters } from '@/features/content-intel/services/corpus-chat'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface Params {
  params: Promise<{ id: string }>
}

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
  filters: FiltersSchema,
  total_limit: z.number().int().min(3).max(50).optional().default(20),
})

/**
 * PATCH /api/content-intel/corpus-chats/[id]/filters
 *
 * Cambia los filtros del chat. Re-selecciona videos, re-analiza patrones,
 * guarda el nuevo contexto. Los mensajes anteriores del chat se mantienen
 * (historial intacto) pero a partir de ahora el modelo verá los nuevos
 * videos y análisis.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params

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

  try {
    const chat = await updateCorpusChatFilters(
      id,
      auth.session.userId,
      parsed.data.filters,
      parsed.data.total_limit,
    )
    return Response.json({ ok: true, chat })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
