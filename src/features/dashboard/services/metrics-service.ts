import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { MetricCard, PlatformStat, RevenuePoint, LeadSource } from '../types/metrics'

type CachedMetricRow = {
  platform: string
  metric_key: string
  value: number | null
  value_text: string | null
  metadata: Record<string, unknown>
  fetched_at: string
}

type ConnectionRow = {
  platform: string
  status: string
}

type TrendValue = 'up' | 'down' | 'neutral'

const platformLabel: Record<string, string> = {
  ghl: 'GHL Pipeline',
  meta_ads: 'Meta Ads',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

const KPI_SELECTION: Array<{ platform: string; key: string; titleOverride?: string }> = [
  { platform: 'instagram', key: 'followers', titleOverride: 'Seguidores IG' },
  { platform: 'ghl', key: 'leads_active', titleOverride: 'Leads Activos' },
  { platform: 'meta_ads', key: 'ad_spend', titleOverride: 'Ad Spend (Mes)' },
  { platform: 'meta_ads', key: 'roas' },
  { platform: 'ghl', key: 'pipeline_value', titleOverride: 'Pipeline' },
  { platform: 'youtube', key: 'subscribers', titleOverride: 'Suscriptores YT' },
]

export interface DashboardData {
  kpis: MetricCard[]
  platforms: PlatformStat[]
  revenue: RevenuePoint[]
  leads: LeadSource[]
  activity: Array<{ action: string; detail: string; time: string }>
  connectedPlatforms: string[]
  hasRealData: boolean
}

async function getCachedMetrics(): Promise<CachedMetricRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('metrics_cache')
    .select('platform, metric_key, value, value_text, metadata, fetched_at')

  return (data ?? []) as CachedMetricRow[]
}

async function getConnectedPlatforms(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('api_connections')
    .select('platform, status')

  const rows = (data ?? []) as ConnectionRow[]
  return rows.filter(r => r.status === 'connected').map(r => r.platform)
}

function buildKpis(metrics: CachedMetricRow[]): MetricCard[] {
  const cards: MetricCard[] = []
  for (const sel of KPI_SELECTION) {
    const row = metrics.find(m => m.platform === sel.platform && m.metric_key === sel.key)
    if (!row) continue
    const metadata = row.metadata ?? {}
    cards.push({
      id: `${sel.platform}_${sel.key}`,
      title: sel.titleOverride ?? String(metadata.label ?? sel.key),
      value: row.value_text ?? (row.value !== null ? String(row.value) : '—'),
      change: String(metadata.change ?? ''),
      trend: (metadata.trend as TrendValue) ?? 'neutral',
      source: platformLabel[sel.platform] ?? sel.platform,
    })
  }
  return cards
}

function buildPlatformStats(metrics: CachedMetricRow[]): PlatformStat[] {
  const platforms: PlatformStat[] = []
  for (const plat of ['instagram', 'youtube']) {
    const followers = metrics.find(m => m.platform === plat && (m.metric_key === 'followers' || m.metric_key === 'subscribers'))
    const engagement = metrics.find(m => m.platform === plat && m.metric_key === 'engagement_rate')
    const posts = metrics.find(m => m.platform === plat && (m.metric_key === 'posts_published' || m.metric_key === 'videos_published'))
    if (!followers) continue
    platforms.push({
      platform: plat === 'instagram' ? 'Instagram' : 'YouTube',
      followers: followers.value_text ?? '—',
      engagement: engagement?.value_text ?? '—',
      posts: posts?.value !== undefined && posts?.value !== null ? Number(posts.value) : 0,
    })
  }
  return platforms
}

export async function getDashboardData(): Promise<DashboardData> {
  const [metrics, connected] = await Promise.all([
    getCachedMetrics(),
    getConnectedPlatforms(),
  ])

  const kpis = buildKpis(metrics)
  const platforms = buildPlatformStats(metrics)

  // Solo datos reales. Sin fallback a mock. Si no hay datos, arrays vacios.
  const revenue: RevenuePoint[] = []
  const leads: LeadSource[] = []
  const activity: Array<{ action: string; detail: string; time: string }> = []

  return {
    kpis,
    platforms,
    revenue,
    leads,
    activity,
    connectedPlatforms: connected,
    hasRealData: kpis.length > 0 || platforms.length > 0,
  }
}
