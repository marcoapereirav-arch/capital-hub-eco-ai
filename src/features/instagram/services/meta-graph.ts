import 'server-only'

const IG_API_BASE = 'https://graph.instagram.com/v22.0'

function getCredentials() {
  const token = process.env.IG_ACCESS_TOKEN
  if (!token) return null
  return token
}

async function igFetch<T>(path: string): Promise<T> {
  const token = getCredentials()
  if (!token) throw new Error('IG_ACCESS_TOKEN not set')

  const url = path.includes('access_token=')
    ? `${IG_API_BASE}${path}`
    : `${IG_API_BASE}${path}${path.includes('?') ? '&' : '?'}access_token=${token}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`IG ${path} -> ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

export interface IgProfile {
  id: string
  username: string
  account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR' | 'MEDIA_CREATOR'
  media_count: number
  followers_count: number
  follows_count: number
  biography?: string
  profile_picture_url?: string
}

export async function getProfile(): Promise<IgProfile | null> {
  if (!getCredentials()) return null
  try {
    return await igFetch<IgProfile>(
      '/me?fields=id,username,account_type,media_count,followers_count,follows_count,biography,profile_picture_url'
    )
  } catch (e) {
    console.error('IG getProfile error:', e)
    return null
  }
}

interface RawInsightItem {
  name: string
  period: string
  values: Array<{ value: number; end_time?: string }>
  total_value?: { value: number }
  title?: string
}

export interface IgLiveInsights {
  reach30d: number
  views30d: number
  profileViews30d: number
  accountsEngaged30d: number
  totalInteractions30d: number
  likes30d: number
  comments30d: number
  shares30d: number
  saves30d: number
  followerCount: number | null
}

export async function getLiveInsights(): Promise<IgLiveInsights | null> {
  if (!getCredentials()) return null
  try {
    const since = Math.floor(Date.now() / 1000) - 30 * 86400
    const until = Math.floor(Date.now() / 1000)

    const metrics = [
      'reach',
      'views',
      'profile_views',
      'accounts_engaged',
      'total_interactions',
      'likes',
      'comments',
      'shares',
      'saves',
    ].join(',')

    const data = await igFetch<{ data: RawInsightItem[] }>(
      `/me/insights?metric=${metrics}&metric_type=total_value&period=day&since=${since}&until=${until}`
    )

    const get = (name: string): number => {
      const item = data.data?.find((x) => x.name === name)
      if (!item) return 0
      if (item.total_value?.value !== undefined) return item.total_value.value
      return item.values?.reduce((s, v) => s + (v.value ?? 0), 0) ?? 0
    }

    let followerCount: number | null = null
    try {
      const profile = await getProfile()
      followerCount = profile?.followers_count ?? null
    } catch {
      followerCount = null
    }

    return {
      reach30d: get('reach'),
      views30d: get('views'),
      profileViews30d: get('profile_views'),
      accountsEngaged30d: get('accounts_engaged'),
      totalInteractions30d: get('total_interactions'),
      likes30d: get('likes'),
      comments30d: get('comments'),
      shares30d: get('shares'),
      saves30d: get('saves'),
      followerCount,
    }
  } catch (e) {
    console.error('IG getLiveInsights error:', e)
    return null
  }
}

export interface IgFollowerDemographics {
  byCountry: Array<{ key: string; value: number }>
  byCity: Array<{ key: string; value: number }>
  byAge: Array<{ key: string; value: number }>
  byGender: Array<{ key: string; value: number }>
}

export async function getFollowerDemographics(): Promise<IgFollowerDemographics | null> {
  if (!getCredentials()) return null
  try {
    const breakdowns = ['country', 'city', 'age', 'gender']
    const responses = await Promise.all(
      breakdowns.map((b) =>
        igFetch<{
          data: Array<{
            total_value: {
              breakdowns?: Array<{
                results: Array<{ dimension_values: string[]; value: number }>
              }>
            }
          }>
        }>(
          `/me/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=${b}&timeframe=this_month`
        ).catch(() => null)
      )
    )

    const parse = (raw: typeof responses[number]) => {
      const item = raw?.data?.[0]
      const breakdownData = item?.total_value?.breakdowns?.[0]?.results ?? []
      return breakdownData
        .map((r) => ({ key: r.dimension_values?.[0] ?? '?', value: r.value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    }

    return {
      byCountry: parse(responses[0]),
      byCity: parse(responses[1]),
      byAge: parse(responses[2]),
      byGender: parse(responses[3]),
    }
  } catch (e) {
    console.error('IG getFollowerDemographics error:', e)
    return null
  }
}

export interface IgMediaItem {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  permalink: string
  thumbnail_url?: string
  media_url: string
  caption?: string
  timestamp: string
  like_count: number
  comments_count: number
}

export async function listMedia(limit = 24): Promise<IgMediaItem[]> {
  if (!getCredentials()) return []
  try {
    const data = await igFetch<{ data: IgMediaItem[] }>(
      `/me/media?fields=id,media_type,permalink,thumbnail_url,media_url,caption,timestamp,like_count,comments_count&limit=${limit}`
    )
    return data.data ?? []
  } catch (e) {
    console.error('IG listMedia error:', e)
    return []
  }
}

export interface IgMediaInsights {
  mediaId: string
  views: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  totalInteractions: number
}

export async function getMediaInsights(mediaId: string): Promise<IgMediaInsights | null> {
  if (!getCredentials()) return null
  try {
    const metrics = 'views,reach,likes,comments,shares,saves,total_interactions'
    const data = await igFetch<{ data: RawInsightItem[] }>(
      `/${mediaId}/insights?metric=${metrics}`
    )
    const get = (name: string): number => {
      const item = data.data?.find((x) => x.name === name)
      return item?.values?.[0]?.value ?? 0
    }
    return {
      mediaId,
      views: get('views'),
      reach: get('reach'),
      likes: get('likes'),
      comments: get('comments'),
      shares: get('shares'),
      saves: get('saves'),
      totalInteractions: get('total_interactions'),
    }
  } catch (e) {
    console.error('IG getMediaInsights error:', e)
    return null
  }
}

export interface IgPublishOptions {
  mediaUrl: string
  caption?: string
  mediaType: 'REELS' | 'IMAGE' | 'STORIES'
}

export interface IgPublishResult {
  ok: boolean
  mediaId?: string
  containerId?: string
  error?: string
}

export async function publishMedia(opts: IgPublishOptions): Promise<IgPublishResult> {
  const token = getCredentials()
  if (!token) return { ok: false, error: 'IG_ACCESS_TOKEN not set' }

  try {
    const params = new URLSearchParams({
      access_token: token,
      caption: opts.caption ?? '',
    })

    if (opts.mediaType === 'REELS') {
      params.set('media_type', 'REELS')
      params.set('video_url', opts.mediaUrl)
    } else if (opts.mediaType === 'STORIES') {
      params.set('media_type', 'STORIES')
      const isVideo = /\.(mp4|mov|m4v)(\?|$)/i.test(opts.mediaUrl)
      if (isVideo) params.set('video_url', opts.mediaUrl)
      else params.set('image_url', opts.mediaUrl)
    } else {
      params.set('image_url', opts.mediaUrl)
    }

    const containerRes = await fetch(`${IG_API_BASE}/me/media`, {
      method: 'POST',
      body: params,
    })
    if (!containerRes.ok) {
      const body = await containerRes.text().catch(() => '')
      return { ok: false, error: `container creation failed: ${body.slice(0, 200)}` }
    }
    const container = (await containerRes.json()) as { id: string }
    const containerId = container.id

    let attempts = 0
    let status = 'IN_PROGRESS'
    while (attempts < 30 && status === 'IN_PROGRESS') {
      await new Promise((r) => setTimeout(r, 2000))
      const statusRes = await fetch(
        `${IG_API_BASE}/${containerId}?fields=status_code&access_token=${token}`,
        { cache: 'no-store' }
      )
      const sj = (await statusRes.json()) as { status_code: string }
      status = sj.status_code
      attempts++
    }

    if (status !== 'FINISHED') {
      return { ok: false, containerId, error: `container status: ${status}` }
    }

    const publishRes = await fetch(`${IG_API_BASE}/me/media_publish`, {
      method: 'POST',
      body: new URLSearchParams({
        access_token: token,
        creation_id: containerId,
      }),
    })
    if (!publishRes.ok) {
      const body = await publishRes.text().catch(() => '')
      return { ok: false, containerId, error: `publish failed: ${body.slice(0, 200)}` }
    }
    const publishJson = (await publishRes.json()) as { id: string }
    return { ok: true, mediaId: publishJson.id, containerId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
