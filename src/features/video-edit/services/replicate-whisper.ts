import Replicate from 'replicate'
import type { WhisperTranscript, WhisperWord } from '../types/video-edit'

// Modelo: incredibly-fast-whisper devuelve word-level timestamps via 'chunks'
// con `timestamp: [start, end]`. Coste: ~$0.006/min. Tarda ~10s para 60s de audio.
const WHISPER_MODEL =
  'vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c'

interface ReplicateRawOutput {
  text?: string
  language?: string
  chunks?: Array<{ text: string; timestamp: [number, number] | [number, null] }>
}

function getReplicate(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN no esta configurado en .env.local')
  }
  return new Replicate({ auth: token })
}

/**
 * Transcribe un video subido a Supabase Storage via su URL publica firmada.
 * Devuelve transcript con palabras + timestamps.
 */
export async function transcribeAudioFromUrl(
  signedAudioUrl: string,
  language: string = 'spanish',
): Promise<WhisperTranscript> {
  const replicate = getReplicate()

  const output = (await replicate.run(WHISPER_MODEL, {
    input: {
      audio: signedAudioUrl,
      task: 'transcribe',
      language,
      timestamp: 'word',
      batch_size: 64,
    },
  })) as ReplicateRawOutput

  const text = output.text ?? ''
  const chunks = output.chunks ?? []

  const words: WhisperWord[] = chunks
    .filter((c) => Array.isArray(c.timestamp) && c.timestamp[0] != null)
    .map((c) => ({
      word: (c.text ?? '').trim(),
      start: Number(c.timestamp[0]) || 0,
      end: c.timestamp[1] != null ? Number(c.timestamp[1]) : Number(c.timestamp[0]) || 0,
    }))
    .filter((w) => w.word.length > 0)

  return {
    text,
    language: output.language,
    words,
  }
}
