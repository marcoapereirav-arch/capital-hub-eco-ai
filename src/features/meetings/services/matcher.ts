import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClassificationResult } from '../types/classification'
import type {
  ContactMatchResult,
  ResolvedParticipant,
  TeamMemberRow,
} from '../types/meeting'

/**
 * Resuelve cada participante del ClassificationResult:
 * - Si is_team_member y hay canonical → matchea team_members por nombre (validación en DB).
 * - Si no → busca match en contacts (email exacto o fuzzy).
 *   Si no hay match, contact_id queda null y después el repo upserta un nuevo contact.
 */
export async function resolveParticipants(
  supabase: SupabaseClient,
  classification: ClassificationResult,
): Promise<ResolvedParticipant[]> {
  const resolved: ResolvedParticipant[] = []

  for (const p of classification.participants) {
    if (p.is_team_member) {
      const teamMember = await matchTeamMember(
        supabase,
        p.matched_team_member_name ?? p.name,
        p.name,
      )
      resolved.push({
        raw_name: p.name,
        raw_email: p.email,
        role: p.role,
        contact_id: null,
        match_status: teamMember ? 'confirmed' : 'unmatched',
        match_score: null,
        team_member_id: teamMember?.id ?? null,
      })
    } else {
      const contactMatch = await findContactMatch(supabase, p.email, p.name)
      const matchStatus: ResolvedParticipant['match_status'] =
        contactMatch.match_method === 'email_exact'
          ? 'auto_email'
          : contactMatch.match_method === 'fuzzy'
            ? 'fuzzy_pending'
            : 'unmatched'

      resolved.push({
        raw_name: p.name,
        raw_email: p.email,
        role: p.role,
        contact_id: contactMatch.contact_id,
        match_status: matchStatus,
        match_score: contactMatch.score,
        team_member_id: null,
      })
    }
  }

  return resolved
}

async function matchTeamMember(
  supabase: SupabaseClient,
  hintName: string,
  fallbackName: string,
): Promise<TeamMemberRow | null> {
  // 1. Try with hint (canonical returned by LLM)
  let match = await callMatchTeamMemberRpc(supabase, hintName)
  if (match) return match

  // 2. Fallback: raw name from transcript
  if (hintName !== fallbackName) {
    match = await callMatchTeamMemberRpc(supabase, fallbackName)
  }
  return match
}

async function callMatchTeamMemberRpc(
  supabase: SupabaseClient,
  attendeeName: string,
): Promise<TeamMemberRow | null> {
  const { data, error } = await supabase.rpc('match_team_member_by_name', {
    attendee_name: attendeeName,
  })
  if (error) {
    console.error('[matcher] match_team_member_by_name error', error)
    return null
  }
  if (Array.isArray(data) && data.length > 0) {
    return data[0] as TeamMemberRow
  }
  return null
}

async function findContactMatch(
  supabase: SupabaseClient,
  email: string | null,
  name: string,
): Promise<ContactMatchResult> {
  const { data, error } = await supabase.rpc('find_contact_match', {
    p_email: email,
    p_name: name,
  })
  if (error) {
    console.error('[matcher] find_contact_match error', error)
    return { contact_id: null, match_method: 'none', score: null }
  }
  return data as ContactMatchResult
}
