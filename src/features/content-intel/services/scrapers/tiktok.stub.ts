import { NotImplementedError } from '../../lib/errors'
import type { ScrapeInput, ScrapeResult, Scraper } from './types'

export const tiktokScraper: Scraper = {
  platform: 'tiktok',
  async fetchVideos(_input: ScrapeInput): Promise<ScrapeResult> {
    throw new NotImplementedError(
      'TikTok scraper coming in V2. MVP implementa solo Instagram.',
    )
  },
}
