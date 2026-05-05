import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10

type SubscriberPayload = {
  id?: string | number
  page_id?: string | number
  name?: string
  first_name?: string
  last_name?: string
  gender?: string
  profile_pic?: string
  locale?: string
  language?: string
  timezone?: string
  ig_username?: string
  ig_id?: string | number
  last_input_text?: string
  last_interaction?: string | number
  last_seen?: string | number
  subscribed?: string | number
  status?: string
  optin_fb?: boolean
  optin_email?: boolean
  optin_sms?: boolean
  optin_whatsapp?: boolean
  tags?: Array<string | { name: string }>
  custom_fields?: Record<string, unknown> | Array<{ name: string; value: unknown }>
}

type WebhookBody = {
  event_type?: string
  event?: string
  subscriber?: SubscriberPayload
  tag?: string
  flow?: string
  text?: string
  [key: string]: unknown
}

function toIso(value: string | number | undefined): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') {
    return new Date(value > 1e12 ? value : value * 1000).toISOString()
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeTags(tags: SubscriberPayload['tags']): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((t) => (typeof t === 'string' ? t : t?.name))
    .filter((t): t is string => typeof t === 'string')
}

function normalizeCustomFields(
  cf: SubscriberPayload['custom_fields']
): Record<string, unknown> {
  if (!cf) return {}
  if (Array.isArray(cf)) {
    const out: Record<string, unknown> = {}
    for (const item of cf) {
      if (item?.name) out[item.name] = item.value
    }
    return out
  }
  return cf
}

export async function POST(req: NextRequest) {
  const secret = process.env.MANYCHAT_WEBHOOK_SECRET
  if (!secret) {
    console.error('[manychat-webhook] MANYCHAT_WEBHOOK_SECRET not set')
    return Response.json({ ok: false, error: 'server_misconfigured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization') ?? ''
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (provided !== secret) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: WebhookBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const eventType = body.event_type ?? body.event ?? 'unknown'
  const subscriber = body.subscriber

  const supabase = createAdminClient()

  const { error: eventError } = await supabase.from('manychat_events').insert({
    subscriber_id: subscriber?.id ? String(subscriber.id) : null,
    event_type: eventType,
    payload: body as unknown as Record<string, unknown>,
  })

  if (eventError) {
    console.error('[manychat-webhook] event insert failed:', eventError)
    return Response.json(
      { ok: false, error: 'event_insert_failed', detail: eventError.message },
      { status: 500 }
    )
  }

  if (subscriber?.id) {
    const row = {
      id: String(subscriber.id),
      page_id: subscriber.page_id ? String(subscriber.page_id) : null,
      name: subscriber.name ?? null,
      first_name: subscriber.first_name ?? null,
      last_name: subscriber.last_name ?? null,
      gender: subscriber.gender ?? null,
      profile_pic: subscriber.profile_pic ?? null,
      locale: subscriber.locale ?? null,
      language: subscriber.language ?? null,
      timezone: subscriber.timezone ?? null,
      ig_username: subscriber.ig_username ?? null,
      ig_id: subscriber.ig_id ? String(subscriber.ig_id) : null,
      last_input_text: subscriber.last_input_text ?? null,
      last_interaction_at: toIso(subscriber.last_interaction),
      last_seen_at: toIso(subscriber.last_seen),
      subscribed_at: toIso(subscriber.subscribed),
      status: subscriber.status ?? null,
      optin_fb: subscriber.optin_fb ?? false,
      optin_email: subscriber.optin_email ?? false,
      optin_sms: subscriber.optin_sms ?? false,
      optin_whatsapp: subscriber.optin_whatsapp ?? false,
      tags: normalizeTags(subscriber.tags),
      custom_fields: normalizeCustomFields(subscriber.custom_fields),
      raw: subscriber as unknown as Record<string, unknown>,
      synced_at: new Date().toISOString(),
    }

    const { error: subError } = await supabase
      .from('manychat_subscribers_cache')
      .upsert(row, { onConflict: 'id' })

    if (subError) {
      console.error('[manychat-webhook] subscriber upsert failed:', subError)
      return Response.json(
        { ok: false, error: 'subscriber_upsert_failed', detail: subError.message },
        { status: 500 }
      )
    }
  }

  return Response.json({ ok: true })
}
