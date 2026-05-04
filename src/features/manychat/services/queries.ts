import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  ManychatSubscriber,
  ManychatTag,
  ManychatCustomField,
  ManychatEvent,
  ManychatOverview,
  InboxMessage,
} from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

export async function getOverview(): Promise<ManychatOverview> {
  const supabase = await createClient()
  const now = Date.now()
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const sevenDaysAgo = new Date(now - 7 * DAY_MS).toISOString()
  const thirtyDaysAgo = new Date(now - 30 * DAY_MS).toISOString()

  const [
    totalRes,
    todayRes,
    sevenRes,
    thirtyRes,
    activeRes,
    msgs7Res,
    flows7Res,
    tagsRes,
    fieldsRes,
    eventsRes,
    connRes,
  ] = await Promise.all([
    supabase.from('manychat_subscribers_cache').select('id', { count: 'exact', head: true }),
    supabase
      .from('manychat_subscribers_cache')
      .select('id', { count: 'exact', head: true })
      .gte('subscribed_at', startOfToday),
    supabase
      .from('manychat_subscribers_cache')
      .select('id', { count: 'exact', head: true })
      .gte('subscribed_at', sevenDaysAgo),
    supabase
      .from('manychat_subscribers_cache')
      .select('id', { count: 'exact', head: true })
      .gte('subscribed_at', thirtyDaysAgo),
    supabase
      .from('manychat_subscribers_cache')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('manychat_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'message_received')
      .gte('received_at', sevenDaysAgo),
    supabase
      .from('manychat_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'flow_triggered')
      .gte('received_at', sevenDaysAgo),
    supabase.from('manychat_tags_cache').select('*'),
    supabase.from('manychat_custom_fields_cache').select('*'),
    supabase
      .from('manychat_events')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(20),
    supabase
      .from('api_connections')
      .select('last_sync_at, last_error, metadata')
      .eq('platform', 'manychat')
      .maybeSingle(),
  ])

  const tags = (tagsRes.data ?? []) as ManychatTag[]
  const events = (eventsRes.data ?? []) as ManychatEvent[]

  const tagCounts = await tagCountsQuery(supabase, tags.map(t => t.name))

  return {
    totalSubscribers: totalRes.count ?? 0,
    newToday: todayRes.count ?? 0,
    new7d: sevenRes.count ?? 0,
    new30d: thirtyRes.count ?? 0,
    activeStatus: activeRes.count ?? 0,
    messagesReceived7d: msgs7Res.count ?? 0,
    flowsTriggered7d: flows7Res.count ?? 0,
    tagsCount: tags.length,
    customFieldsCount: (fieldsRes.data ?? []).length,
    topTags: tagCounts.slice(0, 8),
    recentEvents: events,
    lastSync: connRes.data?.last_sync_at ?? null,
    igChannelActive: true,
    syncError: connRes.data?.last_error ?? null,
  }
}

type SupabaseAny = Awaited<ReturnType<typeof createClient>>

async function tagCountsQuery(
  supabase: SupabaseAny,
  tagNames: string[]
): Promise<Array<{ name: string; count: number }>> {
  if (tagNames.length === 0) return []

  const counts = await Promise.all(
    tagNames.map(async (name) => {
      const { count } = await supabase
        .from('manychat_subscribers_cache')
        .select('id', { count: 'exact', head: true })
        .contains('tags', [name])
      return { name, count: count ?? 0 }
    })
  )

  return counts.sort((a, b) => b.count - a.count)
}

export async function listSubscribers(
  options: { search?: string; tag?: string; limit?: number } = {}
): Promise<ManychatSubscriber[]> {
  const supabase = await createClient()
  const { search, tag, limit = 100 } = options

  let query = supabase
    .from('manychat_subscribers_cache')
    .select('*')
    .order('last_interaction_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (tag) {
    query = query.contains('tags', [tag])
  }

  if (search) {
    const escaped = search.replace(/[,()]/g, '')
    query = query.or(
      `name.ilike.%${escaped}%,first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,ig_username.ilike.%${escaped}%`
    )
  }

  const { data, error } = await query
  if (error) {
    console.error('listSubscribers error:', error)
    return []
  }

  return (data ?? []) as ManychatSubscriber[]
}

export async function listTags(): Promise<ManychatTag[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('manychat_tags_cache')
    .select('*')
    .order('name')
  return (data ?? []) as ManychatTag[]
}

export async function listCustomFields(): Promise<ManychatCustomField[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('manychat_custom_fields_cache')
    .select('*')
    .order('name')
  return (data ?? []) as ManychatCustomField[]
}

export async function listInbox(limit = 50): Promise<InboxMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('manychat_events')
    .select('subscriber_id, payload, received_at')
    .in('event_type', ['message_received', 'subscriber_added'])
    .order('received_at', { ascending: false })
    .limit(limit * 2)

  if (!data) return []

  const subscriberIds = Array.from(
    new Set(
      (data as Array<{ subscriber_id: string | null }>)
        .map(e => e.subscriber_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const subsMap = new Map<string, ManychatSubscriber>()
  if (subscriberIds.length > 0) {
    const { data: subs } = await supabase
      .from('manychat_subscribers_cache')
      .select('*')
      .in('id', subscriberIds)
    for (const s of (subs ?? []) as ManychatSubscriber[]) {
      subsMap.set(s.id, s)
    }
  }

  type EventRow = {
    subscriber_id: string | null
    payload: Record<string, unknown> & { text?: string; subscriber?: { last_input_text?: string } }
    received_at: string
  }

  const messages: InboxMessage[] = (data as EventRow[]).map(e => {
    const sub = e.subscriber_id ? subsMap.get(e.subscriber_id) : undefined
    const text =
      (typeof e.payload?.text === 'string' && e.payload.text) ||
      (typeof e.payload?.subscriber?.last_input_text === 'string' && e.payload.subscriber.last_input_text) ||
      sub?.last_input_text ||
      null
    return {
      subscriberId: e.subscriber_id,
      subscriberName: sub?.name ?? null,
      igUsername: sub?.ig_username ?? null,
      profilePic: sub?.profile_pic ?? null,
      text,
      receivedAt: e.received_at,
    }
  })

  // dedupe by subscriberId, keep latest
  const seen = new Set<string>()
  const dedup: InboxMessage[] = []
  for (const m of messages) {
    const key = m.subscriberId ?? `_anon_${m.receivedAt}`
    if (seen.has(key)) continue
    seen.add(key)
    dedup.push(m)
    if (dedup.length >= limit) break
  }

  return dedup
}
