import type { MetricsAdapter, Platform, PlatformDefinition } from '../types'
import { ghlAdapter, ghlDefinition } from './ghl'
import { metaAdsAdapter, metaAdsDefinition } from './meta-ads'
import { youtubeAdapter, youtubeDefinition } from './youtube'
import { instagramAdapter, instagramDefinition } from './instagram'
import { manychatAdapter, manychatDefinition } from './manychat'

export const adapters: Record<Platform, MetricsAdapter> = {
  ghl: ghlAdapter,
  meta_ads: metaAdsAdapter,
  youtube: youtubeAdapter,
  instagram: instagramAdapter,
  manychat: manychatAdapter,
}

export const platformDefinitions: Record<Platform, PlatformDefinition> = {
  ghl: ghlDefinition,
  meta_ads: metaAdsDefinition,
  youtube: youtubeDefinition,
  instagram: instagramDefinition,
  manychat: manychatDefinition,
}

export const platformList: Platform[] = ['ghl', 'meta_ads', 'youtube', 'instagram', 'manychat']

export function getAdapter(platform: Platform): MetricsAdapter {
  return adapters[platform]
}

export function getDefinition(platform: Platform): PlatformDefinition {
  return platformDefinitions[platform]
}
