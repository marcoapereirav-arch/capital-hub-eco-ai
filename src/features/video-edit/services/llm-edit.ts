import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import type { WhisperTranscript, WhisperWord } from '../types/video-edit'

/**
 * LLM-edit: pasa el transcript a Claude y le pide que identifique los tramos
 * que sobran (muletillas, repeticiones, falsos arranques).
 *
 * Output del modelo: array de [{ start, end, reason }] en SEGUNDOS del video original.
 *
 * Estos cortes se combinan con el silence-trim para producir el corte final.
 */

const LLM_EDIT_MODEL = 'anthropic/claude-sonnet-4.6'
const LLM_EDIT_TEMPERATURE = 0.1

const LlmCutSchema = z.object({
  start: z.number(),
  end: z.number(),
  reason: z.string(),
})

const LlmEditOutputSchema = z.object({
  cuts: z.array(LlmCutSchema),
  total_seconds_removed: z.number(),
  notes: z.string(),
})

export type LlmCut = z.infer<typeof LlmCutSchema>
export type LlmEditOutput = z.infer<typeof LlmEditOutputSchema>

export type LlmEditMode = 'aggressive' | 'soft' | 'off'

const SYSTEM_PROMPT_AGGRESSIVE = `Eres un editor de Reels para Instagram con criterio de oro. Tu job es leer un transcript con timestamps a nivel palabra y devolver los TRAMOS que hay que CORTAR del video original para que quede limpio, denso y viral.

CRITERIOS PARA CORTAR (modo agresivo):
1. Muletillas: "eh", "este", "o sea", "como que", "tipo", "bueno", "vale", "ah", "entonces" usado como muletilla.
2. Repeticiones literales: "cosas que aprendí... cosas que aprendí" → cortar la primera tentativa.
3. Falsos arranques: cuando alguien empieza una frase, se interrumpe, y reformula.
4. Pausas semánticas largas que no aportan dramatismo (>1s sin que el silencio diga algo).
5. Frases que se contradicen y la persona se corrige sola.
6. Saludos genéricos al inicio si no aportan ("hola, qué tal, bueno...").
7. Despedidas redundantes al final.
8. Cualquier cosa que un editor profesional cortaría sin pestañear.

NO CORTES:
- Pausas dramáticas intencionadas (las que generan tension).
- Frases conectoras esenciales para el sentido.
- Énfasis con repetición intencional ("nunca, nunca jamás").

OUTPUT: array de cortes con timestamps EXACTOS del transcript original (start, end, reason).
- "start" y "end" son segundos (decimales OK, ej 4.32).
- "end" debe ser estrictamente mayor que "start".
- "reason" es UNA frase corta explicando por qué se corta.
- NO solapes intervalos.
- Ordena por start ascendente.

Si no hay nada que cortar (raro), devuelve cuts: [].`

const SYSTEM_PROMPT_SOFT = `Eres un editor de Reels conservador. Solo cortas lo que es CLARAMENTE basura. Misma estructura que el modo agresivo pero MUCHO más conservador:

SOLO CORTAR:
1. Muletillas obvias: "eh", "este", "o sea" pronunciados aislados como filler.
2. Repeticiones LITERALES de la misma frase (no parafraseos).
3. Falsos arranques EVIDENTES (frase truncada + reinicio explícito).

Si dudas, NO cortes. Mejor mantener algo extra que sacrificar contenido.

OUTPUT: array de cortes (start, end, reason) en segundos del transcript original. Misma estructura.`

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY no configurado en .env.local')
  return createOpenRouter({ apiKey })(LLM_EDIT_MODEL)
}

function buildUserPrompt(words: WhisperWord[]): string {
  // Compactamos el transcript en formato [start-end] palabra para que el LLM
  // pueda razonar sobre timestamps sin que el JSON sea ridículo.
  const lines = words.map(
    (w) => `[${w.start.toFixed(2)}-${w.end.toFixed(2)}] ${w.word}`,
  )
  return `Transcript con timestamps (segundos del video original):

${lines.join('\n')}

Devuelve los tramos a cortar.`
}

/**
 * Llama al LLM y devuelve los cortes a aplicar al video original.
 * Si mode='off' devuelve cuts: [] sin llamar.
 */
export async function detectLlmCuts(
  transcript: WhisperTranscript,
  mode: LlmEditMode = 'aggressive',
): Promise<LlmEditOutput> {
  if (mode === 'off' || transcript.words.length === 0) {
    return { cuts: [], total_seconds_removed: 0, notes: 'mode=off o transcript vacío' }
  }

  const systemPrompt = mode === 'aggressive' ? SYSTEM_PROMPT_AGGRESSIVE : SYSTEM_PROMPT_SOFT
  const userPrompt = buildUserPrompt(transcript.words)

  const result = await generateObject({
    model: getModel(),
    schema: LlmEditOutputSchema,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: LLM_EDIT_TEMPERATURE,
  })

  return result.object
}

/**
 * Filtra las palabras del transcript para excluir las que caen DENTRO de los
 * tramos cortados por el LLM. Devuelve el transcript "post-LLM" listo para
 * pasar a silence-trim.
 *
 * Una palabra se elimina si su [start, end] cae al menos 50% dentro de un cut.
 */
export function applyLlmCutsToWords(
  words: WhisperWord[],
  cuts: LlmCut[],
): WhisperWord[] {
  if (cuts.length === 0) return words
  const sortedCuts = [...cuts].sort((a, b) => a.start - b.start)

  return words.filter((w) => {
    const wordMidpoint = (w.start + w.end) / 2
    for (const cut of sortedCuts) {
      if (wordMidpoint >= cut.start && wordMidpoint <= cut.end) return false
    }
    return true
  })
}
