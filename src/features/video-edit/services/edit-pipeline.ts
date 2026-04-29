import { createAdminClient } from '@/lib/supabase/admin'
import { transcribeAudioFromUrl } from './replicate-whisper'
import { createDownloadUrl } from './storage'
import { detectLlmCuts, type LlmEditMode } from './llm-edit'
import type { VideoEditStatus } from '../types/video-edit'

interface UpdatePatch {
  status?: VideoEditStatus
  error?: string | null
  edited_path?: string | null
  transcript?: unknown
  duration_seconds?: number | null
  size_bytes?: number | null
  cost_usd?: number
  llm_cuts?: unknown
  llm_seconds_removed?: number
}

async function updateEdit(id: string, patch: UpdatePatch): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('ci_video_edits').update(patch).eq('id', id)
  if (error) console.error(`[video-edit] update ${id} failed:`, error.message)
}

/**
 * Pipeline completo de edicion para Fase 1 MVP.
 *
 * Por ahora SOLO transcribe. En sesiones siguientes se anadiran:
 *  - Cortar silencios (ffmpeg)
 *  - Subtitulos estilo Capital Hub (ffmpeg + ASS)
 *
 * El estado avanza: pending -> transcribing -> done (o error)
 */
export async function runEditPipeline(editId: string): Promise<void> {
  const supabase = createAdminClient()

  // 1) Cargar el registro
  const { data: row, error: loadErr } = await supabase
    .from('ci_video_edits')
    .select('*')
    .eq('id', editId)
    .single()

  if (loadErr || !row) {
    console.error(`[video-edit] no se encontro edit ${editId}:`, loadErr?.message)
    return
  }

  try {
    // 2) Crear download URL del raw video para que Whisper lo pueda leer
    await updateEdit(editId, { status: 'transcribing', error: null })
    const downloadUrl = await createDownloadUrl(row.source_path)

    // 3) Transcribir via Replicate
    const transcript = await transcribeAudioFromUrl(downloadUrl, 'es')

    if (!transcript.words || transcript.words.length === 0) {
      throw new Error('Whisper no devolvio palabras (audio sin habla?)')
    }

    // 4) Guardar transcript + estimar duracion en base a la ultima palabra
    const lastWordEnd = transcript.words[transcript.words.length - 1]?.end ?? 0
    const replicateCostEstimate = Math.max(lastWordEnd, 1) * 0.0001 // ~$0.006/min ≈ $0.0001/s

    await updateEdit(editId, {
      status: 'done',
      transcript: transcript as unknown,
      duration_seconds: lastWordEnd,
      cost_usd: replicateCostEstimate,
    })

    console.log(
      `[video-edit] ${editId} transcrito · ${transcript.words.length} palabras · ${lastWordEnd.toFixed(1)}s`,
    )

    // 5) LLM-edit: detectar cortes semánticos (muletillas, repeticiones, falsos arranques)
    //    Se ejecuta DESPUÉS de marcar 'done' para que la UI no se bloquee.
    //    Si falla, no rompe el pipeline — el video se puede renderizar sin LLM-cuts.
    const mode: LlmEditMode = (row.llm_edit_mode as LlmEditMode | null) ?? 'aggressive'
    if (mode !== 'off') {
      try {
        const llmResult = await detectLlmCuts(transcript, mode)
        await updateEdit(editId, {
          llm_cuts: llmResult.cuts,
          llm_seconds_removed: llmResult.total_seconds_removed,
        })
        console.log(
          `[video-edit] ${editId} LLM-cuts · ${llmResult.cuts.length} tramos · ` +
            `${llmResult.total_seconds_removed.toFixed(1)}s recortados (${mode})`,
        )
      } catch (llmErr) {
        const llmMsg = llmErr instanceof Error ? llmErr.message : 'unknown'
        console.error(`[video-edit] ${editId} LLM-edit FAIL (continuamos sin):`, llmMsg)
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error(`[video-edit] ${editId} failed:`, message)
    await updateEdit(editId, {
      status: 'error',
      error: message.slice(0, 1000),
    })
  }
}
