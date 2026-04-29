// Tipos basados en Fathom External API v1.
// Docs: https://developers.fathom.ai/api-reference/meetings/list-meetings

export interface FathomUser {
  email: string
  name: string | null
}

export interface FathomCalendarInvitee {
  email: string
  name: string | null
  is_external: boolean | null
}

export interface FathomTranscriptItem {
  speaker: {
    display_name: string
    matched_calendar_invitee_email: string | null
  }
  text: string
  timestamp: string // "HH:MM:SS"
}

export interface FathomActionItem {
  text: string
  assignee_email?: string | null
  due_date?: string | null
}

export interface FathomMeetingSummary {
  text: string
  // Fathom puede devolver secciones (overview, decisions, etc.) según el template.
  // Guardamos raw por si acaso.
  raw?: unknown
}

export interface FathomMeeting {
  title: string
  meeting_title: string | null
  recording_id: number
  url: string
  share_url: string
  created_at: string
  scheduled_start_time: string
  scheduled_end_time: string
  recording_start_time: string
  recording_end_time: string
  calendar_invitees_domains_type: 'only_internal' | 'one_or_more_external'
  transcript_language: string
  recorded_by: FathomUser
  calendar_invitees: FathomCalendarInvitee[]
  transcript: FathomTranscriptItem[] | null
  default_summary: FathomMeetingSummary | null
  action_items: FathomActionItem[] | null
  crm_matches: unknown | null
}

export interface FathomListMeetingsResponse {
  limit: number | null
  next_cursor: string | null
  items: FathomMeeting[]
}

// Payload inferido del webhook "new_meeting_content_ready".
// Fathom docs no publican el schema completo; asumimos que incluye el objeto
// Meeting tal cual, con un envelope event/type. Se ajusta en Fase 5 con la
// primera call real.
export interface FathomWebhookPayload {
  event?: string
  type?: string
  recording_id?: number
  meeting?: FathomMeeting
  // Compatibilidad: el payload podría venir flat (campos de Meeting al root).
  [k: string]: unknown
}

export interface TranscriptLine {
  speaker: string
  speaker_email: string | null
  timestamp: string
  text: string
}

export interface NormalizedMeeting {
  recording_id: number
  title: string
  started_at: string // ISO UTC
  ended_at: string | null
  duration_seconds: number | null
  share_url: string
  recording_url: string
  transcript_language: string
  transcript_text: string // transcript plano "HH:MM:SS — Speaker: texto"
  transcript_lines: TranscriptLine[]
  calendar_invitees: FathomCalendarInvitee[]
  invitees_domain_hint: 'only_internal' | 'one_or_more_external'
  fathom_summary_text: string | null
  fathom_action_items: FathomActionItem[]
}
