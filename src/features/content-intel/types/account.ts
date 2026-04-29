import type { Platform } from './platform'

export const SYNC_STATUSES = ['idle', 'running', 'ok', 'error'] as const
export type SyncStatus = (typeof SYNC_STATUSES)[number]

export const ACCOUNT_ROLES = ['niche', 'style', 'own'] as const
export type AccountRole = (typeof ACCOUNT_ROLES)[number]

export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  niche: 'Nicho',
  style: 'Tono',
  own: 'Mía',
}

export interface SeedAccountRow {
  id: string
  platform: Platform
  handle: string
  display_name: string | null
  notes: string | null
  is_active: boolean
  is_own: boolean
  role: AccountRole
  last_synced_at: string | null
  sync_status: SyncStatus
  sync_error: string | null
  video_count: number
  created_at: string
  updated_at: string
}

export interface SeedAccountInsert {
  platform: Platform
  handle: string
  display_name?: string | null
  notes?: string | null
  is_active?: boolean
  is_own?: boolean
  role?: AccountRole
}

export interface SeedAccountUpdate {
  display_name?: string | null
  notes?: string | null
  is_active?: boolean
  last_synced_at?: string | null
  sync_status?: SyncStatus
  sync_error?: string | null
  video_count?: number
}
