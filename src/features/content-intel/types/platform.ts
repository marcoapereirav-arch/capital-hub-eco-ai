export const PLATFORMS = ['instagram', 'youtube', 'tiktok'] as const

export type Platform = (typeof PLATFORMS)[number]

export function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && (PLATFORMS as readonly string[]).includes(value)
}

export const IMPLEMENTED_PLATFORMS: readonly Platform[] = ['instagram'] as const

export function isImplementedPlatform(platform: Platform): boolean {
  return (IMPLEMENTED_PLATFORMS as readonly Platform[]).includes(platform)
}
