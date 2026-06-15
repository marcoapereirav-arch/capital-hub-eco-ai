import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * Webhook entrante ManyChat.
 *
 * Flujo completo end-to-end:
 *   1. new_subscriber (nuevo follower IG) → crea contacto stage='nuevo_seguidor'
 *      asigna pipeline_id default + tag 'origen:instagram_follow' + journey event
 *   2. user_replied_to_welcome (responde al welcome del bot) → mueve stage a 'conversacion'
 *      anade journey event "Lead respondio al welcome"
 *
 * Cada evento se loguea en manychat_events para auditoria.
 * Los flows en panel ManyChat envian event_type explicito en el body.
 */

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

/** Devuelve el pipeline_id del pipeline marcado como is_default. */
async function getDefaultPipelineId(supabase: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const { data } = await supabase.from('pipelines').select('id').eq('is_default', true).maybeSingle()
  return data?.id ?? null
}

/** Crea (o devuelve si ya existe) un tag por nombre y devuelve su id. */
async function ensureTag(
  supabase: ReturnType<typeof createAdminClient>,
  name: string,
  color = '#ec4899',
): Promise<string | null> {
  const { data: existing } = await supabase.from('tags').select('id').eq('name', name).maybeSingle()
  if (existing?.id) return existing.id
  const { data: created, error } = await supabase
    .from('tags').insert({ name, color }).select('id').single()
  if (error) {
    if (error.code === '23505') {
      const { data: again } = await supabase.from('tags').select('id').eq('name', name).maybeSingle()
      return again?.id ?? null
    }
    console.error('[manychat-webhook] ensureTag failed:', error.message)
    return null
  }
  return created.id
}

async function assignTagToContact(
  supabase: ReturnType<typeof createAdminClient>,
  contactId: string,
  tagId: string,
): Promise<void> {
  await supabase.from('contact_tags').insert({ contact_id: contactId, tag_id: tagId }).select('*').maybeSingle()
}

async function addJourneyEvent(
  supabase: ReturnType<typeof createAdminClient>,
  contactId: string,
  type: string,
  title: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from('contact_journey_events').insert({ contact_id: contactId, type, title, data })
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

  // ---------- 1. Log crudo de auditoria ----------
  await supabase.from('manychat_events').insert({
    subscriber_id: subscriber?.id ? String(subscriber.id) : null,
    event_type: eventType,
    payload: body as unknown as Record<string, unknown>,
  })

  if (!subscriber?.id) {
    return Response.json({ ok: true, note: 'event logged without subscriber' })
  }

  // ---------- 2. Upsert subscriber cache ----------
  const subRow = {
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
  await supabase.from('manychat_subscribers_cache').upsert(subRow, { onConflict: 'id' })

  const mcId = String(subscriber.id)
  const igUsername = subscriber.ig_username ?? null
  const fullName =
    subscriber.name ??
    [subscriber.first_name, subscriber.last_name].filter(Boolean).join(' ') ??
    null

  // ---------- 3. Buscar contacto existente (por mc_id o ig_username) ----------
  let { data: contact } = await supabase
    .from('contacts')
    .select('id, stage, pipeline_id')
    .eq('manychat_subscriber_id', mcId)
    .maybeSingle()

  if (!contact && igUsername) {
    const { data: byIg } = await supabase
      .from('contacts')
      .select('id, stage, pipeline_id')
      .eq('instagram_username', igUsername)
      .maybeSingle()
    if (byIg) {
      contact = byIg
      // Vincular manychat_subscriber_id que no estaba
      await supabase.from('contacts').update({ manychat_subscriber_id: mcId }).eq('id', byIg.id)
    }
  }

  // ---------- 4. Routing por event_type ----------
  switch (eventType) {
    case 'new_subscriber':
    case 'new_follower':
    case 'subscribed': {
      if (!contact) {
        const defaultPipelineId = await getDefaultPipelineId(supabase)
        const { data: created, error: cErr } = await supabase
          .from('contacts')
          .insert({
            full_name: fullName ?? igUsername ?? `Lead ${mcId}`,
            manychat_subscriber_id: mcId,
            instagram_username: igUsername,
            stage: 'nuevo_seguidor',
            pipeline_id: defaultPipelineId,
            origin: 'manychat',
          })
          .select('id')
          .single()

        if (cErr) {
          console.error('[manychat-webhook] insert contact failed:', cErr.message)
          break
        }

        // Auto-tag origen
        const tagId = await ensureTag(supabase, 'origen:instagram_follow', '#ec4899')
        if (tagId) await assignTagToContact(supabase, created.id, tagId)

        await addJourneyEvent(
          supabase,
          created.id,
          'manychat_new_follower',
          `Empezó a seguir en Instagram (@${igUsername ?? 'sin_username'})`,
          { subscriber_id: mcId, ig_username: igUsername },
        )
      }
      break
    }

    case 'user_replied_to_welcome':
    case 'user_replied':
    case 'subscriber_replied': {
      // Si todavia no tenemos el contacto y llega un reply → algo se perdio, crearlo
      if (!contact) {
        const defaultPipelineId = await getDefaultPipelineId(supabase)
        const { data: created } = await supabase
          .from('contacts')
          .insert({
            full_name: fullName ?? igUsername ?? `Lead ${mcId}`,
            manychat_subscriber_id: mcId,
            instagram_username: igUsername,
            stage: 'conversacion',
            pipeline_id: defaultPipelineId,
            origin: 'manychat',
          })
          .select('id, stage, pipeline_id')
          .single()
        if (created) contact = created
      } else if (contact.stage === 'nuevo_seguidor') {
        // Solo subir el stage si esta en nuevo_seguidor (no degradar)
        await supabase.from('contacts').update({ stage: 'conversacion' }).eq('id', contact.id)
      }

      if (contact) {
        await addJourneyEvent(
          supabase,
          contact.id,
          'manychat_user_reply',
          'Lead respondió al welcome del bot · stage → Conversación',
          { subscriber_id: mcId, text: body.text ?? null },
        )
      }
      break
    }

    default: {
      // Evento desconocido: solo queda logueado (manychat_events) por si lo queremos mapear despues.
      break
    }
  }

  return Response.json({ ok: true })
}
