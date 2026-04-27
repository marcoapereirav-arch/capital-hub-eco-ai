import type { Platform } from '../types/platform'

const URL_RE = /^https?:\/\/(www\.)?(instagram\.com|youtube\.com|tiktok\.com)\/(@)?([^/?#]+).*$/i

/**
 * Normaliza el input del user a un handle canónico: lowercase, sin @, sin URL.
 * Acepta:
 *   "@pedrobuerbaum", "pedrobuerbaum", "https://instagram.com/pedrobuerbaum"
 *   "https://tiktok.com/@ramiro.cubria"
 * Devuelve: "pedrobuerbaum" | "ramiro.cubria"
 */
export function normalizeHandle(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const urlMatch = trimmed.match(URL_RE)
  if (urlMatch) {
    return urlMatch[4].toLowerCase()
  }

  return trimmed.replace(/^@+/, '').toLowerCase()
}

export function formatHandle(handle: string, platform: Platform): string {
  const clean = normalizeHandle(handle)
  switch (platform) {
    case 'instagram':
    case 'tiktok':
      return `@${clean}`
    case 'youtube':
      return clean
  }
}

export function platformUrl(handle: string, platform: Platform): string {
  const clean = normalizeHandle(handle)
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${clean}`
    case 'tiktok':
      return `https://tiktok.com/@${clean}`
    case 'youtube':
      return `https://youtube.com/@${clean}`
  }
}
