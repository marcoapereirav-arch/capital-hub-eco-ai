import type { Platform } from '../../types/platform'
import { instagramScraper } from './instagram'
import { tiktokScraper } from './tiktok.stub'
import type { Scraper } from './types'
import { youtubeScraper } from './youtube.stub'

const scrapers: Record<Platform, Scraper> = {
  instagram: instagramScraper,
  youtube: youtubeScraper,
  tiktok: tiktokScraper,
}

export function getScraper(platform: Platform): Scraper {
  const scraper = scrapers[platform]
  if (!scraper) {
    throw new Error(`No scraper registered for platform: ${platform}`)
  }
  return scraper
}

export type { Scraper } from './types'
