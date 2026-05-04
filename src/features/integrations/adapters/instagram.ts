import type { MetricsAdapter, AdapterResult, PlatformDefinition, MetricValue } from '../types'

export const instagramDefinition: PlatformDefinition = {
  platform: 'instagram',
  displayName: 'Instagram',
  description: 'Seguidores, reach, engagement y métricas de la cuenta vía Meta Graph API.',
  docsUrl: 'https://developers.facebook.com/docs/instagram-platform',
  credentialFields: [
    {
      key: 'accessToken',
      label: 'IG Access Token',
      type: 'password',
      required: true,
      helpText: 'Long-lived token (60 días) generado desde Meta Developers — flow Instagram Login.',
    },
  ],
}

const IG_API_BASE = 'https://graph.instagram.com/v22.0'

interface RawProfile {
  id: string
  username: string
  account_type: string
  media_count: number
  followers_count: number
  follows_count: number
}

interface RawInsightItem {
  name: string
  total_value?: { value: number }
  values?: Array<{ value: number }>
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat('es-ES').format(n)
}

async function igFetch<T>(path: string, token: string): Promise<T> {
  const url = `${IG_API_BASE}${path}${path.includes('?') ? '&' : '?'}access_token=${token}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`IG ${path} -> ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

export const instagramAdapter: MetricsAdapter = {
  platform: 'instagram',
  displayName: 'Instagram',

  async validateCredentials(credentials) {
    const token = credentials.accessToken as string | undefined
    if (!token) return false
    try {
      await igFetch('/me?fields=id,username', token)
      return true
    } catch {
      return false
    }
  },

  async fetchMetrics(credentials): Promise<AdapterResult> {
    const token = (credentials.accessToken as string | undefined) ?? process.env.IG_ACCESS_TOKEN

    if (!token) {
      return {
        platform: 'instagram',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: 'Missing accessToken',
      }
    }

    try {
      const profile = await igFetch<RawProfile>(
        '/me?fields=id,username,account_type,media_count,followers_count,follows_count',
        token
      )

      const since = Math.floor(Date.now() / 1000) - 30 * 86400
      const until = Math.floor(Date.now() / 1000)
      const metrics =
        'reach,views,profile_views,accounts_engaged,total_interactions,likes,comments,shares,saves'

      const insights = await igFetch<{ data: RawInsightItem[] }>(
        `/me/insights?metric=${metrics}&metric_type=total_value&period=day&since=${since}&until=${until}`,
        token
      ).catch(() => ({ data: [] as RawInsightItem[] }))

      const get = (name: string): number => {
        const item = insights.data?.find((x) => x.name === name)
        if (!item) return 0
        if (item.total_value?.value !== undefined) return item.total_value.value
        return item.values?.reduce((s, v) => s + (v.value ?? 0), 0) ?? 0
      }

      const result: MetricValue[] = [
        {
          key: 'followers',
          label: 'Seguidores',
          value: profile.followers_count,
          valueText: fmt(profile.followers_count),
        },
        {
          key: 'media_count',
          label: 'Posts publicados',
          value: profile.media_count,
          valueText: fmt(profile.media_count),
        },
        { key: 'reach_30d', label: 'Reach (30d)', value: get('reach'), valueText: fmt(get('reach')) },
        { key: 'views_30d', label: 'Vistas (30d)', value: get('views'), valueText: fmt(get('views')) },
        {
          key: 'profile_views_30d',
          label: 'Visitas al perfil (30d)',
          value: get('profile_views'),
          valueText: fmt(get('profile_views')),
        },
        {
          key: 'accounts_engaged_30d',
          label: 'Cuentas activadas (30d)',
          value: get('accounts_engaged'),
          valueText: fmt(get('accounts_engaged')),
        },
        {
          key: 'interactions_30d',
          label: 'Interacciones (30d)',
          value: get('total_interactions'),
          valueText: fmt(get('total_interactions')),
        },
        {
          key: 'likes_30d',
          label: 'Likes (30d)',
          value: get('likes'),
          valueText: fmt(get('likes')),
        },
        {
          key: 'comments_30d',
          label: 'Comentarios (30d)',
          value: get('comments'),
          valueText: fmt(get('comments')),
        },
        {
          key: 'shares_30d',
          label: 'Shares (30d)',
          value: get('shares'),
          valueText: fmt(get('shares')),
        },
        {
          key: 'saves_30d',
          label: 'Guardados (30d)',
          value: get('saves'),
          valueText: fmt(get('saves')),
        },
      ]

      return {
        platform: 'instagram',
        fetchedAt: new Date().toISOString(),
        metrics: result,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      return {
        platform: 'instagram',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: msg,
      }
    }
  },
}
