/**
 * Cliente Shotstack — motor de render de video (timeline → MP4).
 *
 * Docs: https://shotstack.io/docs/api/
 *
 * Dos entornos:
 *  - stage   = sandbox gratis con marca de agua (api.shotstack.io/edit/stage)
 *  - v1      = produccion, consume creditos (api.shotstack.io/edit/v1)
 *
 * Configurado via env: SHOTSTACK_API_KEY + SHOTSTACK_ENV.
 */

const SHOTSTACK_BASE_URL = 'https://api.shotstack.io/edit'

function getEnv(): { apiKey: string; env: 'stage' | 'v1' } {
  const apiKey = process.env.SHOTSTACK_API_KEY
  if (!apiKey) {
    throw new Error('SHOTSTACK_API_KEY no configurado en .env.local')
  }
  const rawEnv = process.env.SHOTSTACK_ENV ?? 'stage'
  const env = rawEnv === 'v1' || rawEnv === 'production' ? 'v1' : 'stage'
  return { apiKey, env }
}

function endpoint(path: string): string {
  const { env } = getEnv()
  return `${SHOTSTACK_BASE_URL}/${env}${path}`
}

async function shotstackRequest<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { apiKey } = getEnv()
  const { json, headers, ...rest } = init
  const res = await fetch(endpoint(path), {
    ...rest,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : (init.body as BodyInit | undefined),
  })
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }
  if (!res.ok) {
    const detail =
      parsed && typeof parsed === 'object' && parsed !== null && 'errors' in parsed
        ? JSON.stringify((parsed as { errors: unknown }).errors)
        : text
    throw new Error(`Shotstack ${res.status}: ${detail}`)
  }
  return parsed as T
}

// ============================================================================
// Tipos del API de Shotstack (subset que usamos)
// ============================================================================

export interface ShotstackFont {
  family: string
  size?: number
  color?: string
  weight?: number | string
  lineHeight?: number
}

export interface ShotstackBackground {
  color?: string
  opacity?: number
  borderRadius?: number
  padding?: number
}

export interface ShotstackTextAsset {
  type: 'text'
  text: string
  font?: ShotstackFont
  alignment?: { horizontal?: 'left' | 'center' | 'right'; vertical?: 'top' | 'center' | 'bottom' }
  background?: ShotstackBackground
  width?: number
  height?: number
  stroke?: { color?: string; width?: number }
}

export interface ShotstackVideoAsset {
  type: 'video'
  src: string
  trim?: number
  volume?: number
}

export interface ShotstackAudioAsset {
  type: 'audio'
  src: string
  volume?: number
  effect?: 'fadeIn' | 'fadeOut' | 'fadeInFadeOut'
}

export type ShotstackAsset =
  | ShotstackTextAsset
  | ShotstackVideoAsset
  | ShotstackAudioAsset

export interface ShotstackClip {
  asset: ShotstackAsset
  start: number
  length: number
  fit?: 'cover' | 'contain' | 'crop' | 'none'
  scale?: number
  position?:
    | 'top'
    | 'topRight'
    | 'right'
    | 'bottomRight'
    | 'bottom'
    | 'bottomLeft'
    | 'left'
    | 'topLeft'
    | 'center'
  offset?: { x?: number; y?: number }
  opacity?: number
  effect?: string
  transition?: { in?: string; out?: string }
}

export interface ShotstackTrack {
  clips: ShotstackClip[]
}

export interface ShotstackTimeline {
  background?: string
  tracks: ShotstackTrack[]
  fonts?: { src: string }[]
}

export interface ShotstackOutput {
  format: 'mp4' | 'gif' | 'mp3'
  resolution?: 'preview' | 'mobile' | 'sd' | 'hd' | '1080'
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5' | '4:3'
  fps?: 24 | 25 | 30 | 50 | 60
  size?: { width: number; height: number }
  quality?: 'low' | 'medium' | 'high'
}

export interface ShotstackEditPayload {
  timeline: ShotstackTimeline
  output: ShotstackOutput
  callback?: string
}

export interface ShotstackQueueResponse {
  success: boolean
  message: string
  response: { message: string; id: string }
}

export type ShotstackRenderStatus =
  | 'queued'
  | 'fetching'
  | 'rendering'
  | 'saving'
  | 'done'
  | 'failed'

export interface ShotstackRenderInfo {
  success: boolean
  message: string
  response: {
    id: string
    owner: string
    plan?: string
    status: ShotstackRenderStatus
    error?: string
    url?: string
    duration?: number
    renderTime?: number
    created: string
    updated: string
  }
}

// ============================================================================
// API pública del cliente
// ============================================================================

/**
 * Encola un render. Devuelve el render_id que luego se usa para hacer poll.
 */
export async function queueRender(payload: ShotstackEditPayload): Promise<string> {
  const data = await shotstackRequest<ShotstackQueueResponse>('/render', {
    method: 'POST',
    json: payload,
  })
  if (!data.success || !data.response?.id) {
    throw new Error(`Shotstack queue failed: ${JSON.stringify(data)}`)
  }
  return data.response.id
}

/**
 * Consulta el estado de un render. Cuando status='done' viene url con el MP4.
 */
export async function getRender(renderId: string): Promise<ShotstackRenderInfo['response']> {
  const data = await shotstackRequest<ShotstackRenderInfo>(`/render/${renderId}`, {
    method: 'GET',
  })
  return data.response
}
