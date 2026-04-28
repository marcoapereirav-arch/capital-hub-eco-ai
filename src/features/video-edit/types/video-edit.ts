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
  piece_type: 'A' | 'B' | 'C' | 'D' | null
  cta_word: string | null
  created_at: string
  updated_at: string
}

export interface VideoPresetOption {
  slug: string
  display_name: string
  description: string | null
  expected_inputs: Record<string, unknown>
  recommended_piece_types: string[]
  enabled: boolean
  implementation_status: 'ready' | 'wip' | 'pending-references' | string
}

export const PIECE_TYPE_LABELS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'A — Conexión / historia personal',
  B: 'B — CTA / conversión',
  C: 'C — Valor / enseñanza',
  D: 'D — Declaración fuerte / contrarian',
}
