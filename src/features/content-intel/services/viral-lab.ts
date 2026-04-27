import { generateObject, generateText, type ModelMessage } from 'ai'
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
  VIRAL_LAB_PATTERN_SYSTEM_PROMPT,
  VIRAL_LAB_SCRIPT_SYSTEM_PROMPT,
  buildViralLabPatternPrompt,
  buildViralLabScriptPrompt,
} from '../prompts/viral-lab'
import { loadBrandContext } from './brand-context'
import { transcribeBatch } from './transcribe-pipeline'
import {
  VIRAL_INTENT_DEFAULT_DURATION,
  VIRAL_INTENT_DEFAULT_PILLAR,
  VIRAL_INTENTS,
  type AngleSuggestion,
  type StudioChatInput,
  type StudioChatResult,
  type StudioIntent,
  type ViralIntent,
  type ViralLabInput,
  type ViralLabResult,
} from '../types/viral-lab'
import type { ScriptOutput } from '../types/script'

const MAX_VIDEOS_HARD_CAP = 100
const MAX_AUTO_TRANSCRIBE = 100

// Schema simple sin constraints para script generation (Anthropic/Azure-compat)
const ScriptOutputSchema: z.ZodType<ScriptOutput> = z.object({
  title: z.string(),
  hook_variants: z.array(z.string()),
  body: z.string(),
  beats: z.array(z.object({ label: z.string(), text: z.string() })),
  cta: z.string(),
  production_notes: z.string(),
  duration_estimate_s: z.number(),
  references_used: z.array(z.object({ video_id: z.string(), reason: z.string() })),
})

// Forzamos routing a Anthropic (no Azure) — Azure impone restricciones en JSON schemas
// y nuestras schemas estructuradas son demasiado complejas para ese backend.
const OPENROUTER_PROVIDER_PREFERENCE = {
  provider: { order: ['Anthropic'], allow_fallbacks: false },
} as const

function getAnalyzerModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  return createOpenRouter({ apiKey, extraBody: OPENROUTER_PROVIDER_PREFERENCE })(
    LLM_CROSS_QUERY_MODEL,
  )
}

function getScriptModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  return createOpenRouter({ apiKey, extraBody: OPENROUTER_PROVIDER_PREFERENCE })(
    LLM_SCRIPT_GENERATOR_MODEL,
  )
}

// ---------- Paso 1: Seleccionar videos según filtros ----------

interface SelectedVideo {
  id: string
  account_id: string
  handle: string
  role: string
  is_own: boolean
  views: number | null
  likes: number | null
  comments: number | null
  caption: string | null
  transcript: string | null
}

async function selectVideos(
  supabase: SupabaseClient,
  input: ViralLabInput,
): Promise<SelectedVideo[]> {
  const { filters, total_limit } = input
  const cap = Math.min(total_limit, MAX_VIDEOS_HARD_CAP)

  // Query base
  let q = supabase.from('ci_videos').select(`
    id, account_id, views, likes, comments, caption, transcript, posted_at,
    ci_seed_accounts!inner(handle, role, is_own)
  `)

  q = q.eq('platform', input.platform)

  if (filters.account_ids && filters.account_ids.length > 0) {
    q = q.in('account_id', filters.account_ids)
  }
  if (filters.min_views !== undefined) q = q.gte('views', filters.min_views)
  if (filters.from_date) q = q.gte('posted_at', filters.from_date)
  if (filters.to_date) q = q.lte('posted_at', filters.to_date)

  const orderBy = filters.order_by ?? 'engagement_rate'
  q = q.order(orderBy, { ascending: false, nullsFirst: false })

  // Sobre-traemos un margen para poder hacer top-N per-account si aplica
  const overfetch = Math.min(500, cap * 5)
  q = q.limit(overfetch)

  const { data, error } = await q
  if (error) throw new ContentIntelError('select_videos_failed', error.message)

  const rows = (data ?? []) as unknown as Array<{
    id: string
    account_id: string
    views: number | null
    likes: number | null
    comments: number | null
    caption: string | null
    transcript: string | null
    ci_seed_accounts: { handle: string; role: string; is_own: boolean }
  }>

  const mapped: SelectedVideo[] = rows.map((r) => ({
    id: r.id,
    account_id: r.account_id,
    handle: r.ci_seed_accounts.handle,
    role: r.ci_seed_accounts.role,
    is_own: r.ci_seed_accounts.is_own,
    views: r.views,
    likes: r.likes,
    comments: r.comments,
    caption: r.caption,
    transcript: r.transcript,
  }))

  // Si top_n_per_account está definido, aplicamos dedup por cuenta
  if (filters.top_n_per_account && filters.top_n_per_account > 0) {
    const perAccountCount = new Map<string, number>()
    const filtered: SelectedVideo[] = []
    for (const v of mapped) {
      const count = perAccountCount.get(v.account_id) ?? 0
      if (count >= filters.top_n_per_account) continue
      perAccountCount.set(v.account_id, count + 1)
      filtered.push(v)
      if (filtered.length >= cap) break
    }
    return filtered
  }

  return mapped.slice(0, cap)
}

// ---------- Paso 2: Auto-transcribir los que falten ----------

async function ensureTranscriptions(
  supabase: SupabaseClient,
  videos: SelectedVideo[],
): Promise<SelectedVideo[]> {
  const needTranscript = videos.filter((v) => !v.transcript)
  if (needTranscript.length === 0) return videos
  if (needTranscript.length > MAX_AUTO_TRANSCRIBE) {
    throw new ContentIntelError(
      'too_many_untranscribed',
      `Demasiados videos sin transcribir (${needTranscript.length}). Reduce el filtro o transcribe manualmente.`,
    )
  }

  console.log(`[viral-lab] Auto-transcribing ${needTranscript.length} videos...`)
  await transcribeBatch({ video_ids: needTranscript.map((v) => v.id) })

  // Re-fetch para traer transcripts actualizados
  const { data, error } = await supabase
    .from('ci_videos')
    .select('id, transcript')
    .in(
      'id',
      needTranscript.map((v) => v.id),
    )
  if (error) throw new ContentIntelError('refetch_transcripts_failed', error.message)

  const transcriptMap = new Map<string, string | null>()
  for (const row of data ?? []) {
    transcriptMap.set(row.id as string, row.transcript as string | null)
  }

  return videos.map((v) => {
    if (!v.transcript && transcriptMap.has(v.id)) {
      return { ...v, transcript: transcriptMap.get(v.id) ?? null }
    }
    return v
  })
}

// ---------- Paso 3: Análisis de patrones ----------

function buildFilterDescription(input: ViralLabInput, selectedCount: number): string {
  const { filters } = input
  const parts: string[] = [`${selectedCount} videos seleccionados`]
  if (filters.account_ids && filters.account_ids.length > 0) {
    parts.push(`${filters.account_ids.length} cuentas específicas`)
  } else {
    parts.push('todas las cuentas activas')
  }
  if (filters.min_views) parts.push(`min_views=${filters.min_views}`)
  if (filters.from_date) parts.push(`desde=${filters.from_date}`)
  if (filters.to_date) parts.push(`hasta=${filters.to_date}`)
  if (filters.order_by) parts.push(`orden=${filters.order_by}`)
  if (filters.top_n_per_account) parts.push(`top_por_cuenta=${filters.top_n_per_account}`)
  return parts.join(' · ')
}

interface AnalysisResult {
  markdown: string
  ownVideosAnalyzed: number
  videosUsed: SelectedVideo[]
  tokens: number
}

async function analyzePatterns(
  videos: SelectedVideo[],
  input: ViralLabInput,
): Promise<AnalysisResult> {
  const videosWithTranscript = videos.filter(
    (v) => v.transcript && v.transcript.length > 10 && v.transcript !== '[NO_SPEECH]',
  )
  if (videosWithTranscript.length === 0) {
    throw new ContentIntelError(
      'no_transcripts_available',
      'Ninguno de los videos seleccionados tiene transcripción. Transcribe algunos manualmente primero.',
    )
  }

  const external = videosWithTranscript
    .filter((v) => !v.is_own)
    .map((v) => ({
      video_id: v.id,
      handle: v.handle,
      role: v.role,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      caption: v.caption,
      transcript: v.transcript ?? '',
    }))

  const own = videosWithTranscript
    .filter((v) => v.is_own)
    .map((v) => ({
      video_id: v.id,
      views: v.views,
      caption: v.caption,
      transcript: v.transcript ?? '',
    }))

  const userPrompt = buildViralLabPatternPrompt({
    filter_description: buildFilterDescription(input, videosWithTranscript.length),
    external_videos: external,
    own_videos: own,
  })

  // Generamos markdown directo (no JSON) para evitar límites de schema de providers.
  const { text, usage } = await generateText({
    model: getAnalyzerModel(),
    system: VIRAL_LAB_PATTERN_SYSTEM_PROMPT_MD,
    prompt: userPrompt,
    temperature: LLM_TEMPERATURE_ANALYZE,
    maxOutputTokens: 8000,
  })

  return {
    markdown: text,
    ownVideosAnalyzed: own.length,
    videosUsed: videosWithTranscript,
    tokens: usage?.totalTokens ?? 0,
  }
}

// System prompt override: pedimos markdown directo en vez de JSON
const VIRAL_LAB_PATTERN_SYSTEM_PROMPT_MD = `${VIRAL_LAB_PATTERN_SYSTEM_PROMPT}

FORMATO DE SALIDA: devuelve un REPORTE EN MARKDOWN con esta estructura exacta:

# Análisis Viral Lab

## Corpus analizado
- Filtro aplicado: [copia del input]
- Cuentas: [@handles]
- Videos usados: [X]

## Hooks recurrentes
Agrupa por tipología (afirmación disruptiva, pregunta provocadora, credencial+promesa, historia personal, contraste, contrarian, etc.). Para cada grupo:
- Nombre del patrón
- Descripción breve
- 3 ejemplos literales con @handle + views + snippet exacto

## Estructuras narrativas dominantes
(emocional→moraleja, hot take+lista, historia+enseñanza, etc.)

## CTAs observados
(comentar palabra, follow, link bio, DM, etc.)

## Cierres aforísticos más usados
(frases finales literales)

## Disparadores emocionales
(indignación, validación, aspiración, miedo, identificación, morbo...)

## Voz de Adrián detectada
Si hay videos propios analizados:
- Ritmo
- Frases recurrentes (lista)
- Estructuras que usa
- Temas
- Notas finales

Si no hay videos propios: indica "Sin transcripciones propias — calibración genérica".

Sé específico. Cita videos reales. No inventes.`

// ---------- Paso 5: Generar N scripts con patrones ----------

function extractVoiceSummary(analysisMarkdown: string): string | null {
  // Extrae la sección "Voz de Adrián detectada" del markdown del análisis
  const match = analysisMarkdown.match(/##\s*Voz de Adri[áa]n[^#]*(?=\n##|$)/i)
  if (!match) return null
  const section = match[0]
  if (/sin transcripciones propias/i.test(section)) return null
  return section.trim()
}

async function generateSingleScript(
  intent: ViralIntent,
  extraBrief: string,
  analysisMarkdown: string,
  brand: { playbook: { text: string; hash: string }; avatar: { text: string; hash: string } },
  voiceSummary: string | null,
  scriptIndex: number,
  totalScripts: number,
): Promise<{ script: ScriptOutput; tokens: number; userPrompt: string }> {
  const userPrompt = buildViralLabScriptPrompt({
    brand_playbook: brand.playbook.text,
    avatar: brand.avatar.text,
    pattern_analysis_markdown: analysisMarkdown,
    voice_summary: voiceSummary,
    intent,
    extra_brief: extraBrief,
    script_index: scriptIndex,
    total_scripts: totalScripts,
  })

  const { object, usage } = await generateObject({
    model: getScriptModel(),
    schema: ScriptOutputSchema,
    system: VIRAL_LAB_SCRIPT_SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: LLM_TEMPERATURE_GENERATE,
    maxOutputTokens: 4500,
  })

  return { script: object, tokens: usage?.totalTokens ?? 0, userPrompt }
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

// ---------- Orquestador principal ----------

// ---------- Detección de ángulos accionables ----------

const AngleSchema = z.object({
  title: z.string(),
  hook_idea: z.string(),
  why_it_works: z.string(),
  avatar_fit: z.enum(['alta', 'media', 'baja']),
  suggested_intent: z.enum(VIRAL_INTENTS),
})

const AnglesSchema = z.object({
  angles: z.array(AngleSchema),
})

const ANGLES_SYSTEM_PROMPT = `Eres analista senior de marca personal. Analizas un análisis de patrones virales en español y debes proponer 5 ángulos concretos y accionables que Adrián (fundador de Capital Hub) podría grabar esta semana.

Cada ángulo:
- title: 4-8 palabras, claro, sin click-bait barato
- hook_idea: la primera frase que diría a cámara (15-25 palabras)
- why_it_works: 1-2 frases, cita el patrón viral concreto del análisis que respalda este ángulo
- avatar_fit: 'alta' si toca un nervio del avatar Andrés (frustración laboral, deseo de libertad, dudas sobre dinero, hartazgo de motivación vacía); 'media' si conecta con tema relacionado; 'baja' si es lateral
- suggested_intent: 'viral' (sin CTA, emocional/contraste) | 'cta' (táctico con call to action a lead magnet) | 'conexion' (personal, vulnerable) | 'libre' (mixto)

REGLAS:
- 5 ángulos exactos
- DIVERSIDAD: no propongas 5 angulos del mismo tema. Mezcla.
- 1 al menos con suggested_intent='cta'
- 1 al menos con suggested_intent='conexion'
- Resto pueden ser 'viral'
- Prioriza avatar_fit='alta' arriba en el orden`

async function detectAngles(analysisMarkdown: string): Promise<AngleSuggestion[]> {
  try {
    const { object } = await generateObject({
      model: getAnalyzerModel(),
      schema: AnglesSchema,
      system: ANGLES_SYSTEM_PROMPT,
      prompt: `# ANÁLISIS DE PATRONES\n\n${analysisMarkdown}\n\nPropón 5 ángulos accionables.`,
      temperature: 0.4,
      maxOutputTokens: 2500,
    })
    return object.angles.slice(0, 5)
  } catch (err) {
    console.error('[viral-lab] angle detection failed:', toErrorMessage(err))
    return []
  }
}

// Genera 1 guion desde un ángulo + análisis ya hecho (sin re-analizar)
export async function generateScriptFromAngle(args: {
  angle: AngleSuggestion
  analysis_markdown: string
  reference_video_ids: string[]
  platform: 'instagram' | 'tiktok' | 'youtube'
}): Promise<{ script_id: string; cost_usd: number; tokens_used: number }> {
  const supabase = createAdminClient()
  const brand = await loadBrandContext()
  const voiceSummary = extractVoiceSummary(args.analysis_markdown)

  const angleBrief = [
    `Ángulo elegido: ${args.angle.title}`,
    '',
    `Hook propuesto: ${args.angle.hook_idea}`,
    '',
    `Por qué funciona: ${args.angle.why_it_works}`,
  ].join('\n')

  const result = await generateSingleScript(
    args.angle.suggested_intent,
    angleBrief,
    args.analysis_markdown,
    brand,
    voiceSummary,
    0,
    1,
  )

  const llmMd = scriptToMarkdown(result.script)
  const { data: row, error } = await supabase
    .from('ci_scripts')
    .insert({
      brief: `Ángulo: ${args.angle.title}`,
      platform: args.platform,
      duration_target_s: VIRAL_INTENT_DEFAULT_DURATION[args.angle.suggested_intent],
      content_pillar: VIRAL_INTENT_DEFAULT_PILLAR[args.angle.suggested_intent],
      reference_video_ids: args.reference_video_ids,
      playbook_snapshot_text: brand.playbook.text,
      playbook_snapshot_hash: brand.playbook.hash,
      avatar_snapshot_text: brand.avatar.text,
      avatar_snapshot_hash: brand.avatar.hash,
      prompt_used: result.userPrompt.slice(0, 10000),
      llm_output: result.script,
      llm_output_markdown: llmMd,
      status: 'draft',
      model: LLM_SCRIPT_GENERATOR_MODEL,
      tokens_used: result.tokens,
      cost_usd: (result.tokens / 1_000_000) * 3,
    })
    .select('id')
    .single()
  if (error) throw new ContentIntelError('script_save_failed', error.message)

  return {
    script_id: row!.id as string,
    cost_usd: (result.tokens / 1_000_000) * 3,
    tokens_used: result.tokens,
  }
}

export async function runViralLab(input: ViralLabInput): Promise<ViralLabResult> {
  if (input.num_scripts < 0 || input.num_scripts > 10) {
    throw new ContentIntelError(
      'invalid_num_scripts',
      'num_scripts debe estar entre 0 y 10 para evitar sobrecostes.',
    )
  }
  const plan: Array<{ intent: ViralIntent; extra_brief: string }> = Array.from({
    length: input.num_scripts,
  }).map(() => ({ intent: input.intent, extra_brief: input.extra_brief ?? '' }))

  const supabase = createAdminClient()

  // 1. Seleccionar videos
  let videos = await selectVideos(supabase, input)
  const requested = videos.length
  if (requested === 0) {
    throw new ContentIntelError(
      'no_videos_match_filter',
      'Ningún video cumple el filtro. Relaja condiciones.',
    )
  }

  // 2. Asegurar transcripciones
  videos = await ensureTranscriptions(supabase, videos)

  // 3. Analizar patrones
  const { markdown: analysisMarkdown, tokens: analysisTokens, videosUsed } = await analyzePatterns(
    videos,
    input,
  )

  // 3b. Guardar análisis en ci_queries
  const { data: queryRow, error: queryErr } = await supabase
    .from('ci_queries')
    .insert({
      prompt: `VIRAL LAB · intent=${input.intent} · ${buildFilterDescription(input, videos.length)}`,
      account_ids: input.filters.account_ids ?? [],
      filters: (input.filters as unknown) as object,
      videos_used: videosUsed.map((v) => v.id),
      response_markdown: analysisMarkdown,
      model: LLM_CROSS_QUERY_MODEL,
      tokens_used: analysisTokens,
      cost_usd: (analysisTokens / 1_000_000) * 3,
      status: 'ok',
    })
    .select('id')
    .single()
  if (queryErr) console.error('[viral-lab] save query failed', queryErr.message)

  // 3c. Detectar 5 ángulos accionables (en paralelo no — necesita el análisis completo)
  const angles = await detectAngles(analysisMarkdown)

  // 4. Si plan tiene guiones, generarlos (puede ser mezcla de intents)
  const scriptIds: string[] = []
  let scriptsTokens = 0

  if (plan.length > 0) {
    const brand = await loadBrandContext()
    const voiceSummary = extractVoiceSummary(analysisMarkdown)

    const scriptResults = await Promise.all(
      plan.map((entry, i) =>
        generateSingleScript(
          entry.intent,
          entry.extra_brief,
          analysisMarkdown,
          brand,
          voiceSummary,
          i,
          plan.length,
        )
          .then((r) => ({ ...r, intent: entry.intent, extra_brief: entry.extra_brief }))
          .catch((err) => {
            console.error(`[viral-lab] script ${i + 1} failed:`, toErrorMessage(err))
            return null
          }),
      ),
    )

    for (const result of scriptResults) {
      if (!result) continue
      scriptsTokens += result.tokens
      const llmMd = scriptToMarkdown(result.script)
      const { data: scriptRow, error: scriptErr } = await supabase
        .from('ci_scripts')
        .insert({
          brief: result.extra_brief || `Viral Lab intent=${result.intent}`,
          platform: input.platform,
          duration_target_s: VIRAL_INTENT_DEFAULT_DURATION[result.intent],
          content_pillar: VIRAL_INTENT_DEFAULT_PILLAR[result.intent],
          reference_video_ids: videos.map((v) => v.id),
          playbook_snapshot_text: brand.playbook.text,
          playbook_snapshot_hash: brand.playbook.hash,
          avatar_snapshot_text: brand.avatar.text,
          avatar_snapshot_hash: brand.avatar.hash,
          prompt_used: result.userPrompt.slice(0, 10000),
          llm_output: result.script,
          llm_output_markdown: llmMd,
          status: 'draft',
          model: LLM_SCRIPT_GENERATOR_MODEL,
          tokens_used: result.tokens,
          cost_usd: (result.tokens / 1_000_000) * 3,
        })
        .select('id')
        .single()
      if (scriptErr) {
        console.error('[viral-lab] script save failed', scriptErr.message)
      } else if (scriptRow) {
        scriptIds.push(scriptRow.id as string)
      }
    }
  }

  const totalTokens = analysisTokens + scriptsTokens
  return {
    analysis_markdown: analysisMarkdown,
    angles,
    script_ids: scriptIds,
    cost_usd: (totalTokens / 1_000_000) * 3,
    tokens_used: totalTokens,
    videos_used: videosUsed.length,
    query_id: queryRow?.id ? (queryRow.id as string) : null,
    reference_video_ids: videosUsed.map((v) => v.id),
  }
}

// ---------- STUDIO CHAT (conversational interface sobre el corpus) ----------

const StudioIntentSchema = z.object({
  intent: z.enum(['generate', 'angles', 'analyze', 'chat']),
  num_scripts: z.number().min(1).max(5).optional(),
  intent_for_script: z.enum(VIRAL_INTENTS).optional(),
  brief_for_script: z.string().optional(),
})

const STUDIO_INTENT_CLASSIFIER_PROMPT = `Eres un clasificador. Lees el último mensaje del usuario en una conversación sobre creación de contenido y devuelves su intent.

INTENTS:
- "generate": el usuario pide CREAR uno o más guiones (ej: "genera 3 virales", "hazme un guion sobre dinero", "escribe uno con CTA").
- "angles": el usuario pide IDEAS o ÁNGULOS (ej: "propón 5 ángulos", "qué temas funcionarían", "dame ideas").
- "analyze": el usuario pide entender QUÉ FUNCIONA del corpus (ej: "qué patrones ves", "analiza los hooks", "qué hace bien la competencia").
- "chat": cualquier otra pregunta o conversación (ej: "cuál de estos ángulos prefieres", "explícame por qué", "qué opinas").

Si intent='generate', extrae:
- num_scripts (1-5, default 1)
- intent_for_script: 'viral' (sin CTA), 'cta' (con CTA), 'conexion' (personal), 'libre' (mixto). Default 'viral'.
- brief_for_script: el tema/ángulo que pidió el usuario, en una frase clara.`

async function classifyStudioIntent(
  message: string,
  history: StudioChatInput['history'],
): Promise<{ intent: StudioIntent; num_scripts?: number; intent_for_script?: ViralIntent; brief_for_script?: string }> {
  const recentHistory = history
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 400)}`)
    .join('\n')
  const prompt = `# HISTORIAL RECIENTE\n${recentHistory || '(sin historial)'}\n\n# MENSAJE A CLASIFICAR\n${message}`

  try {
    const { object } = await generateObject({
      model: getAnalyzerModel(),
      schema: StudioIntentSchema,
      system: STUDIO_INTENT_CLASSIFIER_PROMPT,
      prompt,
      temperature: 0,
      maxOutputTokens: 400,
    })
    return object
  } catch (err) {
    console.error('[studio-chat] intent classification failed:', toErrorMessage(err))
    // Fallback: si falla, asumimos chat genérico
    return { intent: 'chat' }
  }
}

const STUDIO_CHAT_ANSWER_SYSTEM = `Eres el copywriter de Adrián Villanueva (Capital Hub). Tienes acceso a:
- Brand playbook (voz de Adrián, anti-patrones)
- Avatar Andrés (audiencia)
- Análisis de patrones del corpus filtrado (qué funciona en su nicho)
- Top videos del corpus con sus transcripciones completas (puedes citar literalmente)

Conversas con Adrián sobre estrategia de contenido. Eres directo, sin humo, citas patrones específicos del corpus cuando aplica. Cuando te pida texto literal de un video, busca en las transcripciones que tienes y cita sin inventar.

Respuestas concisas (máx 350 palabras) salvo que el tema requiera más.

NUNCA inventes datos del corpus. Si la información no está, dilo.`

interface TopVideoForChat {
  handle: string
  views: number | null
  caption: string | null
  transcript: string | null
  posted_at?: string | null
}

async function fetchTopVideosForChat(
  supabase: SupabaseClient,
  filters: StudioChatInput['filters'],
  platform: StudioChatInput['platform'],
  totalLimit: number,
  topNForChat: number,
): Promise<TopVideoForChat[]> {
  const labInput: ViralLabInput = {
    platform,
    filters,
    total_limit: totalLimit,
    num_scripts: 0,
    intent: 'viral',
  }
  const videos = await selectVideos(supabase, labInput)
  // Devolvemos top N por orden ya aplicado, con transcripción si existe.
  return videos.slice(0, topNForChat).map((v) => ({
    handle: v.handle,
    views: v.views,
    caption: v.caption,
    transcript: v.transcript,
  }))
}

async function studioChatAnswer(
  message: string,
  history: StudioChatInput['history'],
  analysisMd: string,
  brand: { playbook: { text: string }; avatar: { text: string } },
  topVideos: TopVideoForChat[],
): Promise<{ reply: string; tokens: number }> {
  const messages: ModelMessage[] = []
  for (const m of history.slice(-8)) {
    messages.push({ role: m.role, content: m.content })
  }
  messages.push({ role: 'user', content: message })

  const topVideosBlock = topVideos.length === 0
    ? '(filtro vacío o sin videos)'
    : topVideos
        .map((v, i) => {
          const transcript = v.transcript
            ? v.transcript.slice(0, 4000)
            : '(sin transcripción todavía)'
          return [
            `## [${i + 1}] @${v.handle} · ${v.views ?? '?'} views`,
            v.caption ? `Caption: ${v.caption.slice(0, 400)}` : '',
            '',
            `Transcript:`,
            transcript,
          ]
            .filter(Boolean)
            .join('\n')
        })
        .join('\n\n---\n\n')

  const systemPrompt = [
    STUDIO_CHAT_ANSWER_SYSTEM,
    '',
    '# BRAND PLAYBOOK',
    brand.playbook.text,
    '',
    '# AVATAR ANDRÉS',
    brand.avatar.text,
    '',
    '# ANÁLISIS DEL CORPUS (patrones detectados)',
    analysisMd || '(no hay análisis aún — el filtro no se ha ejecutado)',
    '',
    '# TOP VIDEOS DEL CORPUS (transcripciones completas para citar)',
    topVideosBlock,
  ].join('\n')

  const { text, usage } = await generateText({
    model: getAnalyzerModel(),
    system: systemPrompt,
    messages,
    temperature: 0.6,
    maxOutputTokens: 1500,
  })

  return { reply: text, tokens: usage?.totalTokens ?? 0 }
}

function filterSignature(input: StudioChatInput): string {
  const f = input.filters
  return JSON.stringify({
    a: (f.account_ids ?? []).slice().sort(),
    v: f.min_views,
    fd: f.from_date,
    td: f.to_date,
    o: f.order_by,
    t: f.top_n_per_account,
    l: input.total_limit,
    p: input.platform,
  })
}

export async function runStudioChat(input: StudioChatInput): Promise<StudioChatResult> {
  const supabase = createAdminClient()
  let analysisMd = input.cached_analysis_md ?? ''
  let queryId = input.cached_query_id ?? null
  let referenceVideoIds: string[] = []
  let analysisTokens = 0

  // 1) Clasificar intent
  const classified = await classifyStudioIntent(input.message, input.history)
  const intent = classified.intent

  // 2) Si el intent requiere análisis y no tenemos cached, lo corremos
  const needsAnalysis = intent !== 'chat' || !analysisMd
  if (needsAnalysis && !analysisMd) {
    const labInput: ViralLabInput = {
      platform: input.platform,
      filters: input.filters,
      total_limit: input.total_limit,
      num_scripts: 0,
      intent: 'viral',
    }
    let videos = await selectVideos(supabase, labInput)
    if (videos.length === 0) {
      return {
        reply: 'Tu filtro no devuelve ningún video. Relaja las condiciones (menos views mínimas, más días, otra cuenta) y vuelve a preguntar.',
        intent: 'chat',
        script_ids: [],
        query_id: null,
        cost_usd: 0,
        tokens_used: 0,
      }
    }
    videos = await ensureTranscriptions(supabase, videos)
    const analyzed = await analyzePatterns(videos, labInput)
    analysisMd = analyzed.markdown
    analysisTokens = analyzed.tokens
    referenceVideoIds = analyzed.videosUsed.map((v) => v.id)

    const { data: row } = await supabase
      .from('ci_queries')
      .insert({
        prompt: `STUDIO · ${buildFilterDescription(labInput, videos.length)}`,
        account_ids: input.filters.account_ids ?? [],
        filters: (input.filters as unknown) as object,
        videos_used: referenceVideoIds,
        response_markdown: analysisMd,
        model: LLM_CROSS_QUERY_MODEL,
        tokens_used: analysisTokens,
        cost_usd: (analysisTokens / 1_000_000) * 3,
        status: 'ok',
      })
      .select('id')
      .single()
    queryId = row?.id ? (row.id as string) : null
  } else if (queryId) {
    const { data: row } = await supabase
      .from('ci_queries')
      .select('videos_used')
      .eq('id', queryId)
      .maybeSingle()
    if (row?.videos_used && Array.isArray(row.videos_used)) {
      referenceVideoIds = row.videos_used as string[]
    }
  }

  let reply = ''
  let angles: AngleSuggestion[] | undefined
  let scriptIds: string[] = []
  let dispatchTokens = 0

  // 3) Dispatch según intent
  if (intent === 'analyze') {
    reply = analysisMd
      ? 'Aquí está el análisis del corpus filtrado. Puedes pedir guiones o ángulos partiendo de aquí.'
      : 'No hay análisis disponible.'
  } else if (intent === 'angles') {
    angles = await detectAngles(analysisMd)
    if (angles.length === 0) {
      reply = 'No pude detectar ángulos sólidos en este corpus. Prueba a relajar el filtro o ampliar la ventana temporal.'
    } else {
      reply = `Detecté ${angles.length} ángulos accionables en tu corpus. Dime cuál convertimos en guion (o pídeme que genere uno concreto).`
    }
  } else if (intent === 'generate') {
    const brand = await loadBrandContext()
    const voiceSummary = extractVoiceSummary(analysisMd)
    const num = classified.num_scripts ?? 1
    const scriptIntent = classified.intent_for_script ?? 'viral'
    const briefForScript = classified.brief_for_script ?? input.message

    const results = await Promise.all(
      Array.from({ length: num }).map((_, i) =>
        generateSingleScript(
          scriptIntent,
          briefForScript,
          analysisMd,
          brand,
          voiceSummary,
          i,
          num,
        ).catch((err) => {
          console.error(`[studio-chat] script ${i + 1} failed:`, toErrorMessage(err))
          return null
        }),
      ),
    )

    for (const r of results) {
      if (!r) continue
      dispatchTokens += r.tokens
      const llmMd = scriptToMarkdown(r.script)
      const { data: scriptRow } = await supabase
        .from('ci_scripts')
        .insert({
          brief: briefForScript || `Studio · ${scriptIntent}`,
          platform: input.platform,
          duration_target_s: VIRAL_INTENT_DEFAULT_DURATION[scriptIntent],
          content_pillar: VIRAL_INTENT_DEFAULT_PILLAR[scriptIntent],
          reference_video_ids: referenceVideoIds,
          playbook_snapshot_text: brand.playbook.text,
          playbook_snapshot_hash: brand.playbook.hash,
          avatar_snapshot_text: brand.avatar.text,
          avatar_snapshot_hash: brand.avatar.hash,
          prompt_used: r.userPrompt.slice(0, 10000),
          llm_output: r.script,
          llm_output_markdown: llmMd,
          status: 'draft',
          model: LLM_SCRIPT_GENERATOR_MODEL,
          tokens_used: r.tokens,
          cost_usd: (r.tokens / 1_000_000) * 3,
        })
        .select('id')
        .single()
      if (scriptRow) scriptIds.push(scriptRow.id as string)
    }

    if (scriptIds.length === 0) {
      reply = 'No pude generar el guion. Algo falló del lado del modelo. Reintenta o cambia el brief.'
    } else if (scriptIds.length === 1) {
      reply = `Listo. Guion ${scriptIntent} creado. Lo encuentras en la pestaña Generar / Editar → Pendientes para iterar o marcar grabado.`
    } else {
      reply = `Listos los ${scriptIds.length} guiones (${scriptIntent}). Disponibles en Pendientes para revisar.`
    }
  } else {
    // chat genérico — incluimos top 5 videos con transcripciones completas
    const brand = await loadBrandContext()
    const topVideos = await fetchTopVideosForChat(
      supabase,
      input.filters,
      input.platform,
      input.total_limit,
      5,
    )
    const answered = await studioChatAnswer(
      input.message,
      input.history,
      analysisMd,
      brand,
      topVideos,
    )
    reply = answered.reply
    dispatchTokens = answered.tokens
  }

  const totalTokens = analysisTokens + dispatchTokens
  return {
    reply,
    intent,
    analysis_md: analysisMd || undefined,
    angles,
    script_ids: scriptIds,
    query_id: queryId,
    cost_usd: (totalTokens / 1_000_000) * 3,
    tokens_used: totalTokens,
  }
}
