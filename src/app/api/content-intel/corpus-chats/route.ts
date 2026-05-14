import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import {
  createCorpusChat,
  listCorpusChats,
} from '@/features/content-intel/services/corpus-chat'
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

const CreateSchema = z.object({
  filters: FiltersSchema,
  platform: z.enum(PLATFORMS).optional().default('instagram'),
  total_limit: z.number().int().min(3).max(50).optional().default(20),
  initial_brief: z.string().max(500).optional(),
})

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  try {
    const chats = await listCorpusChats(auth.session.userId)
    return Response.json({ ok: true, chats })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const chat = await createCorpusChat({
      userId: auth.session.userId,
      filters: parsed.data.filters,
      platform: parsed.data.platform,
      totalLimit: parsed.data.total_limit,
      initialBrief: parsed.data.initial_brief,
    })
    return Response.json({ ok: true, chat }, { status: 201 })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
