import type { MetricsAdapter, Platform, PlatformDefinition } from '../types'
import { ghlAdapter, ghlDefinition } from './ghl'
import { metaAdsAdapter, metaAdsDefinition } from './meta-ads'
import { youtubeAdapter, youtubeDefinition } from './youtube'
import { instagramAdapter, instagramDefinition } from './instagram'

export const adapters: Record<Platform, MetricsAdapter> = {
  ghl: ghlAdapter,
  meta_ads: metaAdsAdapter,
  youtube: youtubeAdapter,
  instagram: instagramAdapter,
}

export const platformDefinitions: Record<Platform, PlatformDefinition> = {
  ghl: ghlDefinition,
  meta_ads: metaAdsDefinition,
  youtube: youtubeDefinition,
  instagram: instagramDefinition,
}

export const platformList: Platform[] = ['ghl', 'meta_ads', 'youtube', 'instagram']

export function getAdapter(platform: Platform): MetricsAdapter {
  return adapters[platform]
}

export function getDefinition(platform: Platform): PlatformDefinition {
  return platformDefinitions[platform]
}
