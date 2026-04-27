import { NotImplementedError } from '../../lib/errors'
import type { ScrapeInput, ScrapeResult, Scraper } from './types'

export const youtubeScraper: Scraper = {
  platform: 'youtube',
  async fetchVideos(_input: ScrapeInput): Promise<ScrapeResult> {
    throw new NotImplementedError(
      'YouTube scraper coming in V2. MVP implementa solo Instagram.',
    )
  },
}
