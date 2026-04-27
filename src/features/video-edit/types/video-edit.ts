export const VIDEO_EDIT_STATUSES = [
  'pending',
  'uploading',
  'transcribing',
  'cutting',
  'subtitling',
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
  created_at: string
  updated_at: string
}
