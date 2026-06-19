import "server-only"

/**
 * Cliente Bunny Stream para subir vídeos de las lecciones de la App.
 *
 * Flow:
 *  1. createVideo(title) → crea entrada en Bunny library, devuelve { guid }
 *  2. uploadVideoFile(guid, file) → PUT con el binario al endpoint de upload
 *  3. getVideoStatus(guid) → poll para saber si está procesado (encoded ready)
 *  4. getHlsUrl(guid) → URL HLS playlist para el reproductor
 *
 * ENV vars (.env.local OS):
 *  - BUNNY_STREAM_API_KEY (admin API key del panel Bunny)
 *  - BUNNY_LIBRARY_ID (numero de la library)
 *  - BUNNY_CDN_HOSTNAME (hostname pull zone, ej vz-xxx.b-cdn.net)
 *
 * Doc Bunny: https://docs.bunny.net/reference/api-overview-stream
 */

const STREAM_API = "https://video.bunnycdn.com"

function getConfig() {
  const apiKey = process.env.BUNNY_STREAM_API_KEY
  const libraryId = process.env.BUNNY_LIBRARY_ID
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME
  if (!apiKey) throw new Error("BUNNY_STREAM_API_KEY no configurada")
  if (!libraryId) throw new Error("BUNNY_LIBRARY_ID no configurada")
  if (!cdnHostname) throw new Error("BUNNY_CDN_HOSTNAME no configurada")
  return { apiKey, libraryId, cdnHostname }
}

type BunnyVideo = {
  guid: string
  title: string
  status: number  // 0=queued, 1=processing, 2=encoding, 3=finished, 4=ready, 5=failed
  length: number  // segundos
  width: number
  height: number
  storageSize: number
  thumbnailFileName: string
  views: number
  dateUploaded: string
}

/**
 * Crea una nueva entry de vídeo en la library de Bunny.
 * Devuelve el guid que luego se usa para upload + playback.
 */
export async function createBunnyVideo(title: string): Promise<{ guid: string; libraryId: string }> {
  const { apiKey, libraryId } = getConfig()
  const res = await fetch(`${STREAM_API}/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      "AccessKey": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Bunny createVideo ${res.status}: ${txt}`)
  }
  const data = await res.json() as BunnyVideo
  return { guid: data.guid, libraryId }
}

/**
 * Sube el archivo de vídeo al guid creado previamente.
 * Bunny acepta cualquier formato común (mp4, mov, webm). Lo transcodea automáticamente.
 */
export async function uploadBunnyVideo(guid: string, file: Blob | Buffer): Promise<void> {
  const { apiKey, libraryId } = getConfig()
  const res = await fetch(`${STREAM_API}/library/${libraryId}/videos/${guid}`, {
    method: "PUT",
    headers: {
      "AccessKey": apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: file as BodyInit,
    duplex: "half",
  } as RequestInit)
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Bunny upload ${res.status}: ${txt}`)
  }
}

/**
 * Devuelve el estado actual del vídeo + metadata (duración, thumbnail, etc).
 * status 3 o 4 = listo para reproducir.
 */
export async function getBunnyVideoStatus(guid: string): Promise<BunnyVideo> {
  const { apiKey, libraryId } = getConfig()
  const res = await fetch(`${STREAM_API}/library/${libraryId}/videos/${guid}`, {
    headers: { "AccessKey": apiKey, "Accept": "application/json" },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Bunny getStatus ${res.status}: ${txt}`)
  }
  return await res.json() as BunnyVideo
}

/**
 * Borra un vídeo de Bunny (usado en cleanup cuando se borra una lección).
 */
export async function deleteBunnyVideo(guid: string): Promise<void> {
  const { apiKey, libraryId } = getConfig()
  await fetch(`${STREAM_API}/library/${libraryId}/videos/${guid}`, {
    method: "DELETE",
    headers: { "AccessKey": apiKey },
  })
}

/**
 * URL HLS playlist para el reproductor.
 * hls.js reproduce esto en cualquier navegador (Safari nativo, resto via JS).
 */
export function getBunnyHlsUrl(guid: string): string {
  const { cdnHostname } = getConfig()
  return `https://${cdnHostname}/${guid}/playlist.m3u8`
}

/**
 * URL del thumbnail generado por Bunny (sirve para preview en admin).
 */
export function getBunnyThumbnailUrl(guid: string): string {
  const { cdnHostname } = getConfig()
  return `https://${cdnHostname}/${guid}/thumbnail.jpg`
}

/**
 * URL del MP4 de descarga (resolución máxima encoded).
 * Para fallback si HLS falla.
 */
export function getBunnyMp4Url(guid: string, height = 720): string {
  const { cdnHostname } = getConfig()
  return `https://${cdnHostname}/${guid}/play_${height}p.mp4`
}
