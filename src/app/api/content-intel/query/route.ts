import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { listQueries, runCrossQuery } from '@/features/content-intel/services/cross-query'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { PLATFORMS } from '@/features/content-intel/types/platform'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180

const QuerySchema = z.object({
  prompt: z.string().min(3).max(4000),
  account_ids: z.array(z.string().uuid()).default([]),
  filters: z
    .object({
      platform: z.enum(PLATFORMS).optional().nullable(),
      min_views: z.number().int().min(0).optional().nullable(),
    })
    .optional()
    .default({}),
  max_videos: z.number().int().min(5).max(60).optional(),
  match_threshold: z.number().min(0).max(1).optional(),
})

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  try {
    const supabase = createAdminClient()
    const queries = await listQueries(supabase, 50)
    return Response.json({ ok: true, queries })
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

  const parsed = QuerySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await runCrossQuery({
      prompt: parsed.data.prompt,
      account_ids: parsed.data.account_ids,
      platform: parsed.data.filters?.platform ?? null,
      min_views: parsed.data.filters?.min_views ?? null,
      max_videos: parsed.data.max_videos,
      match_threshold: parsed.data.match_threshold,
    })
    return Response.json({
      ok: true,
      id: result.id,
      response_markdown: result.response_markdown,
      videos_used: result.videos_used,
      model: result.model,
      tokens_used: result.tokens_used,
      cost_usd: result.cost_usd,
    })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
