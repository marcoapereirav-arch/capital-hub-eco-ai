import { NextRequest } from 'next/server'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createDownloadUrl } from '@/features/video-edit/services/storage'
import { renderRemotionAndUpload } from '@/features/video-edit/services/remotion-render'
import { trimSilences } from '@/features/video-edit/services/silence-trim'
import { applyLlmCutsToWords, type LlmCut } from '@/features/video-edit/services/llm-edit'
import { probeVideo } from '@/features/video-edit/services/video-metadata'
import { loadBrandPackTokens } from '@/features/video-edit/services/brand-pack-repo'
import type { WhisperTranscript } from '@/features/video-edit/types/video-edit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 800

interface Params {
  params: Promise<{ id: string }>
}

/**
 * POST /api/video-edit/[id]/render
 * Renderiza el video con Remotion (local). Bloquea hasta que termina.
 * Para videos cortos (<2min) tarda ~30-90s.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: edit, error: loadErr } = await supabase
    .from('ci_video_edits')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (loadErr) return Response.json({ ok: false, error: loadErr.message }, { status: 500 })
  if (!edit) return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
  if (!edit.transcript) {
    return Response.json(
      { ok: false, error: 'no_transcript', detail: 'El video todavía no se ha transcrito.' },
      { status: 400 },
    )
  }
  if (!edit.duration_seconds || edit.duration_seconds <= 0) {
    return Response.json(
      { ok: false, error: 'no_duration', detail: 'Falta duración del video.' },
      { status: 400 },
    )
  }

  const transcript = edit.transcript as WhisperTranscript
  if (!transcript.words || transcript.words.length === 0) {
    return Response.json(
      { ok: false, error: 'empty_transcript', detail: 'Transcripción sin palabras.' },
      { status: 400 },
    )
  }

  // Marcar como rendering
  await supabase
    .from('ci_video_edits')
    .update({
      status: 'rendering',
      render_started_at: new Date().toISOString(),
      render_completed_at: null,
      output_url: null,
      error: null,
    })
    .eq('id', id)

  try {
    // 1) Cargar brand pack
    const brand = await loadBrandPackTokens(supabase)

    // 2) URL firmada del video fuente
    const sourceUrl = await createDownloadUrl(edit.source_path)

    // 3) Auto-detectar rotación si no está explícita en BD
    let rotationDegrees = edit.rotation_degrees ?? 0
    if (rotationDegrees === 0) {
      try {
        const metadata = await probeVideo(sourceUrl)
        rotationDegrees = metadata.rotationDegrees
        if (rotationDegrees !== 0) {
          console.log(`[render] ${id} auto-rotation detected: ${rotationDegrees}°`)
          await supabase
            .from('ci_video_edits')
            .update({ rotation_degrees: rotationDegrees })
            .eq('id', id)
        }
      } catch (probeErr) {
        console.warn(`[render] ${id} ffprobe failed (continuing with rotation=0):`, probeErr)
      }
    }

    // 4) Aplicar LLM-cuts al transcript
    const llmCuts = (edit.llm_cuts as LlmCut[] | null) ?? []
    const filteredWords = applyLlmCutsToWords(transcript.words, llmCuts)

    // 5) Silence-trim sobre las palabras filtradas → segmentos para Remotion
    const trim = trimSilences(filteredWords, brand.silenceThresholdMs)

    if (trim.segments.length === 0) {
      throw new Error('Tras LLM-cuts y silence-trim no quedan segmentos para renderizar')
    }

    console.log(
      `[render] ${id} · llm_cuts=${llmCuts.length} · segments=${trim.segments.length} · ` +
        `output_dur=${trim.totalOutputDuration.toFixed(1)}s · ` +
        `silence_removed=${trim.silenceRemoved.toFixed(1)}s · ` +
        `rotation=${rotationDegrees}`,
    )

    // 6) Renderizar con Remotion
    const result = await renderRemotionAndUpload({
      editId: id,
      compositionId: 'vertical-clean',
      inputProps: {
        sourceVideoUrl: sourceUrl,
        segments: trim.segments,
        words: trim.shiftedWords,
        rotationDegrees,
      },
    })

    // 7) Persistir output
    await supabase
      .from('ci_video_edits')
      .update({
        status: 'done',
        output_url: result.outputUrl,
        edited_path: result.bucketPath,
        render_completed_at: new Date().toISOString(),
        error: null,
      })
      .eq('id', id)

    return Response.json({ ok: true, output_url: result.outputUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error(`[render] ${id} failed:`, message)
    await supabase
      .from('ci_video_edits')
      .update({ status: 'error', error: message.slice(0, 1000) })
      .eq('id', id)
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

/**
 * GET /api/video-edit/[id]/render
 * Devuelve el estado actual. Polling-friendly.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: edit, error: loadErr } = await supabase
    .from('ci_video_edits')
    .select('id, status, output_url, error, render_started_at, render_completed_at')
    .eq('id', id)
    .maybeSingle()

  if (loadErr) return Response.json({ ok: false, error: loadErr.message }, { status: 500 })
  if (!edit) return Response.json({ ok: false, error: 'not_found' }, { status: 404 })

  return Response.json({ ok: true, edit })
}
