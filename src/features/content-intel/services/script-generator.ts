import { generateObject, generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  LLM_CROSS_QUERY_MODEL,
  LLM_SCRIPT_GENERATOR_MODEL,
  LLM_TEMPERATURE_ANALYZE,
  LLM_TEMPERATURE_GENERATE,
} from '../constants'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import {
  SCRIPT_GENERATOR_SYSTEM_PROMPT,
  buildScriptUserPrompt,
  type GenerateScriptInput,
  type OwnVoiceSample,
} from '../prompts/generate-script'
import { loadBrandContext } from './brand-context'
import type { Platform } from '../types/platform'
import type { ContentPillar, ScriptOutput, ScriptRow } from '../types/script'
import type { ViralLabFilters } from '../types/viral-lab'

// Schema simple sin constraints min/max para compatibilidad con Azure (OpenRouter).
const ScriptOutputSchema: z.ZodType<ScriptOutput> = z.object({
  title: z.string(),
  hook_variants: z.array(z.string()),
  body: z.string(),
  beats: z.array(
    z.object({
      label: z.string(),
      text: z.string(),
    }),
  ),
  cta: z.string(),
  production_notes: z.string(),
  duration_estimate_s: z.number(),
  references_used: z.array(
    z.object({
      video_id: z.string(),
      reason: z.string(),
    }),
  ),
})

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  return createOpenRouter({ apiKey })(LLM_SCRIPT_GENERATOR_MODEL)
}

async function fetchReferences(
  supabase: SupabaseClient,
  videoIds: string[],
): Promise<GenerateScriptInput['references']> {
  if (videoIds.length === 0) return []

  const { data: videos, error } = await supabase
    .from('ci_videos')
    .select('id, account_id, caption, transcript, views')
    .in('id', videoIds)
  if (error) throw new ContentIntelError('fetch_refs_failed', error.message)

  const accountIds = [...new Set((videos ?? []).map((v) => v.account_id as string))]
  let handleMap = new Map<string, string>()
  if (accountIds.length > 0) {
    const { data: accounts } = await supabase
      .from('ci_seed_accounts')
      .select('id, handle')
      .in('id', accountIds)
    for (const a of accounts ?? []) handleMap.set(a.id as string, a.handle as string)
  }

  return (videos ?? []).map((v) => ({
    id: v.id as string,
    handle: handleMap.get(v.account_id as string) ?? '?',
    caption: (v.caption as string | null) ?? null,
    transcript: (v.transcript as string | null) ?? null,
    views: (v.views as number | null) ?? null,
  }))
}

/**
 * Trae transcripts de TODOS los videos del propio Adrián (cuentas marcadas
 * is_own=true) para que el modelo pueda calibrar el tono de voz.
 *
 * Sin esto, los guiones suenan a "IA generando contenido emprendedor"
 * porque el modelo solo tiene el playbook como referencia de tono. Con los
 * transcripts del propio Adrián, puede detectar su ritmo, léxico y
 * cadencia reales.
 *
 * Tope: 8 videos más recientes (≈12k chars de contexto). Si falla la
 * query no rompemos la generación — devolvemos array vacío y se fallback
 * a calibración solo via playbook.
 */
async function fetchOwnVoiceSamples(
  supabase: SupabaseClient,
): Promise<OwnVoiceSample[]> {
  const { data, error } = await supabase
    .from('ci_videos')
    .select('caption, transcript, ci_seed_accounts!inner(is_own)')
    .eq('ci_seed_accounts.is_own', true)
    .not('transcript', 'is', null)
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(8)

  if (error) {
    console.warn(`[script-gen] own voice fetch failed: ${error.message}`)
    return []
  }

  return (data ?? [])
    .map((v) => ({
      caption: (v.caption as string | null) ?? null,
      transcript: (v.transcript as string | null) ?? '',
    }))
    .filter((s) => s.transcript.length > 30)
}

// ============================================================
// CORPUS PATTERN EXTRACTION
// ------------------------------------------------------------
// Cuando el usuario pasa filtros (cuentas, min_views, etc.) al
// generar un guion, esta función:
//   1. Selecciona los top videos del corpus que cumplen filtros
//   2. Hace 1 llamada LLM corta (Claude Sonnet) que extrae los
//      hooks, estructuras narrativas y CTAs DOMINANTES.
//   3. Devuelve un markdown corto que se inyecta al prompt de
//      script generation como contexto "qué funciona aquí".
//
// NO hace análisis exhaustivo (eso es trabajo del Viral Lab full).
// Output objetivo: ~600-1000 tokens, lo justo para anclar el guion.
// ============================================================

const CORPUS_PATTERN_SYSTEM_PROMPT = `Eres analista de patrones de Reels para un copywriter. Recibes 10-30 transcripts de videos virales del nicho del usuario y extraes los patrones DOMINANTES — hooks, estructuras, CTAs — que mejor funcionan según engagement.

OUTPUT: markdown corto (máx 800 palabras) con esta estructura:

## Hooks recurrentes
3-5 patrones de hook (ej: "afirmación contrarian", "credencial+promesa", "pregunta provocadora") con 1-2 ejemplos literales cada uno.

## Estructura narrativa más usada
1-2 estructuras dominantes (ej: "anécdota → moraleja", "lista 3-puntos", "hot take + reasoning").

## Tonos / energía
Cómo abren, cómo escalan, cómo cierran. Lenguaje recurrente.

## CTAs observados
Los 2-3 CTAs más vistos (ej: "comenta palabra X", "guarda", "DM").

NO copies guiones enteros. NO incluyas tu opinión. Es contexto descriptivo para que otro modelo escriba un guion grounded en estos patrones. Sé conciso.`

interface CorpusVideo {
  handle: string
  views: number | null
  caption: string | null
  transcript: string
}

async function selectCorpusVideosForGrounding(
  supabase: SupabaseClient,
  filters: ViralLabFilters,
  platform: Platform,
): Promise<CorpusVideo[]> {
  let q = supabase
    .from('ci_videos')
    .select(`
      caption, transcript, views,
      ci_seed_accounts!inner(handle, is_own)
    `)
    .eq('platform', platform)
    .not('transcript', 'is', null)

  if (filters.account_ids && filters.account_ids.length > 0) {
    q = q.in('account_id', filters.account_ids)
  }
  if (filters.min_views !== undefined) q = q.gte('views', filters.min_views)
  if (filters.from_date) q = q.gte('posted_at', filters.from_date)
  if (filters.to_date) q = q.lte('posted_at', filters.to_date)

  const orderBy = filters.order_by ?? 'engagement_rate'
  q = q.order(orderBy, { ascending: false, nullsFirst: false }).limit(40)

  const { data, error } = await q
  if (error) {
    console.warn(`[script-gen/grounding] select failed: ${error.message}`)
    return []
  }

  const rows = (data ?? []) as unknown as Array<{
    caption: string | null
    transcript: string | null
    views: number | null
    ci_seed_accounts: { handle: string; is_own: boolean }
  }>

  // Excluimos own (la voz propia entra por otro canal). Aquí solo competencia.
  const externalOnly = rows.filter((r) => !r.ci_seed_accounts.is_own)

  // top_n_per_account: si está, deduplicamos
  let final = externalOnly
  if (filters.top_n_per_account && filters.top_n_per_account > 0) {
    const perHandle = new Map<string, number>()
    final = []
    for (const r of externalOnly) {
      const handle = r.ci_seed_accounts.handle
      const count = perHandle.get(handle) ?? 0
      if (count >= filters.top_n_per_account) continue
      perHandle.set(handle, count + 1)
      final.push(r)
    }
  }

  // Cap final: max 25 videos para que el prompt no se infle
  final = final.slice(0, 25)

  return final.map((r) => ({
    handle: r.ci_seed_accounts.handle,
    views: r.views,
    caption: r.caption,
    transcript: (r.transcript ?? '').slice(0, 1500),
  }))
}

async function extractCorpusPatterns(
  supabase: SupabaseClient,
  filters: ViralLabFilters,
  platform: Platform,
): Promise<{ markdown: string; videos_used: number; tokens: number }> {
  const videos = await selectCorpusVideosForGrounding(supabase, filters, platform)

  if (videos.length === 0) {
    return {
      markdown: '_No se encontraron videos en el corpus que cumplan los filtros aplicados. El guion se generará sin grounding del corpus._',
      videos_used: 0,
      tokens: 0,
    }
  }

  const corpusBlock = videos
    .map(
      (v, i) =>
        `### Video ${i + 1} — @${v.handle}${v.views ? ` · ${v.views} views` : ''}\n${
          v.caption ? `Caption: ${v.caption.slice(0, 200)}\n` : ''
        }Transcript: ${v.transcript}`,
    )
    .join('\n\n')

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  const model = createOpenRouter({
    apiKey,
    extraBody: { provider: { order: ['Anthropic'], allow_fallbacks: false } },
  })(LLM_CROSS_QUERY_MODEL)

  try {
    const { text, usage } = await generateText({
      model,
      system: CORPUS_PATTERN_SYSTEM_PROMPT,
      prompt: `Aquí están ${videos.length} videos virales del corpus filtrado del usuario:\n\n${corpusBlock}\n\nExtrae los patrones dominantes en markdown según el formato indicado.`,
      temperature: LLM_TEMPERATURE_ANALYZE,
      maxOutputTokens: 1500,
    })
    return {
      markdown: text,
      videos_used: videos.length,
      tokens: usage?.totalTokens ?? 0,
    }
  } catch (err) {
    console.warn(`[script-gen/grounding] LLM failed: ${toErrorMessage(err)}`)
    return {
      markdown: '_Hubo un error analizando el corpus filtrado. El guion se genera sin grounding._',
      videos_used: videos.length,
      tokens: 0,
    }
  }
}

function scriptToMarkdown(script: ScriptOutput): string {
  const hooks = script.hook_variants.map((h, i) => `${i + 1}. ${h}`).join('\n')
  const beats = script.beats.map((b) => `- **${b.label}**: ${b.text}`).join('\n')

  return [
    `# ${script.title}`,
    '',
    '## Hooks (A/B)',
    hooks,
    '',
    '## Guion',
    script.body,
    '',
    '## Estructura por beats',
    beats,
    '',
    '## CTA',
    script.cta,
    '',
    '## Notas de producción',
    script.production_notes,
    '',
    `_Duración estimada: ${script.duration_estimate_s}s_`,
  ].join('\n')
}

export interface GenerateScriptApiInput {
  brief: string
  platform: Platform
  duration_target_s?: number
  content_pillar?: ContentPillar | string
  reference_video_ids?: string[]
  /**
   * Si está presente, el endpoint extrae patrones del corpus filtrado
   * (hooks/estructuras/CTAs dominantes) y los inyecta al prompt como
   * grounding. Sin esto, el guion solo se basa en brand + voz propia.
   */
  corpus_filters?: ViralLabFilters
}

export async function generateScript(input: GenerateScriptApiInput): Promise<ScriptRow> {
  const supabase = createAdminClient()

  const brand = await loadBrandContext()
  const references = await fetchReferences(supabase, input.reference_video_ids ?? [])
  const ownVoiceSamples = await fetchOwnVoiceSamples(supabase)

  // Si hay filtros, extraemos patrones del corpus filtrado (1 LLM call corta)
  let corpusPatternsMd: string | null = null
  let groundingTokens = 0
  let groundingVideos = 0
  if (input.corpus_filters) {
    const grounding = await extractCorpusPatterns(
      supabase,
      input.corpus_filters,
      input.platform,
    )
    corpusPatternsMd = grounding.markdown
    groundingTokens = grounding.tokens
    groundingVideos = grounding.videos_used
    console.log(
      `[script-gen] grounding · ${groundingVideos} videos · ${groundingTokens} tokens`,
    )
  }

  const promptInput: GenerateScriptInput = {
    brief: input.brief,
    platform: input.platform,
    duration_target_s: input.duration_target_s ?? null,
    content_pillar: input.content_pillar ?? null,
    brand,
    references,
    own_voice_samples: ownVoiceSamples,
    corpus_patterns_markdown: corpusPatternsMd,
  }

  const userPrompt = buildScriptUserPrompt(promptInput)

  let generated: ScriptOutput
  let tokens = 0
  try {
    const { object, usage } = await generateObject({
      model: getModel(),
      schema: ScriptOutputSchema,
      system: SCRIPT_GENERATOR_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: LLM_TEMPERATURE_GENERATE,
      maxOutputTokens: 4500,
    })
    generated = object
    tokens = usage?.totalTokens ?? 0
  } catch (err) {
    throw new ContentIntelError('script_gen_failed', toErrorMessage(err), err)
  }

  const llmMarkdown = scriptToMarkdown(generated)
  const totalTokens = tokens + groundingTokens
  const cost = (totalTokens / 1_000_000) * 3

  const { data, error } = await supabase
    .from('ci_scripts')
    .insert({
      brief: input.brief,
      platform: input.platform,
      duration_target_s: input.duration_target_s ?? null,
      content_pillar: input.content_pillar ?? null,
      reference_video_ids: input.reference_video_ids ?? [],
      playbook_snapshot_text: brand.playbook.text,
      playbook_snapshot_hash: brand.playbook.hash,
      avatar_snapshot_text: brand.avatar.text,
      avatar_snapshot_hash: brand.avatar.hash,
      prompt_used: userPrompt,
      llm_output: generated,
      llm_output_markdown: llmMarkdown,
      status: 'draft',
      model: LLM_SCRIPT_GENERATOR_MODEL,
      tokens_used: totalTokens,
      cost_usd: cost,
    })
    .select('*')
    .single()

  if (error) throw new ContentIntelError('script_save_failed', error.message)
  return data as ScriptRow
}

export async function listScripts(supabase: SupabaseClient, limit = 50): Promise<ScriptRow[]> {
  const { data, error } = await supabase
    .from('ci_scripts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new ContentIntelError('list_scripts_failed', error.message)
  return (data ?? []) as ScriptRow[]
}

export async function getScript(
  supabase: SupabaseClient,
  id: string,
): Promise<ScriptRow | null> {
  const { data, error } = await supabase
    .from('ci_scripts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new ContentIntelError('get_script_failed', error.message)
  return (data ?? null) as ScriptRow | null
}

export async function updateScript(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<ScriptRow, 'user_edited_markdown' | 'status'>>,
): Promise<ScriptRow> {
  const { data, error } = await supabase
    .from('ci_scripts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new ContentIntelError('update_script_failed', error.message)
  return data as ScriptRow
}

export async function deleteScript(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('ci_scripts').delete().eq('id', id)
  if (error) throw new ContentIntelError('delete_script_failed', error.message)
}
