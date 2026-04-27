import { createAdminClient } from '@/lib/supabase/admin'
import { transcribeAudioFromUrl } from './replicate-whisper'
import { createDownloadUrl } from './storage'
import type { VideoEditStatus } from '../types/video-edit'

interface UpdatePatch {
  status?: VideoEditStatus
  error?: string | null
  edited_path?: string | null
  transcript?: unknown
  duration_seconds?: number | null
  size_bytes?: number | null
  cost_usd?: number
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
    const transcript = await transcribeAudioFromUrl(downloadUrl, 'spanish')

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error(`[video-edit] ${editId} failed:`, message)
    await updateEdit(editId, {
      status: 'error',
      error: message.slice(0, 1000),
    })
  }
}
