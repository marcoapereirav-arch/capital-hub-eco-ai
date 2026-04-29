export const VIDEO_EDIT_STATUSES = [
  'pending',
  'uploading',
  'transcribing',
  'cutting',
  'subtitling',
  'rendering',
  'done',
  'error',
  'cancelled',
] as const

export type VideoEditStatus = (typeof VIDEO_EDIT_STATUSES)[number]

export const VIDEO_EDIT_STATUS_LABELS: Record<VideoEditStatus, string> = {
  pending: 'Pendiente',
  uploading: 'Subiendo',
  transcribing: 'Transcribiendo',
  cutting: 'Cortando silencios',
  subtitling: 'Subtitulando',
  rendering: 'Renderizando',
  done: 'Listo',
  error: 'Error',
  cancelled: 'Cancelado',
}

export interface WhisperWord {
  word: string
  start: number
  end: number
}

export interface WhisperTranscript {
  text: string
  language?: string
  words: WhisperWord[]
}

export type FunnelStage = 'tofu' | 'mofu' | 'bofu'
export type CtaType = 'follow' | 'freebie' | 'paid_offer'

export interface VideoEditRow {
  id: string
  user_id: string
  source_path: string
  source_filename: string | null
  edited_path: string | null
  status: VideoEditStatus
  error: string | null
  transcript: WhisperTranscript | null
  duration_seconds: number | null
  size_bytes: number | null
  preset: string
  custom_prompt: string | null
  silence_threshold_ms: number
  cost_usd: number
  shotstack_render_id: string | null
  output_url: string | null
  render_started_at: string | null
  render_completed_at: string | null
  preset_slug: string | null
  headline_text: string | null
  funnel_stage: FunnelStage | null
  cta_type: CtaType | null
  cta_word: string | null
  rotation_degrees: 0 | 90 | 180 | 270
  created_at: string
  updated_at: string
}

export interface VideoPresetOption {
  slug: string
  display_name: string
  description: string | null
  expected_inputs: Record<string, unknown>
  recommended_funnel_stages: string[]
  enabled: boolean
  implementation_status: 'ready' | 'wip' | 'pending-references' | string
}

/**
 * Framework TOFU/MOFU/BOFU — toda pieza cae en una posición del embudo.
 * Cada stage trae implícito un goal + tipo de CTA + profundidad de contenido.
 */
export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  tofu: 'TOFU — Top of funnel · views (broad)',
  mofu: 'MOFU — Middle of funnel · followers (connection)',
  bofu: 'BOFU — Bottom of funnel · leads (authority)',
}

export const FUNNEL_STAGE_DESCRIPTIONS: Record<FunnelStage, string> = {
  tofu: 'Educativo broad, fácil, repetible. Rankings, comparativas, hooks contrarian. Goal: views. CTA: follow o freebie.',
  mofu: 'Historia personal, founder story, day in the life, retos, lecciones. Goal: followers. CTA: follow.',
  bofu: 'Educativo profundo, tutoriales paso a paso, transformaciones, casos de éxito. Goal: leads. CTA: freebie o paid_offer.',
}

export const CTA_TYPE_LABELS: Record<CtaType, string> = {
  follow: 'Follow — sigue para más',
  freebie: 'Freebie — comenta palabra y te envío recurso',
  paid_offer: 'Paid offer — link a oferta de pago',
}
