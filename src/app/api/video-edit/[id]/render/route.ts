import { NextRequest } from 'next/server'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createDownloadUrl } from '@/features/video-edit/services/storage'
import { queueRender, getRender } from '@/features/video-edit/services/shotstack'
import { buildPayloadByPreset } from '@/features/video-edit/services/timeline-builder'
import { loadBrandPackTokens } from '@/features/video-edit/services/brand-pack-repo'
import { applyLlmCutsToWords, type LlmCut } from '@/features/video-edit/services/llm-edit'
import type { WhisperTranscript } from '@/features/video-edit/types/video-edit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface Params {
  params: Promise<{ id: string }>
}

/**
 * POST /api/video-edit/[id]/render
 * Encola un render en Shotstack a partir del video transcrito.
 * Requiere status='done' o 'rendering' (re-encolar) y transcript disponible.
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

  try {
    // 1) Cargar brand pack desde BD (cae a defaults si no existe)
    const brand = await loadBrandPackTokens(supabase)

    // 2) URL firmada del video fuente que Shotstack pueda descargar
    const sourceUrl = await createDownloadUrl(edit.source_path)

    // 3) Resolver preset_slug. Default = 'vertical-clean' (Variante 1 del playbook).
    const presetSlug = edit.preset_slug ?? 'vertical-clean'

    // 4) Aplicar LLM-cuts al transcript (si hubo): filtra palabras dentro
    //    de los tramos marcados por Claude. Lo que queda lo procesa silence-trim.
    const llmCuts = (edit.llm_cuts as LlmCut[] | null) ?? []
    const filteredWords = applyLlmCutsToWords(transcript.words, llmCuts)
    const transcriptForRender: WhisperTranscript = {
      ...transcript,
      words: filteredWords,
    }

    // 5) Construir payload Shotstack según la variante elegida
    const { payload, outputDuration, silenceRemoved } = buildPayloadByPreset({
      presetSlug,
      sourceVideoUrl: sourceUrl,
      durationSeconds: edit.duration_seconds,
      transcript: transcriptForRender,
      brand,
      headlineText: edit.headline_text ?? undefined,
      rotationDegrees: edit.rotation_degrees ?? 0,
    })

    // 6) Encolar en Shotstack
    const renderId = await queueRender(payload)
    console.log(
      `[video-edit] ${id} render encolado · preset=${presetSlug} · ` +
        `output=${outputDuration.toFixed(1)}s · ` +
        `silencio_recortado=${silenceRemoved.toFixed(1)}s · ` +
        `llm_cuts=${llmCuts.length}`,
    )

    // 4) Persistir estado
    const { error: updErr } = await supabase
      .from('ci_video_edits')
      .update({
        status: 'rendering',
        shotstack_render_id: renderId,
        render_started_at: new Date().toISOString(),
        render_completed_at: null,
        output_url: null,
        error: null,
      })
      .eq('id', id)
    if (updErr) {
      return Response.json({ ok: false, error: updErr.message }, { status: 500 })
    }

    return Response.json({ ok: true, render_id: renderId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    await supabase
      .from('ci_video_edits')
      .update({ status: 'error', error: message.slice(0, 1000) })
      .eq('id', id)
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

/**
 * GET /api/video-edit/[id]/render
 * Consulta Shotstack por el estado del render y sincroniza la BD.
 * El UI polea este endpoint cada N segundos cuando status='rendering'.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: edit, error: loadErr } = await supabase
    .from('ci_video_edits')
    .select('id, status, shotstack_render_id, output_url, error, render_started_at, render_completed_at')
    .eq('id', id)
    .maybeSingle()

  if (loadErr) return Response.json({ ok: false, error: loadErr.message }, { status: 500 })
  if (!edit) return Response.json({ ok: false, error: 'not_found' }, { status: 404 })

  // Si ya terminó (done/error/cancelled) o nunca se encoló, devolvemos lo que hay
  if (edit.status !== 'rendering' || !edit.shotstack_render_id) {
    return Response.json({ ok: true, edit })
  }

  // Hay render activo — preguntamos a Shotstack
  try {
    const info = await getRender(edit.shotstack_render_id)

    if (info.status === 'done' && info.url) {
      const { data: updated } = await supabase
        .from('ci_video_edits')
        .update({
          status: 'done',
          output_url: info.url,
          render_completed_at: new Date().toISOString(),
          error: null,
        })
        .eq('id', id)
        .select('id, status, shotstack_render_id, output_url, error, render_started_at, render_completed_at')
        .maybeSingle()
      return Response.json({ ok: true, edit: updated ?? edit, shotstack_status: info.status })
    }

    if (info.status === 'failed') {
      const { data: updated } = await supabase
        .from('ci_video_edits')
        .update({
          status: 'error',
          error: info.error?.slice(0, 1000) ?? 'shotstack_failed',
          render_completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, status, shotstack_render_id, output_url, error, render_started_at, render_completed_at')
        .maybeSingle()
      return Response.json({ ok: true, edit: updated ?? edit, shotstack_status: info.status })
    }

    // Sigue en cola/render — devolvemos el sub-estado para que el UI lo muestre
    return Response.json({ ok: true, edit, shotstack_status: info.status })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
