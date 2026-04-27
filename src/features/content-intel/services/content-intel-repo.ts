import type { SupabaseClient } from '@supabase/supabase-js'
import type { SeedAccountInsert, SeedAccountRow, SeedAccountUpdate, SyncStatus } from '../types/account'
import type { Platform } from '../types/platform'
import type { VideoRow, VideoUpsert } from '../types/video'

// ---------- Seed accounts ----------

export async function listAccounts(supabase: SupabaseClient): Promise<SeedAccountRow[]> {
  const { data, error } = await supabase
    .from('ci_seed_accounts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`listAccounts: ${error.message}`)
  return (data ?? []) as SeedAccountRow[]
}

export async function getAccount(
  supabase: SupabaseClient,
  id: string,
): Promise<SeedAccountRow | null> {
  const { data, error } = await supabase
    .from('ci_seed_accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`getAccount: ${error.message}`)
  return (data ?? null) as SeedAccountRow | null
}

export async function insertAccount(
  supabase: SupabaseClient,
  input: SeedAccountInsert,
): Promise<SeedAccountRow> {
  const { data, error } = await supabase
    .from('ci_seed_accounts')
    .insert({
      platform: input.platform,
      handle: input.handle,
      display_name: input.display_name ?? null,
      notes: input.notes ?? null,
      is_active: input.is_active ?? true,
    })
    .select('*')
    .single()
  if (error) throw new Error(`insertAccount: ${error.message}`)
  return data as SeedAccountRow
}

export async function updateAccount(
  supabase: SupabaseClient,
  id: string,
  patch: SeedAccountUpdate,
): Promise<SeedAccountRow> {
  const { data, error } = await supabase
    .from('ci_seed_accounts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`updateAccount: ${error.message}`)
  return data as SeedAccountRow
}

export async function deleteAccount(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('ci_seed_accounts').delete().eq('id', id)
  if (error) throw new Error(`deleteAccount: ${error.message}`)
}

export async function markSyncStatus(
  supabase: SupabaseClient,
  id: string,
  status: SyncStatus,
  extra?: { sync_error?: string | null; last_synced_at?: string | null; video_count?: number },
): Promise<void> {
  const patch: SeedAccountUpdate = { sync_status: status }
  if (extra?.sync_error !== undefined) patch.sync_error = extra.sync_error
  if (extra?.last_synced_at !== undefined) patch.last_synced_at = extra.last_synced_at
  if (extra?.video_count !== undefined) patch.video_count = extra.video_count
  const { error } = await supabase.from('ci_seed_accounts').update(patch).eq('id', id)
  if (error) throw new Error(`markSyncStatus: ${error.message}`)
}

// ---------- Videos ----------

export interface UpsertVideosResult {
  inserted: number
  updated: number
  total: number
}

export async function upsertVideos(
  supabase: SupabaseClient,
  accountId: string,
  items: Omit<VideoUpsert, 'account_id'>[],
): Promise<UpsertVideosResult> {
  if (items.length === 0) return { inserted: 0, updated: 0, total: 0 }

  const rows = items.map((v) => ({ ...v, account_id: accountId }))

  // Upsert by (platform, external_id). Supabase upsert con onConflict.
  const { data, error } = await supabase
    .from('ci_videos')
    .upsert(rows, {
      onConflict: 'platform,external_id',
      ignoreDuplicates: false,
    })
    .select('id, created_at, updated_at')

  if (error) throw new Error(`upsertVideos: ${error.message}`)

  const returned = data ?? []
  let inserted = 0
  let updated = 0
  for (const r of returned) {
    if (r.created_at === r.updated_at) inserted += 1
    else updated += 1
  }
  return { inserted, updated, total: returned.length }
}

export async function countVideosByAccount(
  supabase: SupabaseClient,
  accountId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('ci_videos')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)
  if (error) throw new Error(`countVideosByAccount: ${error.message}`)
  return count ?? 0
}

export interface ListVideosFilters {
  account_ids?: string[]
  platform?: Platform
  min_views?: number
  from?: string
  to?: string
  has_transcript?: boolean
  limit?: number
  offset?: number
  order_by?: 'views' | 'engagement_rate' | 'posted_at' | 'likes' | 'comments'
  order_dir?: 'asc' | 'desc'
}

export async function listVideos(
  supabase: SupabaseClient,
  filters: ListVideosFilters = {},
): Promise<VideoRow[]> {
  let q = supabase.from('ci_videos').select('*')

  if (filters.account_ids && filters.account_ids.length > 0) {
    q = q.in('account_id', filters.account_ids)
  }
  if (filters.platform) q = q.eq('platform', filters.platform)
  if (filters.min_views !== undefined) q = q.gte('views', filters.min_views)
  if (filters.from) q = q.gte('posted_at', filters.from)
  if (filters.to) q = q.lte('posted_at', filters.to)
  if (filters.has_transcript === true) q = q.not('transcript', 'is', null)
  if (filters.has_transcript === false) q = q.is('transcript', null)

  const orderBy = filters.order_by ?? 'views'
  const orderDir = filters.order_dir ?? 'desc'
  q = q.order(orderBy, { ascending: orderDir === 'asc', nullsFirst: false })

  const limit = filters.limit ?? 100
  const offset = filters.offset ?? 0
  q = q.range(offset, offset + limit - 1)

  const { data, error } = await q
  if (error) throw new Error(`listVideos: ${error.message}`)
  return (data ?? []) as VideoRow[]
}

export async function getVideo(
  supabase: SupabaseClient,
  id: string,
): Promise<VideoRow | null> {
  const { data, error } = await supabase
    .from('ci_videos')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`getVideo: ${error.message}`)
  return (data ?? null) as VideoRow | null
}
