import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { runStudioChat } from '@/features/content-intel/services/viral-lab'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { PLATFORMS } from '@/features/content-intel/types/platform'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 800

const StudioChatSchema = z.object({
  platform: z.enum(PLATFORMS).optional().default('instagram'),
  filters: z
    .object({
      account_ids: z.array(z.string().uuid()).optional(),
      min_views: z.number().optional(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      order_by: z
        .enum(['views', 'engagement_rate', 'comments', 'likes', 'posted_at'])
        .optional(),
      top_n_per_account: z.number().optional(),
    })
    .optional()
    .default({}),
  total_limit: z.number().optional().default(50),
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        script_ids: z.array(z.string()).optional(),
      }),
    )
    .optional()
    .default([]),
  cached_analysis_md: z.string().nullable().optional(),
  cached_query_id: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = StudioChatSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await runStudioChat(parsed.data)
    return Response.json({ ok: true, result })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
