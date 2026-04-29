import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyMeeting } from './classifier'
import { findMeetingByRecordingId, normalizeFathomMeeting } from './fathom-client'
import { gitCommitDocs } from './git-commit'
import { regenerateIndex } from './index-generator'
import { writeMeetingArtifacts } from './markdown-writer'
import { markMeetingStatus, upsertMeeting } from './meetings-repo'
import { slug } from '../lib/paths'
import type { FathomMeeting, FathomWebhookPayload } from '../types/fathom'

export interface PipelineResult {
  ok: boolean
  meetingId?: string
  duplicate?: boolean
  markdownPath?: string
  commit?: { status: string; sha: string | null }
  error?: string
}

export async function processFathomWebhook(
  payload: FathomWebhookPayload,
): Promise<PipelineResult> {
  const supabase = createAdminClient()

  try {
    const meeting = await extractMeetingFromPayload(payload)
    if (!meeting) return { ok: false, error: 'no_meeting_in_payload' }

    const normalized = normalizeFathomMeeting(meeting)

    // Fetch team member names for prompt context
    const teamNames = await fetchTeamMemberNames(supabase)

    // Classify
    const classification = await classifyMeeting({
      meeting: normalized,
      teamMemberNames: teamNames,
    })

    // Persist
    const { meeting: meetingRow, wasNew, participants } = await upsertMeeting(supabase, {
      normalized,
      classification,
    })

    if (!wasNew) {
      return {
        ok: true,
        meetingId: meetingRow.id,
        duplicate: true,
      }
    }

    // Write markdown artifacts
    await markMeetingStatus(supabase, meetingRow.id, 'writing')
    const artifacts = await writeMeetingArtifacts({
      supabase,
      meeting: meetingRow,
      classification,
      normalized,
      participants,
    })

    // Regenerate INDEX
    await regenerateIndex()

    await markMeetingStatus(supabase, meetingRow.id, 'processed', {
      markdown_path: artifacts.markdownPath,
    })

    // Auto-commit (Opción A: cada call = 1 commit)
    const titleSlug = slug(meetingRow.title).slice(0, 40)
    const fathomShort = meetingRow.fathom_meeting_id.slice(-8)
    const commit = await gitCommitDocs(`meetings: ${fathomShort} ${titleSlug}`)
    if (commit.status === 'failed') {
      console.error('[pipeline] git commit failed', commit.error)
      await markMeetingStatus(supabase, meetingRow.id, 'processed', {
        processing_error: `git_commit_failed: ${commit.error ?? 'unknown'}`,
      })
    }

    return {
      ok: true,
      meetingId: meetingRow.id,
      markdownPath: artifacts.markdownPath,
      commit: { status: commit.status, sha: commit.commitSha },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[pipeline] error', message, err)
    return { ok: false, error: message }
  }
}

async function extractMeetingFromPayload(
  payload: FathomWebhookPayload,
): Promise<FathomMeeting | null> {
  // Caso 1: Fathom embebe el objeto meeting completo
  if (payload.meeting && typeof payload.meeting === 'object') {
    return payload.meeting
  }

  // Caso 2: payload flat, con fields de Meeting al root
  if ('recording_id' in payload && 'title' in payload && 'calendar_invitees' in payload) {
    return payload as unknown as FathomMeeting
  }

  // Caso 3: solo recording_id → fetch via Fathom API
  const recordingId =
    typeof payload.recording_id === 'number' ? payload.recording_id : null
  if (recordingId) {
    return findMeetingByRecordingId(recordingId)
  }

  return null
}

async function fetchTeamMemberNames(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('full_name')
    .eq('active', true)
  if (error) {
    console.error('[pipeline] fetchTeamMemberNames', error)
    return []
  }
  return (data ?? []).map((r: { full_name: string }) => r.full_name)
}
