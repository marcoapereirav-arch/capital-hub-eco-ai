import type { VideoFilters } from './video'

export const QUERY_STATUSES = ['running', 'ok', 'error'] as const
export type QueryStatus = (typeof QUERY_STATUSES)[number]

export interface CrossQueryRow {
  id: string
  prompt: string
  account_ids: string[]
  filters: VideoFilters
  videos_used: string[]
  response_markdown: string | null
  model: string | null
  tokens_used: number | null
  cost_usd: number | null
  status: QueryStatus
  error: string | null
  created_at: string
}

export interface CrossQueryInput {
  prompt: string
  account_ids: string[]
  filters: VideoFilters
  max_videos?: number
}
