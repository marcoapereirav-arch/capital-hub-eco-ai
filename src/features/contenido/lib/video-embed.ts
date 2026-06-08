/**
 * Detecta el proveedor de video desde la URL y devuelve la URL de embed.
 *
 * Soporta:
 * - YouTube (youtube.com/watch?v=, youtu.be/, youtube.com/embed/)
 * - Vimeo (vimeo.com/123)
 * - Loom (loom.com/share/<id>)
 * - Google Drive (drive.google.com/file/d/<id>/...)
 * - Wistia (wistia.com/medias/<id>)
 * - Mux (stream.mux.com/<playback_id>)
 * - Genérico (mp4/webm/m4v directos)
 */

export type VideoProvider = "youtube" | "vimeo" | "loom" | "drive" | "wistia" | "mux" | "direct" | "unknown"

export type EmbedInfo = {
  provider: VideoProvider
  embedUrl: string | null
  thumbnailUrl: string | null
  isEmbeddable: boolean
}

export function detectProvider(url: string): VideoProvider {
  const u = url.toLowerCase().trim()
  if (!u) return "unknown"
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube"
  if (u.includes("vimeo.com")) return "vimeo"
  if (u.includes("loom.com")) return "loom"
  if (u.includes("drive.google.com")) return "drive"
  if (u.includes("wistia.com") || u.includes("wistia.net")) return "wistia"
  if (u.includes("stream.mux.com") || u.includes("mux.com")) return "mux"
  if (/\.(mp4|webm|m4v|mov)(\?|$)/.test(u)) return "direct"
  return "unknown"
}

export function buildEmbed(url: string): EmbedInfo {
  const provider = detectProvider(url)

  switch (provider) {
    case "youtube": {
      const id = extractYouTubeId(url)
      if (!id) return { provider, embedUrl: null, thumbnailUrl: null, isEmbeddable: false }
      return {
        provider,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        isEmbeddable: true,
      }
    }
    case "vimeo": {
      const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)?.[1]
      if (!id) return { provider, embedUrl: null, thumbnailUrl: null, isEmbeddable: false }
      return {
        provider,
        embedUrl: `https://player.vimeo.com/video/${id}`,
        thumbnailUrl: null,
        isEmbeddable: true,
      }
    }
    case "loom": {
      const id = url.match(/loom\.com\/(?:share|embed)\/([a-z0-9]+)/i)?.[1]
      if (!id) return { provider, embedUrl: null, thumbnailUrl: null, isEmbeddable: false }
      return {
        provider,
        embedUrl: `https://www.loom.com/embed/${id}`,
        thumbnailUrl: null,
        isEmbeddable: true,
      }
    }
    case "drive": {
      // drive.google.com/file/d/<id>/view  →  drive.google.com/file/d/<id>/preview
      const id = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
      if (!id) return { provider, embedUrl: null, thumbnailUrl: null, isEmbeddable: false }
      return {
        provider,
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1280`,
        isEmbeddable: true,
      }
    }
    case "wistia": {
      const id = url.match(/medias?\/([a-z0-9]+)/i)?.[1]
      if (!id) return { provider, embedUrl: null, thumbnailUrl: null, isEmbeddable: false }
      return {
        provider,
        embedUrl: `https://fast.wistia.net/embed/iframe/${id}`,
        thumbnailUrl: null,
        isEmbeddable: true,
      }
    }
    case "mux": {
      const id = url.match(/mux\.com\/([a-zA-Z0-9]+)/)?.[1]
      if (!id) return { provider, embedUrl: null, thumbnailUrl: null, isEmbeddable: false }
      return {
        provider,
        embedUrl: `https://stream.mux.com/${id}.m3u8`,
        thumbnailUrl: `https://image.mux.com/${id}/thumbnail.jpg`,
        isEmbeddable: true,
      }
    }
    case "direct":
      return { provider, embedUrl: url, thumbnailUrl: null, isEmbeddable: true }
    default:
      return { provider, embedUrl: null, thumbnailUrl: null, isEmbeddable: false }
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}
