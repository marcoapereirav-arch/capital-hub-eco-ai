import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import { embedText, transcribeVideo } from './transcriber'
import { analyzeVideo } from './analyzer'
import type { VideoRow } from '../types/video'

interface SelectVideosArgs {
  account_id?: string
  video_ids?: string[]
  min_views?: number
  top_x?: number
  order_by?: 'views' | 'engagement_rate' | 'posted_at' | 'likes' | 'comments'
}

async function selectVideosForTranscription(
  supabase: SupabaseClient,
  args: SelectVideosArgs,
): Promise<VideoRow[]> {
  let q = supabase
    .from('ci_videos')
    .select('*')
    .in('transcript_status', ['pending', 'error'])

  if (args.video_ids && args.video_ids.length > 0) {
    q = q.in('id', args.video_ids)
  } else {
    if (args.account_id) q = q.eq('account_id', args.account_id)
    if (args.min_views !== undefined) q = q.gte('views', args.min_views)
    const orderBy = args.order_by ?? 'views'
    q = q.order(orderBy, { ascending: false, nullsFirst: false })
    q = q.limit(args.top_x ?? 20)
  }

  const { data, error } = await q
  if (error) throw new ContentIntelError('select_videos_failed', error.message)
  return (data ?? []) as VideoRow[]
}

async function markVideoRunning(supabase: SupabaseClient, videoId: string): Promise<void> {
  const { error } = await supabase
    .from('ci_videos')
    .update({ transcript_status: 'running', transcript_error: null })
    .eq('id', videoId)
  if (error) throw new ContentIntelError('mark_running_failed', error.message)
}

async function saveTranscriptSuccess(
  supabase: SupabaseClient,
  videoId: string,
  payload: {
    transcript: string
    transcript_language: string | null
    transcript_model: string
    transcript_cost_usd: number
    embedding: number[] | null
  },
): Promise<void> {
  const patch: Record<string, unknown> = {
    transcript: payload.transcript,
    transcript_language: payload.transcript_language,
    transcript_model: payload.transcript_model,
    transcript_cost_usd: payload.transcript_cost_usd,
    transcript_status: 'ok',
    transcript_error: null,
    transcribed_at: new Date().toISOString(),
  }
  if (payload.embedding) {
    patch.embedding = JSON.stringify(payload.embedding)
    patch.embedded_at = new Date().toISOString()
  }
  const { error } = await supabase.from('ci_videos').update(patch).eq('id', videoId)
  if (error) throw new ContentIntelError('save_transcript_failed', error.message)
}

async function markTranscriptError(
  supabase: SupabaseClient,
  videoId: string,
  message: string,
): Promise<void> {
  await supabase
    .from('ci_videos')
    .update({ transcript_status: 'error', transcript_error: message.slice(0, 1000) })
    .eq('id', videoId)
}

async function markTranscriptSkipped(
  supabase: SupabaseClient,
  videoId: string,
  reason: string,
): Promise<void> {
  await supabase
    .from('ci_videos')
    .update({
      transcript_status: 'skipped',
      transcript_error: reason.slice(0, 1000),
      transcribed_at: new Date().toISOString(),
    })
    .eq('id', videoId)
}

export interface TranscribeBatchResult {
  processed: number
  ok: number
  skipped: number
  errors: number
  total_cost_usd: number
  failures: { video_id: string; error: string }[]
}

/**
 * Transcribe videos en secuencia (serialización voluntaria para controlar rate limits / coste).
 * No lanza si un video individual falla: captura, persiste error en la row y sigue.
 */
export async function transcribeBatch(args: SelectVideosArgs): Promise<TranscribeBatchResult> {
  const supabase = createAdminClient()
  const videos = await selectVideosForTranscription(supabase, args)

  const result: TranscribeBatchResult = {
    processed: videos.length,
    ok: 0,
    skipped: 0,
    errors: 0,
    total_cost_usd: 0,
    failures: [],
  }

  for (const video of videos) {
    if (!video.video_url) {
      await markTranscriptSkipped(supabase, video.id, 'sin video_url')
      result.skipped += 1
      continue
    }

    try {
      await markVideoRunning(supabase, video.id)

      const transcribed = await transcribeVideo(video.video_url)

      let embedding: number[] | null = null
      if (transcribed.transcript && transcribed.transcript !== '[NO_SPEECH]') {
        try {
          const embedded = await embedText(transcribed.transcript, 'RETRIEVAL_DOCUMENT')
          embedding = embedded.values
        } catch (err) {
          // Embedding fallido no bloquea el transcript. Loggeamos y seguimos sin vector.
          console.error('[content-intel] embed failed', toErrorMessage(err))
        }
      }

      await saveTranscriptSuccess(supabase, video.id, {
        transcript: transcribed.transcript,
        transcript_language: transcribed.language,
        transcript_model: transcribed.model,
        transcript_cost_usd: transcribed.cost_usd,
        embedding,
      })

      result.total_cost_usd += transcribed.cost_usd
      if (transcribed.transcript === '[NO_SPEECH]') result.skipped += 1
      else result.ok += 1
    } catch (err) {
      const msg = toErrorMessage(err)
      await markTranscriptError(supabase, video.id, msg)
      result.errors += 1
      result.failures.push({ video_id: video.id, error: msg })
    }
  }

  return result
}

// ---------- Analyze single video ----------

export async function analyzeAndSaveVideo(videoId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ci_videos')
    .select('*')
    .eq('id', videoId)
    .maybeSingle()
  if (error) throw new ContentIntelError('video_fetch_failed', error.message)
  if (!data) throw new ContentIntelError('video_not_found', `Video ${videoId} not found`)

  const video = data as VideoRow
  if (!video.transcript) {
    throw new ContentIntelError(
      'video_no_transcript',
      'Video sin transcript — transcribe primero',
    )
  }

  const { analysis, model, tokens_used } = await analyzeVideo({
    transcript: video.transcript,
    caption: video.caption,
    views: video.views,
    likes: video.likes,
    comments: video.comments,
    duration_s: video.duration_s,
  })

  const { error: updErr } = await supabase
    .from('ci_videos')
    .update({
      analysis,
      analyzed_at: new Date().toISOString(),
    })
    .eq('id', videoId)
  if (updErr) throw new ContentIntelError('analyze_save_failed', updErr.message)

  // cost/tokens not persisted per-video for now — agregado en cost_usd transcripts.
  void model
  void tokens_used
}
