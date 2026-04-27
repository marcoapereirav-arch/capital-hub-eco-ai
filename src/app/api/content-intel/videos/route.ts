import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { listVideos, type ListVideosFilters } from '@/features/content-intel/services/content-intel-repo'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { isPlatform } from '@/features/content-intel/types/platform'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const url = new URL(req.url)
  const params = url.searchParams

  const filters: ListVideosFilters = {}

  const accountIds = params.get('account_ids')
  if (accountIds) {
    filters.account_ids = accountIds.split(',').filter(Boolean)
  }

  const platform = params.get('platform')
  if (platform && isPlatform(platform)) filters.platform = platform

  const minViews = params.get('min_views')
  if (minViews) {
    const n = Number(minViews)
    if (Number.isFinite(n) && n >= 0) filters.min_views = Math.floor(n)
  }

  const from = params.get('from')
  if (from) filters.from = from
  const to = params.get('to')
  if (to) filters.to = to

  const hasTranscript = params.get('has_transcript')
  if (hasTranscript === 'true') filters.has_transcript = true
  if (hasTranscript === 'false') filters.has_transcript = false

  const orderBy = params.get('order_by')
  const validOrderBy = ['views', 'engagement_rate', 'posted_at', 'likes', 'comments'] as const
  if (orderBy && (validOrderBy as readonly string[]).includes(orderBy)) {
    filters.order_by = orderBy as (typeof validOrderBy)[number]
  }

  const orderDir = params.get('order_dir')
  if (orderDir === 'asc' || orderDir === 'desc') filters.order_dir = orderDir

  const limit = params.get('limit')
  if (limit) {
    const n = Number(limit)
    if (Number.isFinite(n) && n > 0) filters.limit = Math.min(500, Math.floor(n))
  }

  const offset = params.get('offset')
  if (offset) {
    const n = Number(offset)
    if (Number.isFinite(n) && n >= 0) filters.offset = Math.floor(n)
  }

  try {
    const supabase = createAdminClient()
    const videos = await listVideos(supabase, filters)
    return Response.json({ ok: true, videos })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
