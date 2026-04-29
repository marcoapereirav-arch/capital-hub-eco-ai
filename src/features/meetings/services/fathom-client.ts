import {
  FATHOM_API_BASE,
  FATHOM_FETCH_BACKOFF_MS,
  FATHOM_FETCH_MAX_RETRIES,
} from '../constants'
import type {
  FathomListMeetingsResponse,
  FathomMeeting,
  FathomTranscriptItem,
  NormalizedMeeting,
  TranscriptLine,
} from '../types/fathom'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class FathomApiError extends Error {
  constructor(
    public status: number,
    public bodyPreview: string,
    public isRetryable: boolean,
  ) {
    super(`Fathom API ${status}: ${bodyPreview.slice(0, 200)}`)
    this.name = 'FathomApiError'
  }
}

async function fathomFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = process.env.FATHOM_API_KEY
  if (!apiKey) throw new Error('FATHOM_API_KEY not set')

  return fetch(`${FATHOM_API_BASE}${path}`, {
    ...init,
    headers: {
      'X-Api-Key': apiKey,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
}

async function fathomFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= FATHOM_FETCH_MAX_RETRIES; attempt++) {
    try {
      const res = await fathomFetch(path, init)
      if (res.ok) return (await res.json()) as T

      const body = await res.text().catch(() => '')
      const retryable = res.status >= 500 || res.status === 429
      throw new FathomApiError(res.status, body, retryable)
    } catch (err) {
      lastError = err
      const retryable =
        err instanceof FathomApiError
          ? err.isRetryable
          : err instanceof Error && err.name === 'TypeError' // network error
      if (!retryable || attempt === FATHOM_FETCH_MAX_RETRIES) throw err
      await sleep(FATHOM_FETCH_BACKOFF_MS[attempt] ?? 30000)
    }
  }

  throw lastError ?? new Error('fathomFetchJson exhausted retries with no error captured')
}

function transcriptToLines(items: FathomTranscriptItem[]): TranscriptLine[] {
  return items.map((item) => ({
    speaker: item.speaker.display_name,
    speaker_email: item.speaker.matched_calendar_invitee_email,
    timestamp: item.timestamp,
    text: item.text,
  }))
}

function linesToPlainText(lines: TranscriptLine[]): string {
  return lines.map((l) => `[${l.timestamp}] ${l.speaker}: ${l.text}`).join('\n')
}

function durationBetween(start: string, end: string | null | undefined): number | null {
  if (!end) return null
  const delta = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(delta) || delta < 0) return null
  return Math.round(delta / 1000)
}

export function normalizeFathomMeeting(m: FathomMeeting): NormalizedMeeting {
  const transcriptLines = m.transcript ? transcriptToLines(m.transcript) : []
  return {
    recording_id: m.recording_id,
    title: m.meeting_title ?? m.title,
    started_at: m.recording_start_time,
    ended_at: m.recording_end_time ?? null,
    duration_seconds: durationBetween(m.recording_start_time, m.recording_end_time),
    share_url: m.share_url,
    recording_url: m.url,
    transcript_language: m.transcript_language ?? 'es',
    transcript_text: linesToPlainText(transcriptLines),
    transcript_lines: transcriptLines,
    calendar_invitees: m.calendar_invitees ?? [],
    invitees_domain_hint: m.calendar_invitees_domains_type,
    fathom_summary_text: m.default_summary?.text ?? null,
    fathom_action_items: m.action_items ?? [],
  }
}

/**
 * Lista meetings de Fathom. Pasamos include_* para traer todo en una sola llamada.
 * Útil para fetch por ID: filtramos client-side en la respuesta.
 */
export async function listMeetings(params: {
  createdAfter?: string
  createdBefore?: string
  cursor?: string
  includeTranscript?: boolean
  includeSummary?: boolean
  includeActionItems?: boolean
  includeCrmMatches?: boolean
}): Promise<FathomListMeetingsResponse> {
  const q = new URLSearchParams()
  if (params.createdAfter) q.set('created_after', params.createdAfter)
  if (params.createdBefore) q.set('created_before', params.createdBefore)
  if (params.cursor) q.set('cursor', params.cursor)
  if (params.includeTranscript) q.set('include_transcript', 'true')
  if (params.includeSummary) q.set('include_summary', 'true')
  if (params.includeActionItems) q.set('include_action_items', 'true')
  if (params.includeCrmMatches) q.set('include_crm_matches', 'true')

  const qs = q.toString()
  const path = `/meetings${qs ? `?${qs}` : ''}`
  return fathomFetchJson<FathomListMeetingsResponse>(path)
}

/**
 * Fathom no expone un endpoint "get meeting by id". Usamos list con filtro temporal
 * apretado alrededor del created_at del webhook para encontrar la meeting. Si viene
 * ya embebida en el payload del webhook, usamos esa directamente sin API call.
 */
export async function findMeetingByRecordingId(
  recordingId: number,
  opts?: { aroundIso?: string; windowMinutes?: number },
): Promise<FathomMeeting | null> {
  const around = opts?.aroundIso ? new Date(opts.aroundIso) : new Date()
  const window = (opts?.windowMinutes ?? 120) * 60 * 1000
  const after = new Date(around.getTime() - window).toISOString()
  const before = new Date(around.getTime() + window).toISOString()

  let cursor: string | null = null
  for (let page = 0; page < 10; page++) {
    const res: FathomListMeetingsResponse = await listMeetings({
      createdAfter: after,
      createdBefore: before,
      cursor: cursor ?? undefined,
      includeTranscript: true,
      includeSummary: true,
      includeActionItems: true,
      includeCrmMatches: true,
    })
    const hit = res.items.find((m) => m.recording_id === recordingId)
    if (hit) return hit
    cursor = res.next_cursor
    if (!cursor) return null
  }
  return null
}

export async function getTranscript(recordingId: number): Promise<FathomTranscriptItem[]> {
  const res = await fathomFetchJson<{ transcript: FathomTranscriptItem[] }>(
    `/recordings/${recordingId}/transcript`,
  )
  return res.transcript
}
