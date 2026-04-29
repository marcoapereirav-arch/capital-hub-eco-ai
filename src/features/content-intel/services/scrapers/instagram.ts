import { z } from 'zod'
import {
  APIFY_DEFAULT_TIMEOUT_MS,
  APIFY_FETCH_BACKOFF_MS,
  APIFY_FETCH_MAX_RETRIES,
  APIFY_IG_ACTOR,
  MAX_VIDEOS_PER_SYNC,
} from '../../constants'
import { ContentIntelError, toErrorMessage } from '../../lib/errors'
import { normalizeHandle } from '../../lib/normalize-handle'
import type { VideoUpsert } from '../../types/video'
import type { ScrapeInput, ScrapeResult, Scraper } from './types'

const APIFY_RUN_SYNC_URL = `https://api.apify.com/v2/acts/${APIFY_IG_ACTOR}/run-sync-get-dataset-items`

// Schema tolerante: Apify devuelve muchos campos variables. Solo lo que necesitamos.
const ApifyItemSchema = z
  .object({
    id: z.string().optional(),
    shortCode: z.string().optional(),
    url: z.string().optional(),
    type: z.string().optional(),
    productType: z.string().optional(),
    caption: z.string().nullable().optional(),
    timestamp: z.string().optional(),
    videoDuration: z.number().optional(),
    videoViewCount: z.number().optional(),
    videoPlayCount: z.number().optional(),
    likesCount: z.number().optional(),
    commentsCount: z.number().optional(),
    videoUrl: z.string().optional(),
    displayUrl: z.string().optional(),
    ownerUsername: z.string().optional(),
    ownerFullName: z.string().nullable().optional(),
  })
  .passthrough()

type ApifyItem = z.infer<typeof ApifyItemSchema>

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isVideoItem(item: ApifyItem): boolean {
  const type = (item.type ?? '').toLowerCase()
  if (type === 'video') return true
  if (type === 'sidecar') return Boolean(item.videoUrl)
  if (item.productType === 'clips') return true
  return Boolean(item.videoUrl)
}

function inferViews(item: ApifyItem): number | null {
  return item.videoPlayCount ?? item.videoViewCount ?? null
}

function isReel(item: ApifyItem): boolean | null {
  if (item.productType === 'clips') return true
  const type = (item.type ?? '').toLowerCase()
  if (type === 'video' && item.productType !== 'feed') return true
  return null
}

function normalizeItem(item: ApifyItem): Omit<VideoUpsert, 'account_id'> | null {
  const externalId = item.shortCode ?? item.id
  const url = item.url
  if (!externalId || !url) return null

  return {
    platform: 'instagram',
    external_id: externalId,
    url,
    caption: item.caption ?? null,
    posted_at: item.timestamp ?? null,
    duration_s: item.videoDuration ? Math.round(item.videoDuration) : null,
    views: inferViews(item),
    likes: item.likesCount ?? null,
    comments: item.commentsCount ?? null,
    is_reel: isReel(item),
    video_url: item.videoUrl ?? null,
    thumbnail_url: item.displayUrl ?? null,
    raw: item,
  }
}

async function callApify(
  token: string,
  body: Record<string, unknown>,
): Promise<unknown[]> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= APIFY_FETCH_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), APIFY_DEFAULT_TIMEOUT_MS)

      const res = await fetch(`${APIFY_RUN_SYNC_URL}?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      }).finally(() => clearTimeout(timer))

      if (res.ok) {
        const json = (await res.json()) as unknown
        if (!Array.isArray(json)) {
          throw new ContentIntelError(
            'apify_unexpected_shape',
            `Apify returned non-array: ${typeof json}`,
          )
        }
        return json
      }

      const bodyText = await res.text().catch(() => '')
      const retryable = res.status >= 500 || res.status === 429
      const err = new ContentIntelError(
        'apify_http_error',
        `Apify ${res.status}: ${bodyText.slice(0, 200)}`,
      )
      if (!retryable || attempt === APIFY_FETCH_MAX_RETRIES) throw err
      lastError = err
    } catch (err) {
      lastError = err
      const isAbort = err instanceof Error && err.name === 'AbortError'
      const retryable =
        isAbort ||
        (err instanceof ContentIntelError && err.code === 'apify_http_error') ||
        (err instanceof Error && err.name === 'TypeError')
      if (!retryable || attempt === APIFY_FETCH_MAX_RETRIES) throw err
    }

    await sleep(APIFY_FETCH_BACKOFF_MS[attempt] ?? 30_000)
  }

  throw lastError ?? new ContentIntelError('apify_exhausted', 'Retries exhausted')
}

export const instagramScraper: Scraper = {
  platform: 'instagram',

  async fetchVideos(input: ScrapeInput): Promise<ScrapeResult> {
    const token = process.env.APIFY_TOKEN
    if (!token) throw new ContentIntelError('apify_token_missing', 'APIFY_TOKEN not set')

    const handle = normalizeHandle(input.handle)
    if (!handle) throw new ContentIntelError('invalid_handle', 'Empty handle')

    const limit = Math.min(input.limit ?? MAX_VIDEOS_PER_SYNC, MAX_VIDEOS_PER_SYNC)

    const body = {
      directUrls: [`https://www.instagram.com/${handle}/`],
      resultsType: 'posts',
      resultsLimit: limit,
      addParentData: false,
      searchType: 'hashtag',
      searchLimit: 1,
    }

    let raw: unknown[]
    try {
      raw = await callApify(token, body)
    } catch (err) {
      throw new ContentIntelError(
        'apify_fetch_failed',
        `Apify scrape failed for @${handle}: ${toErrorMessage(err)}`,
        err,
      )
    }

    const parsed: ApifyItem[] = []
    for (const r of raw) {
      const p = ApifyItemSchema.safeParse(r)
      if (p.success) parsed.push(p.data)
    }

    const videoItems = parsed.filter(isVideoItem)
    const videos = videoItems
      .map(normalizeItem)
      .filter((v): v is Omit<VideoUpsert, 'account_id'> => v !== null)

    const first = parsed[0]
    return {
      handle,
      platform: 'instagram',
      videos,
      display_name: first?.ownerFullName ?? null,
      canonical_handle: first?.ownerUsername ?? handle,
    }
  },
}
