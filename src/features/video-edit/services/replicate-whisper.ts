import Replicate from 'replicate'
import type { WhisperTranscript, WhisperWord } from '../types/video-edit'

// Modelo: WhisperX large-v3. Acepta video directo (extrae audio via ffmpeg) y
// devuelve word-level timestamps via segments[].words[]. Coste similar al
// incredibly-fast-whisper pero compatible con MP4/MOV/cualquier video.
const WHISPER_MODEL =
  'victor-upmeet/whisperx:84d2ad2d6194fe98a17d2b60bef1c7f910c46b2f6fd38996ca457afd9c8abfcb'

interface WhisperXSegmentWord {
  word?: string
  start?: number
  end?: number
  score?: number
}

interface WhisperXSegment {
  start?: number
  end?: number
  text?: string
  words?: WhisperXSegmentWord[]
}

interface WhisperXOutput {
  detected_language?: string
  segments?: WhisperXSegment[]
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
 * Acepta video (MOV/MP4) — WhisperX lo demultiplexa con ffmpeg automaticamente.
 * Devuelve transcript con palabras + timestamps.
 */
export async function transcribeAudioFromUrl(
  signedAudioUrl: string,
  language: string = 'es',
): Promise<WhisperTranscript> {
  const replicate = getReplicate()

  const output = (await replicate.run(WHISPER_MODEL, {
    input: {
      audio_file: signedAudioUrl,
      language,
      align_output: true, // critico: activa word-level timestamps
      batch_size: 64,
      diarization: false,
      temperature: 0,
      debug: false,
    },
  })) as WhisperXOutput

  const segments = output.segments ?? []

  const words: WhisperWord[] = []
  const textParts: string[] = []

  for (const seg of segments) {
    if (seg.text) textParts.push(seg.text.trim())
    for (const w of seg.words ?? []) {
      const word = (w.word ?? '').trim()
      if (!word) continue
      const start = typeof w.start === 'number' ? w.start : seg.start ?? 0
      const end = typeof w.end === 'number' ? w.end : start
      words.push({ word, start, end })
    }
  }

  return {
    text: textParts.join(' '),
    language: output.detected_language ?? language,
    words,
  }
}
