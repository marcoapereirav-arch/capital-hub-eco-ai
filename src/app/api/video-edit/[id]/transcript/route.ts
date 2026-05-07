import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import type { WhisperWord } from '@/features/video-edit/types/video-edit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

const WordSchema = z.object({
  word: z.string().min(1).max(60),
  start: z.number().min(0),
  end: z.number().min(0),
})

const Schema = z.object({
  words: z.array(WordSchema).max(20000),
})

/**
 * PUT /api/video-edit/[id]/transcript
 * Sobreescribe las palabras del transcript con la versión editada por el usuario.
 * El texto plano (transcript.text) se reconstruye a partir de las palabras.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Validación: end > start para cada palabra, y orden ascendente
  const words = parsed.data.words as WhisperWord[]
  for (let i = 0; i < words.length; i++) {
    if (words[i].end <= words[i].start) {
      return Response.json(
        { ok: false, error: 'invalid_word_timing', detail: `Palabra ${i}: end <= start` },
        { status: 400 },
      )
    }
    if (i > 0 && words[i].start < words[i - 1].start) {
      return Response.json(
        { ok: false, error: 'words_not_sorted', detail: `Palabra ${i} empieza antes que la anterior` },
        { status: 400 },
      )
    }
  }

  const supabase = createAdminClient()

  // Leemos el transcript actual para preservar language y reconstruir text
  const { data: edit, error: loadErr } = await supabase
    .from('ci_video_edits')
    .select('transcript')
    .eq('id', id)
    .maybeSingle()

  if (loadErr) return Response.json({ ok: false, error: loadErr.message }, { status: 500 })
  if (!edit) return Response.json({ ok: false, error: 'not_found' }, { status: 404 })

  const currentTranscript = (edit.transcript ?? {}) as { language?: string }
  const text = words.map((w) => w.word).join(' ')

  const newTranscript = {
    text,
    language: currentTranscript.language ?? 'es',
    words,
  }

  const { error: updateErr } = await supabase
    .from('ci_video_edits')
    .update({
      transcript: newTranscript,
      transcript_edited_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateErr) return Response.json({ ok: false, error: updateErr.message }, { status: 500 })

  return Response.json({ ok: true, words_count: words.length })
}
