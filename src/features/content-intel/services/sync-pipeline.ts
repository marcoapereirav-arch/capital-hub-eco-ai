import { createAdminClient } from '@/lib/supabase/admin'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import {
  countVideosByAccount,
  getAccount,
  markSyncStatus,
  updateAccount,
  upsertVideos,
} from './content-intel-repo'
import { getScraper } from './scrapers'

export interface SyncAccountResult {
  account_id: string
  handle: string
  platform: string
  inserted: number
  updated: number
  total_scraped: number
  total_in_db: number
}

/**
 * Sincroniza todos los videos públicos de una cuenta semilla.
 * Idempotente: upsert por (platform, external_id).
 * Actualiza sync_status en la row para que la UI pueda mostrar progreso.
 */
export async function syncAccount(accountId: string): Promise<SyncAccountResult> {
  const supabase = createAdminClient()

  const account = await getAccount(supabase, accountId)
  if (!account) throw new ContentIntelError('account_not_found', `Account ${accountId} not found`)

  if (!account.is_active) {
    throw new ContentIntelError('account_inactive', `Account @${account.handle} is paused`)
  }

  await markSyncStatus(supabase, accountId, 'running', { sync_error: null })

  try {
    const scraper = getScraper(account.platform)
    const result = await scraper.fetchVideos({ handle: account.handle })

    const upsertResult = await upsertVideos(supabase, accountId, result.videos)
    const totalInDb = await countVideosByAccount(supabase, accountId)

    const patch = {
      sync_status: 'ok' as const,
      sync_error: null,
      last_synced_at: new Date().toISOString(),
      video_count: totalInDb,
      ...(result.display_name && !account.display_name ? { display_name: result.display_name } : {}),
    }
    await updateAccount(supabase, accountId, patch)

    return {
      account_id: accountId,
      handle: account.handle,
      platform: account.platform,
      inserted: upsertResult.inserted,
      updated: upsertResult.updated,
      total_scraped: result.videos.length,
      total_in_db: totalInDb,
    }
  } catch (err) {
    const message = toErrorMessage(err)
    await markSyncStatus(supabase, accountId, 'error', { sync_error: message })
    throw err
  }
}
