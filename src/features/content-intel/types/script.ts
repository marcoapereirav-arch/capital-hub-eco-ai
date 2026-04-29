import type { Platform } from './platform'

export const SCRIPT_STATUSES = [
  'draft',
  'ready',
  'recorded',
  'published',
  'archived',
] as const
export type ScriptStatus = (typeof SCRIPT_STATUSES)[number]

export const SCRIPT_STATUS_LABELS: Record<ScriptStatus, string> = {
  draft: 'Pendiente',
  ready: 'Pendiente',
  recorded: 'Grabado',
  published: 'Publicado',
  archived: 'Archivado',
}

export const CONTENT_PILLARS = [
  'mentalidad-disciplina',
  'ser-humano-biologia',
  'transurfing-espiritualidad',
  'libre',
] as const
export type ContentPillar = (typeof CONTENT_PILLARS)[number]

export interface ScriptOutput {
  title: string
  hook_variants: string[]
  body: string
  beats: { label: string; text: string }[]
  cta: string
  production_notes: string
  duration_estimate_s: number
  references_used: { video_id: string; reason: string }[]
}

export interface ScriptRow {
  id: string
  brief: string
  platform: Platform
  duration_target_s: number | null
  content_pillar: ContentPillar | string | null
  reference_video_ids: string[]
  playbook_snapshot_text: string | null
  playbook_snapshot_hash: string | null
  avatar_snapshot_text: string | null
  avatar_snapshot_hash: string | null
  prompt_used: string | null
  llm_output: ScriptOutput | null
  llm_output_markdown: string | null
  user_edited_markdown: string | null
  status: ScriptStatus
  model: string | null
  tokens_used: number | null
  cost_usd: number | null
  created_at: string
  updated_at: string
}

export interface ScriptGenerateInput {
  brief: string
  platform: Platform
  duration_target_s?: number
  content_pillar?: ContentPillar | string
  reference_video_ids?: string[]
}
