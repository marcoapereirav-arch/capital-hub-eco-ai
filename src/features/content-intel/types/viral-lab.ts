import type { Platform } from './platform'

export const VIRAL_INTENTS = ['viral', 'cta', 'conexion', 'libre'] as const
export type ViralIntent = (typeof VIRAL_INTENTS)[number]

export const VIRAL_INTENT_LABELS: Record<ViralIntent, string> = {
  viral: 'Viral (sin CTA)',
  cta: 'Táctico con CTA',
  conexion: 'Conexión personal',
  libre: 'Libre (usa mi brief)',
}

export const VIRAL_INTENT_DEFAULT_DURATION: Record<ViralIntent, number> = {
  viral: 50,
  cta: 60,
  conexion: 60,
  libre: 50,
}

export const VIRAL_INTENT_DEFAULT_PILLAR: Record<ViralIntent, string> = {
  viral: 'mentalidad-disciplina',
  cta: 'mentalidad-disciplina',
  conexion: 'ser-humano-biologia',
  libre: 'libre',
}

export interface ViralLabFilters {
  account_ids?: string[]
  min_views?: number
  from_date?: string
  to_date?: string
  order_by?: 'views' | 'engagement_rate' | 'comments' | 'likes' | 'posted_at'
  top_n_per_account?: number
}

export interface ViralLabInput {
  platform: Platform
  filters: ViralLabFilters
  total_limit: number
  num_scripts: number
  intent: ViralIntent
  extra_brief?: string
}

export interface PatternCitation {
  video_id: string
  handle: string
  snippet: string
  views: number | null
}

export interface PatternGroup {
  name: string
  description: string
  examples: PatternCitation[]
  count: number
}

export interface VoiceProfile {
  total_videos_analyzed: number
  rhythm: string
  recurring_phrases: string[]
  structures: string[]
  themes: string[]
  notes: string
}

export interface PatternAnalysis {
  corpus_summary: {
    total_videos_used: number
    total_videos_requested: number
    cuentas_involved: string[]
    filter_summary: string
  }
  hooks: PatternGroup[]
  narrative_structures: PatternGroup[]
  ctas: PatternGroup[]
  aforistic_closings: PatternGroup[]
  emotional_triggers: PatternGroup[]
  voice_profile: VoiceProfile | null
}

export type AvatarFit = 'alta' | 'media' | 'baja'

export interface AngleSuggestion {
  title: string
  hook_idea: string
  why_it_works: string
  avatar_fit: AvatarFit
  suggested_intent: ViralIntent
}

// ---------- Studio Chat ----------

export type StudioIntent = 'generate' | 'angles' | 'analyze' | 'chat'

export interface StudioChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** IDs de drafts creados por la IA en este turno (si los hubo) */
  script_ids?: string[]
  /** Ángulos propuestos en este turno (si los hubo) */
  angles?: AngleSuggestion[]
  /** Análisis crudo emitido en este turno (si lo hubo) */
  analysis_md?: string
}

export interface StudioChatInput {
  filters: ViralLabFilters
  platform: Platform
  total_limit: number
  message: string
  history: StudioChatMessage[]
  /** Si el cliente cachea el análisis, lo pasa aquí para evitar re-analizar. */
  cached_analysis_md?: string | null
  cached_query_id?: string | null
}

export interface StudioChatResult {
  reply: string
  intent: StudioIntent
  analysis_md?: string
  angles?: AngleSuggestion[]
  script_ids: string[]
  query_id: string | null
  cost_usd: number
  tokens_used: number
}

export interface ViralLabResult {
  analysis_markdown: string
  angles: AngleSuggestion[]
  script_ids: string[]
  cost_usd: number
  tokens_used: number
  videos_used: number
  query_id: string | null
  reference_video_ids: string[]
}
