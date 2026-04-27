import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'video-edits'
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6 // 6 horas — para que Whisper pueda descargar

export function rawPath(id: string, ext: string = 'mp4'): string {
  return `raw/${id}.${ext}`
}

export function editedPath(id: string, ext: string = 'mp4'): string {
  return `edited/${id}.${ext}`
}

/**
 * Genera URL firmada para que el navegador suba directamente al bucket
 * sin pasar el archivo por nuestro servidor (saltando limites de Vercel).
 */
export async function createUploadUrl(
  path: string,
): Promise<{ uploadUrl: string; token: string; path: string }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: false })

  if (error || !data) {
    throw new Error(`No se pudo crear upload URL: ${error?.message ?? 'unknown'}`)
  }

  return {
    uploadUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  }
}

/**
 * Genera URL firmada para que servicios externos (Replicate Whisper)
 * puedan descargar el video desde Supabase Storage.
 */
export async function createDownloadUrl(path: string): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    throw new Error(`No se pudo crear download URL: ${error?.message ?? 'unknown'}`)
  }

  return data.signedUrl
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.error(`[storage] No se pudo borrar ${path}:`, error.message)
  }
}

export const VIDEO_EDIT_BUCKET = BUCKET
