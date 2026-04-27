import type { Platform } from './platform'

export const TRANSCRIPT_STATUSES = ['pending', 'running', 'ok', 'error', 'skipped'] as const
export type TranscriptStatus = (typeof TRANSCRIPT_STATUSES)[number]

export interface VideoAnalysis {
  hook: string
  cta_type: 'none' | 'lead_magnet' | 'follow' | 'dm' | 'link_bio' | 'product' | 'engagement' | 'other'
  cta_detail: string | null
  pillars: string[]
  virality_hypothesis: string
  intent_signals_count: number
}

export interface VideoRow {
  id: string
  account_id: string
  platform: Platform
  external_id: string
  url: string
  caption: string | null
  posted_at: string | null
  duration_s: number | null
  views: number | null
  likes: number | null
  comments: number | null
  engagement_rate: number | null
  is_reel: boolean | null
  video_url: string | null
  thumbnail_url: string | null
  raw: unknown
  transcript: string | null
  transcript_language: string | null
  transcript_model: string | null
  transcript_cost_usd: number | null
  transcript_status: TranscriptStatus
  transcript_error: string | null
  transcribed_at: string | null
  analysis: VideoAnalysis | null
  analyzed_at: string | null
  embedded_at: string | null
  created_at: string
  updated_at: string
}

export interface VideoUpsert {
  account_id: string
  platform: Platform
  external_id: string
  url: string
  caption?: string | null
  posted_at?: string | null
  duration_s?: number | null
  views?: number | null
  likes?: number | null
  comments?: number | null
  is_reel?: boolean | null
  video_url?: string | null
  thumbnail_url?: string | null
  raw?: unknown
}

export interface VideoFilters {
  account_ids?: string[]
  platform?: Platform
  min_views?: number
  from?: string
  to?: string
  has_transcript?: boolean
}
