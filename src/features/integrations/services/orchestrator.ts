import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getAdapter } from '../adapters'
import type { Platform, ApiConnection, AdapterResult } from '../types'

export async function getConnections(): Promise<ApiConnection[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('api_connections')
    .select('*')
    .order('platform')

  if (error) {
    console.error('getConnections error:', error)
    return []
  }

  return (data ?? []) as ApiConnection[]
}

export async function getConnection(platform: Platform): Promise<ApiConnection | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('api_connections')
    .select('*')
    .eq('platform', platform)
    .maybeSingle()

  return (data ?? null) as ApiConnection | null
}

export async function syncPlatform(platform: Platform): Promise<AdapterResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      platform,
      metrics: [],
      fetchedAt: new Date().toISOString(),
      error: 'Not authenticated',
    }
  }

  const connection = await getConnection(platform)

  if (!connection || connection.status !== 'connected' || !connection.credentials) {
    return {
      platform,
      metrics: [],
      fetchedAt: new Date().toISOString(),
      error: 'Platform not connected',
    }
  }

  const adapter = getAdapter(platform)
  const result = await adapter.fetchMetrics(connection.credentials, connection.metadata)

  const now = new Date()
  const snapshotDate = now.toISOString().slice(0, 10)

  // Persist metrics_cache (upsert latest value)
  if (result.metrics.length > 0) {
    const cacheRows = result.metrics.map(m => ({
      user_id: user.id,
      platform,
      metric_key: m.key,
      value: m.value,
      value_text: m.valueText,
      metadata: { label: m.label, change: m.change, trend: m.trend },
      fetched_at: result.fetchedAt,
    }))

    await supabase
      .from('metrics_cache')
      .upsert(cacheRows, { onConflict: 'platform,metric_key' })

    // Snapshot diario
    const snapshotRows = result.metrics
      .filter(m => m.value !== null)
      .map(m => ({
        user_id: user.id,
        platform,
        metric_key: m.key,
        value: m.value,
        snapshot_date: snapshotDate,
        metadata: { label: m.label },
      }))

    if (snapshotRows.length > 0) {
      await supabase
        .from('metrics_snapshots')
        .upsert(snapshotRows, { onConflict: 'platform,metric_key,snapshot_date' })
    }
  }

  // Persist raw data (GHL opps, pipelines, contacts)
  if (result.rawData) {
    const now = new Date().toISOString()
    const { ghlPipelines, ghlOpportunities, ghlContacts } = result.rawData

    if (ghlPipelines && ghlPipelines.length > 0) {
      const rows = ghlPipelines.map(p => ({
        id: p.id,
        name: p.name,
        stages: p.stages ?? [],
        synced_at: now,
      }))
      await supabase.from('ghl_pipelines_cache').upsert(rows, { onConflict: 'id' })
    }

    if (ghlOpportunities && ghlOpportunities.length > 0) {
      const rows = ghlOpportunities.map(o => ({ ...o, synced_at: now }))
      await supabase.from('ghl_opportunities_cache').upsert(rows, { onConflict: 'id' })
    }

    if (ghlContacts && ghlContacts.length > 0) {
      const rows = ghlContacts.map(c => ({ ...c, synced_at: now }))
      await supabase.from('ghl_contacts_cache').upsert(rows, { onConflict: 'id' })
    }
  }

  // Update connection status (compartido entre admins — no filtro por user_id)
  await supabase
    .from('api_connections')
    .update({
      last_sync_at: now.toISOString(),
      last_error: result.error ?? null,
      status: result.error ? 'error' : 'connected',
      updated_at: now.toISOString(),
    })
    .eq('platform', platform)

  return result
}

export async function syncAllConnected(): Promise<AdapterResult[]> {
  const connections = await getConnections()
  const active = connections.filter(c => c.status === 'connected')

  const results = await Promise.all(
    active.map(c => syncPlatform(c.platform))
  )

  return results
}
