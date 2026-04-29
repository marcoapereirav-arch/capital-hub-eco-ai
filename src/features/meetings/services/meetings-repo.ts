import type { SupabaseClient } from '@supabase/supabase-js'
import slugify from 'slugify'
import type { ClassificationResult } from '../types/classification'
import type { NormalizedMeeting } from '../types/fathom'
import type { ContactRow, MeetingRow, ResolvedParticipant } from '../types/meeting'
import { resolveParticipants } from './matcher'

export interface UpsertResult {
  meeting: MeetingRow
  wasNew: boolean
  participants: ResolvedParticipant[]
}

/**
 * Upsert idempotente de toda la meeting + participants + team_attendees.
 * Si fathom_meeting_id ya existe → devuelve el row existente, wasNew=false.
 * Secuencial (no transaccional). El único row crítico es meetings: si existe,
 * todo lo demás se re-derivan desde el mismo payload (operaciones idempotentes).
 */
export async function upsertMeeting(
  supabase: SupabaseClient,
  input: {
    normalized: NormalizedMeeting
    classification: ClassificationResult
  },
): Promise<UpsertResult> {
  const { normalized: n, classification: c } = input
  const fathomId = String(n.recording_id)

  // 1) meetings — upsert con ON CONFLICT DO NOTHING + select para idempotencia
  const existing = await supabase
    .from('meetings')
    .select('*')
    .eq('fathom_meeting_id', fathomId)
    .maybeSingle()

  if (existing.error) throw new Error(`meetings select: ${existing.error.message}`)

  let meetingRow: MeetingRow
  let wasNew = false

  if (existing.data) {
    meetingRow = existing.data as MeetingRow
  } else {
    const insert = await supabase
      .from('meetings')
      .insert({
        fathom_meeting_id: fathomId,
        title: n.title,
        started_at: n.started_at,
        ended_at: n.ended_at,
        duration_seconds: n.duration_seconds,
        fathom_share_url: n.share_url,
        fathom_recording_url: n.recording_url,
        scope: c.scope,
        tipo: c.tipo,
        resultado: c.resultado,
        funnel_stage: c.funnel_stage,
        resumen: c.resumen,
        action_items: c.action_items,
        decisiones: c.decisiones,
        transcript_raw: n.transcript_text,
        transcript_language: n.transcript_language,
        status: 'classifying',
      })
      .select('*')
      .single()

    if (insert.error) throw new Error(`meetings insert: ${insert.error.message}`)
    meetingRow = insert.data as MeetingRow
    wasNew = true
  }

  // 2) Resolver participants
  const resolvedParticipants = await resolveParticipants(supabase, c)

  // 3) Upsert contacts nuevos si match_method === 'none'
  for (const p of resolvedParticipants) {
    if (!p.team_member_id && p.contact_id === null) {
      const contact = await createContactForParticipant(supabase, p)
      if (contact) {
        p.contact_id = contact.id
        // un contacto recién creado por nombre/email => tratamos como auto_email si había email, si no unmatched.
        p.match_status = p.raw_email ? 'auto_email' : 'unmatched'
      }
    }
  }

  // 4) Insertar meeting_participants (externos)
  const externals = resolvedParticipants.filter((p) => !p.team_member_id)
  if (externals.length > 0) {
    const rows = externals.map((p) => ({
      meeting_id: meetingRow.id,
      contact_id: p.contact_id,
      match_status: p.match_status,
      match_score: p.match_score,
      role: p.role,
      raw_name: p.raw_name,
      raw_email: p.raw_email,
    }))
    // upsert idempotente contra meeting_participants_unique_idx (meeting_id, contact_id_coalesce, raw_email_coalesce).
    // Supabase JS usa unique constraints. Sin constraint named, usamos insert con ignore errors por duplicate.
    const { error } = await supabase.from('meeting_participants').insert(rows)
    if (error && !isUniqueViolation(error)) {
      throw new Error(`meeting_participants insert: ${error.message}`)
    }
  }

  // 5) Insertar meeting_team_attendees
  const teamAttendees = resolvedParticipants.filter((p) => p.team_member_id)
  if (teamAttendees.length > 0) {
    const rows = teamAttendees.map((p) => ({
      meeting_id: meetingRow.id,
      team_member_id: p.team_member_id!,
    }))
    const { error } = await supabase.from('meeting_team_attendees').insert(rows)
    if (error && !isUniqueViolation(error)) {
      throw new Error(`meeting_team_attendees insert: ${error.message}`)
    }
  }

  return { meeting: meetingRow, wasNew, participants: resolvedParticipants }
}

async function createContactForParticipant(
  supabase: SupabaseClient,
  p: ResolvedParticipant,
): Promise<ContactRow | null> {
  const baseSlug = slugify(p.raw_name, { lower: true, strict: true, locale: 'es' })
  if (!baseSlug) return null

  const stageByRole: Record<string, string> = {
    primary: 'lead',
    decision_maker: 'prospect',
    gatekeeper: 'prospect',
    participant: 'lead',
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        full_name: p.raw_name,
        email: p.raw_email,
        stage: stageByRole[p.role] ?? 'lead',
        slug,
        tags: [],
      })
      .select('*')
      .single()

    if (!error && data) return data as ContactRow

    // Unique violation por slug o por email → reintentar con nuevo slug o matchear existente
    if (isUniqueViolation(error)) {
      // Si fue por email único, intentar encontrar el contacto existente
      if (p.raw_email) {
        const { data: existing } = await supabase
          .from('contacts')
          .select('*')
          .ilike('email', p.raw_email)
          .maybeSingle()
        if (existing) return existing as ContactRow
      }
      // Si fue por slug, el loop intenta con sufijo
      continue
    }
    if (error) {
      console.error('[contacts] insert error', error)
      return null
    }
  }

  return null
}

export async function markMeetingStatus(
  supabase: SupabaseClient,
  meetingId: string,
  status: 'pending' | 'fetching' | 'classifying' | 'writing' | 'processed' | 'failed',
  extras?: { processing_error?: string; markdown_path?: string; processed_at?: string | null },
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (extras?.processing_error !== undefined) patch.processing_error = extras.processing_error
  if (extras?.markdown_path !== undefined) patch.markdown_path = extras.markdown_path
  if (status === 'processed') patch.processed_at = extras?.processed_at ?? new Date().toISOString()
  const { error } = await supabase.from('meetings').update(patch).eq('id', meetingId)
  if (error) throw new Error(`markMeetingStatus: ${error.message}`)
}

type MaybePgErr = { code?: string; message?: string } | null | undefined

function isUniqueViolation(err: MaybePgErr): boolean {
  if (!err) return false
  // Postgres unique_violation code = 23505
  if (err.code === '23505') return true
  const msg = err.message ?? ''
  return msg.includes('duplicate key') || msg.includes('unique constraint')
}
