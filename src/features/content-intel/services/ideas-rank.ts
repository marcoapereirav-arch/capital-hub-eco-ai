import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { LLM_CROSS_QUERY_MODEL, LLM_TEMPERATURE_ANALYZE } from '../constants'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import { loadBrandContext } from './brand-context'
import { runCorpusSelectionForChat } from './corpus-chat-selection'
import type { Platform } from '../types/platform'
import type { ViralLabFilters } from '../types/viral-lab'

/**
 * Ranking de ideas por potencial de palanca.
 *
 * Aplica la "teoría del cuello de botella" a la generación de contenido:
 * dadas N ideas pendientes del usuario, el sistema NO va a ideas random
 * sino que rankea cuáles tienen MAYOR potencial AHORA, según:
 *   1. Patrones del corpus filtrado (qué viraliza en su nicho ahora)
 *   2. Avatar Andrés (qué dolor real toca cada idea)
 *   3. Brand playbook (alineación con voz y posicionamiento)
 *   4. Momento de la cuenta (fase de crecimiento)
 *
 * Devuelve cada idea con:
 *   - score: 0-100 (potencial de palanca)
 *   - funnel: 'TOFU' | 'MOFU' | 'BOFU'
 *   - reason: por qué este score
 *   - hook_preview: hook propuesto en ≤12 palabras (para que veas el ángulo)
 *   - corpus_anchor: referencia específica del corpus que la apoya
 */

// ============================================================
// Schema de salida (Zod simple sin constraints — Anthropic via OpenRouter)
// ============================================================

const RankedIdeaSchema = z.object({
  idea_id: z.string(),
  score: z.number(),
  funnel: z.enum(['TOFU', 'MOFU', 'BOFU']),
  reason: z.string(),
  hook_preview: z.string(),
  corpus_anchor: z.string(),
})

const RankResultSchema = z.object({
  ranked: z.array(RankedIdeaSchema),
  bottleneck_analysis: z.string(),
})

export type RankedIdea = z.infer<typeof RankedIdeaSchema>
export type RankResult = z.infer<typeof RankResultSchema>

// ============================================================
// System prompt — teoría del cuello de botella aplicada
// ============================================================

const RANK_SYSTEM_PROMPT = `Eres analista estratega de contenido para Adrián Villanueva (Capital Hub). Tu trabajo: dado un conjunto de ideas pendientes + patrones del corpus + avatar + playbook, identificar cuáles ideas tienen MAYOR potencial de palanca AHORA.

PRINCIPIO RECTOR — TEORÍA DEL CUELLO DE BOTELLA:
La mayoría de creadores publican ideas random. Tu trabajo es DETECTAR cuál es el cuello de botella ACTUAL de la cuenta y priorizar las ideas que más lo desbloquean.

Los posibles cuellos de botella son (en orden típico de aparición):
1. ALCANCE — la cuenta no llega a gente nueva → priorizar TOFU contrarian fuerte
2. RETENCIÓN — llegan pero no se quedan → priorizar MOFU founder story que conecta
3. CONFIANZA — siguen pero no leen / no convierten → priorizar BOFU + autoridad por hechos
4. CONVERSIÓN — leen pero no actúan → priorizar BOFU + CTAs claros + lead magnet

Para cada idea evalúa:
1. ¿Qué patrón del corpus la valida? Cita ejemplo concreto (@handle + dato si lo sabes)
2. ¿Toca un nervio específico de Andrés (avatar)? Cuál exactamente
3. ¿Encaja con la voz/posicionamiento del playbook? ¿O suena a otro creador?
4. ¿Es TOFU (reach), MOFU (connection) o BOFU (authority/conversion)? Razónalo
5. Score 0-100 (palanca total):
   - 90-100: viral inevitable + avatar al 10 + voz Adrián limpia
   - 70-89: probable viral + avatar fuerte + voz alineada
   - 50-69: bueno pero un eje cojo (no es viral / no toca avatar fuerte / no es voz Adrián)
   - 30-49: pasable, sin palanca clara
   - 0-29: descartar o reformular profundamente

ANTI-PATRONES (penalizan score):
- Ideas que suenan a "X, no Y" simétrico
- Ideas que parecen traducidas del inglés
- Ideas motivacionales genéricas
- Ideas que abren con pregunta retórica vacía
- Ideas que repiten lo que ya hizo otro creador del corpus literal

Además del ranking, dame al inicio un "bottleneck_analysis" de 100-150 palabras: qué crees que es el cuello de botella ACTUAL de la cuenta basándote en los datos que ves, y por qué tu top 5 ataca específicamente ese cuello.

OUTPUT: JSON estricto con bottleneck_analysis (string) + ranked[] (todas las ideas con sus scores, ordenadas de mayor a menor score). NO te saltes ninguna idea — todas deben aparecer en ranked[].`

// ============================================================
// API pública
// ============================================================

export interface RankIdeasInput {
  userId: string
  filters: ViralLabFilters
  platform?: Platform
  totalLimit?: number
}

export interface RankIdeasResult {
  bottleneck_analysis: string
  ranked: Array<RankedIdea & { content: string }>
  videos_used: number
  tokens_used: number
  cost_usd: number
}

export async function rankIdeasByPotential(
  input: RankIdeasInput,
): Promise<RankIdeasResult> {
  const supabase = createAdminClient()

  // 1) Cargar ideas pendientes del usuario
  const { data: ideas, error: ideasErr } = await supabase
    .from('ci_ideas')
    .select('id, content, position_in_source')
    .eq('user_id', input.userId)
    .eq('status', 'pending')
    .order('position_in_source', { ascending: true, nullsFirst: false })
    .limit(100)
  if (ideasErr) throw new ContentIntelError('load_ideas_failed', ideasErr.message)
  if (!ideas || ideas.length === 0) {
    throw new ContentIntelError(
      'no_pending_ideas',
      'No tienes ideas pendientes para rankear. Sincroniza tu doc primero.',
    )
  }

  // 2) Preparar el corpus filtrado (selectVideos + transcribe + analyze)
  const selection = await runCorpusSelectionForChat({
    filters: input.filters,
    totalLimit: input.totalLimit ?? 20,
    platform: input.platform ?? 'instagram',
  })

  // 3) Cargar brand context
  const brand = await loadBrandContext()

  // 4) Construir el prompt user
  const ideasBlock = ideas
    .map(
      (i, idx) =>
        `### Idea ${idx + 1} (id: ${i.id})\n${(i.content as string).slice(0, 600)}`,
    )
    .join('\n\n')

  const userPrompt = [
    '# BRAND PLAYBOOK',
    brand.playbook.text.slice(0, 5000),
    '',
    '# AVATAR ANDRÉS',
    brand.avatar.text.slice(0, 5000),
    '',
    '# ANÁLISIS DEL CORPUS FILTRADO (patrones que funcionan AHORA)',
    selection.analysisMd,
    '',
    `# IDEAS A RANKEAR (${ideas.length} pendientes)`,
    'Rankea TODAS estas ideas según el principio del cuello de botella. NINGUNA puede faltar en tu output.',
    '',
    ideasBlock,
  ].join('\n')

  // 5) Llamada LLM con structured output
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  const model = createOpenRouter({
    apiKey,
    extraBody: { provider: { order: ['Anthropic'], allow_fallbacks: false } },
  })(LLM_CROSS_QUERY_MODEL)

  let result
  try {
    result = await generateObject({
      model,
      schema: RankResultSchema,
      system: RANK_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: LLM_TEMPERATURE_ANALYZE,
      maxOutputTokens: 8000,
    })
  } catch (err) {
    throw new ContentIntelError('rank_failed', toErrorMessage(err))
  }

  // 6) Cruzar ranked con el contenido original de cada idea
  const ideasMap = new Map(ideas.map((i) => [i.id as string, i.content as string]))
  const rankedWithContent = result.object.ranked
    .filter((r) => ideasMap.has(r.idea_id))
    .map((r) => ({
      ...r,
      content: ideasMap.get(r.idea_id) ?? '',
    }))
    .sort((a, b) => b.score - a.score)

  const tokens = result.usage?.totalTokens ?? 0
  const cost = (tokens / 1_000_000) * 3

  return {
    bottleneck_analysis: result.object.bottleneck_analysis,
    ranked: rankedWithContent,
    videos_used: selection.videosUsed,
    tokens_used: tokens,
    cost_usd: cost,
  }
}
