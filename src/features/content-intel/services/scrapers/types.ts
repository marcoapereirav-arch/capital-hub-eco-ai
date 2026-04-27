import type { Platform } from '../../types/platform'
import type { VideoUpsert } from '../../types/video'

export interface ScrapeInput {
  /** Handle normalizado (sin @, lowercase). */
  handle: string
  /** Máximo de videos a traer. Default suele ser MAX_VIDEOS_PER_SYNC. */
  limit?: number
}

export interface ScrapeResult {
  handle: string
  platform: Platform
  videos: Omit<VideoUpsert, 'account_id'>[]
  /** Display name detectado del perfil, si viene. */
  display_name?: string | null
  /** Handle normalizado tal como lo devuelve la fuente. */
  canonical_handle?: string
}

export interface Scraper {
  readonly platform: Platform
  fetchVideos(input: ScrapeInput): Promise<ScrapeResult>
}
