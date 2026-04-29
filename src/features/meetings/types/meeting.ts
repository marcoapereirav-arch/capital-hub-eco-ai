export interface TeamMemberRow {
  id: string
  full_name: string
  aliases: string[]
  emails: string[] | null
  role_label: string | null
  es_usuario_app: boolean
  active: boolean
  created_at: string
}

export interface ContactRow {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  company: string | null
  stage: string | null
  origin: string | null
  tags: string[]
  notes: string | null
  slug: string
  created_at: string
  updated_at: string
}

export interface MeetingRow {
  id: string
  fathom_meeting_id: string
  title: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  fathom_share_url: string | null
  fathom_recording_url: string | null
  scope: 'external' | 'internal'
  tipo: string
  resultado: string | null
  funnel_stage: string | null
  resumen: string | null
  action_items: unknown
  decisiones: unknown
  transcript_raw: string | null
  transcript_language: string | null
  markdown_path: string | null
  status: string
  processing_error: string | null
  retry_count: number
  processed_at: string | null
  created_at: string
  updated_at: string
}

export interface ContactMatchResult {
  contact_id: string | null
  match_method: 'email_exact' | 'fuzzy' | 'none'
  score: number | null
}

export type ParticipantMatchStatus =
  | 'auto_email'
  | 'fuzzy_pending'
  | 'confirmed'
  | 'unmatched'

export interface ResolvedParticipant {
  raw_name: string
  raw_email: string | null
  role: 'primary' | 'participant' | 'decision_maker' | 'gatekeeper'
  // External-only fields:
  contact_id: string | null
  match_status: ParticipantMatchStatus
  match_score: number | null
  // Internal-only fields:
  team_member_id: string | null
}
