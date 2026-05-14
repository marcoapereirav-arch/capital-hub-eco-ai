import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { generateChatFromIdea } from '@/features/content-intel/services/ideas-sync'

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
 * POST /api/content-intel/ideas/[id]/generate
 *
 * Convierte una idea en un chat de corpus. Devuelve el chat_id.
 * El cliente debe redirigir al chat (en el tab "Chat con Corpus") y enviar
 * el primer mensaje desde ahí — el chat ya tiene el contexto pre-cargado.
 */
export async function POST(req: NextRequest, { params }: Params) {
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
    const result = await generateChatFromIdea({
      userId: auth.session.userId,
      ideaId: id,
      filters: parsed.data.filters,
      totalLimit: parsed.data.total_limit,
    })
    return Response.json({ ok: true, result })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
