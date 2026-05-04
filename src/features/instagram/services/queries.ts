import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getLiveInsights, getFollowerDemographics } from './meta-graph'
import type { IgAccount, IgPost, IgOverview } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

export async function getOwnAccount(): Promise<IgAccount | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ci_seed_accounts')
    .select('id, handle, display_name, video_count, last_synced_at')
    .eq('platform', 'instagram')
    .eq('is_own', true)
    .order('last_synced_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as IgAccount | null
}

export async function getRecentPosts(accountId: string, limit = 24): Promise<IgPost[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ci_videos')
    .select(
      'id, external_id, url, caption, posted_at, duration_s, views, likes, comments, engagement_rate, is_reel, thumbnail_url'
    )
    .eq('account_id', accountId)
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(limit)
  return (data ?? []) as IgPost[]
}

export async function getTopPerformer(accountId: string): Promise<IgPost | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ci_videos')
    .select(
      'id, external_id, url, caption, posted_at, duration_s, views, likes, comments, engagement_rate, is_reel, thumbnail_url'
    )
    .eq('account_id', accountId)
    .order('views', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as IgPost | null
}

export async function getOverview(): Promise<IgOverview> {
  const account = await getOwnAccount()
  const metaGraphReady = Boolean(process.env.IG_ACCESS_TOKEN)

  if (!account) {
    const [live, demographics] = await Promise.all([
      getLiveInsights(),
      getFollowerDemographics(),
    ])
    return {
      account: null,
      totalPosts: 0,
      totalReels: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      avgEngagement: 0,
      posts7d: 0,
      posts30d: 0,
      topReel: null,
      recentPosts: [],
      metaGraphReady,
      live,
      demographics,
    }
  }

  const supabase = await createClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString()

  const [
    totalsRes,
    reelsCountRes,
    posts7Res,
    posts30Res,
    topReel,
    recentPosts,
    live,
    demographics,
  ] = await Promise.all([
    supabase
      .from('ci_videos')
      .select('views, likes, comments, engagement_rate', { count: 'exact' })
      .eq('account_id', account.id),
    supabase
      .from('ci_videos')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .eq('is_reel', true),
    supabase
      .from('ci_videos')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .gte('posted_at', sevenDaysAgo),
    supabase
      .from('ci_videos')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .gte('posted_at', thirtyDaysAgo),
    getTopPerformer(account.id),
    getRecentPosts(account.id, 12),
    getLiveInsights(),
    getFollowerDemographics(),
  ])

  type Row = { views: number | null; likes: number | null; comments: number | null; engagement_rate: number | null }
  const rows = (totalsRes.data ?? []) as Row[]

  const totalViews = rows.reduce((s, r) => s + (Number(r.views) || 0), 0)
  const totalLikes = rows.reduce((s, r) => s + (Number(r.likes) || 0), 0)
  const totalComments = rows.reduce((s, r) => s + (Number(r.comments) || 0), 0)
  const engagementValues = rows
    .map(r => Number(r.engagement_rate))
    .filter(v => Number.isFinite(v) && v > 0)
  const avgEngagement =
    engagementValues.length > 0
      ? engagementValues.reduce((s, v) => s + v, 0) / engagementValues.length
      : 0

  return {
    account,
    totalPosts: totalsRes.count ?? 0,
    totalReels: reelsCountRes.count ?? 0,
    totalViews,
    totalLikes,
    totalComments,
    avgEngagement,
    posts7d: posts7Res.count ?? 0,
    posts30d: posts30Res.count ?? 0,
    topReel,
    recentPosts,
    metaGraphReady,
    live,
    demographics,
  }
}
