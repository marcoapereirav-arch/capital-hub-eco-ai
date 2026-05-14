import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createAdminClient } from '@/lib/supabase/admin'
import { LLM_CROSS_QUERY_MODEL, LLM_TEMPERATURE_ANALYZE } from '../constants'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import { transcribeBatch } from './transcribe-pipeline'
import type { Platform } from '../types/platform'
import type { ViralLabFilters } from '../types/viral-lab'

/**
 * Selecciona videos del corpus para un chat persistente.
 *
 * Reusa la misma lógica que el Viral Lab (selectVideos + ensureTranscriptions +
 * filterUsefulVideos) pero NO genera ángulos ni guiones — solo prepara el
 * corpus que se va a anclar al chat durante toda la conversación.
 *
 * Devuelve los video_ids seleccionados + un análisis markdown rápido de
 * patrones (que se reusa en cada mensaje del chat sin re-analizar).
 *
 * NOTA: extraído a archivo separado para evitar ciclo de imports entre
 * corpus-chat.ts y viral-lab.ts. La lógica de selección la duplicamos aquí
 * en una forma más simple porque la del Viral Lab está acoplada a su flujo.
 */

const MIN_TRANSCRIPT_CHARS = 200
const MIN_USABLE_VIDEOS = 3
const MAX_VIDEOS_HARD_CAP = 50 // tope para chats (más que el Viral Lab no necesita)
const MAX_AUTO_TRANSCRIBE = 100

const CORPUS_PATTERN_SYSTEM = `Eres analista de patrones de Reels para un copywriter. Recibes 10-30 transcripts de videos virales del nicho del usuario y extraes los patrones DOMINANTES — hooks, estructuras, CTAs — que mejor funcionan según engagement.

OUTPUT: markdown corto (máx 700 palabras) con esta estructura:

## Hooks recurrentes
3-5 patrones de hook (ej: "afirmación contrarian", "credencial+promesa", "pregunta provocadora") con 1-2 ejemplos literales cada uno.

## Estructura narrativa más usada
1-2 estructuras dominantes (ej: "anécdota → moraleja", "lista 3-puntos", "hot take + reasoning").

## Tonos / energía
Cómo abren, cómo escalan, cómo cierran. Lenguaje recurrente.

## CTAs observados
Los 2-3 CTAs más vistos.

NO copies guiones enteros. NO incluyas tu opinión. Es contexto descriptivo. Sé conciso.`

interface SelectedVideo {
  id: string
  account_id: string
  handle: string
  role: string
  is_own: boolean
  views: number | null
  caption: string | null
  transcript: string | null
}

function looksLikeSpanish(text: string): boolean {
  if (!text || text.length < 30) return false
  const lower = text.toLowerCase()
  const tokens = new Set(lower.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/))
  const es = [
    'que',
    'para',
    'porque',
    'cuando',
    'tengo',
    'tiene',
    'aquí',
    'esto',
    'pero',
    'así',
    'tipo',
    'gente',
    'algo',
    'tienes',
    'puedes',
    'eres',
    'estás',
    'están',
    'siempre',
    'también',
    'entonces',
    'mucho',
    'poco',
    'cómo',
    'qué',
  ]
  const en = [
    'the',
    'and',
    'you',
    'your',
    'this',
    'that',
    'with',
    'have',
    'just',
    'about',
    'know',
    'going',
    'really',
    'don',
    'because',
  ]
  const sc = es.filter((m) => tokens.has(m)).length
  const ec = en.filter((m) => tokens.has(m)).length
  return sc > ec
}

function isUsefulTranscript(t: string | null): boolean {
  if (!t || t.length < MIN_TRANSCRIPT_CHARS) return false
  if (t === '[NO_SPEECH]') return false
  if (!looksLikeSpanish(t)) return false
  return true
}

export interface CorpusSelectionInput {
  filters: ViralLabFilters
  totalLimit: number
  platform: Platform
}

export interface CorpusSelectionResult {
  videoIds: string[]
  analysisMd: string
  videosUsed: number
  tokensUsed: number
}

export async function runCorpusSelectionForChat(
  input: CorpusSelectionInput,
): Promise<CorpusSelectionResult> {
  const supabase = createAdminClient()
  const cap = Math.min(input.totalLimit, MAX_VIDEOS_HARD_CAP)
  const filters = input.filters

  // ============================================================
  // Q1: Videos externos según filtros
  // ============================================================
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
  q = q.order(filters.order_by ?? 'engagement_rate', {
    ascending: false,
    nullsFirst: false,
  })
  q = q.limit(Math.min(500, cap * 5))

  const { data, error } = await q
  if (error) {
    throw new ContentIntelError('corpus_select_failed', error.message)
  }

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

  const allExternal: SelectedVideo[] = rows.map((r) => ({
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

  // ============================================================
  // Q2: Voz propia (siempre, sin filtros) — para calibración de tono
  // ============================================================
  const userPickedSpecificAccounts =
    filters.account_ids !== undefined && filters.account_ids.length > 0

  let ownVideos: SelectedVideo[] = []
  if (!userPickedSpecificAccounts) {
    const { data: ownData } = await supabase
      .from('ci_videos')
      .select(`
        id, account_id, views, likes, comments, caption, transcript, posted_at,
        ci_seed_accounts!inner(handle, role, is_own)
      `)
      .eq('platform', input.platform)
      .eq('ci_seed_accounts.is_own', true)
      .not('transcript', 'is', null)
      .order('posted_at', { ascending: false, nullsFirst: false })
      .limit(10)

    const ownRows = (ownData ?? []) as unknown as typeof rows
    ownVideos = ownRows.map((r) => ({
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
  }

  // ============================================================
  // Dedup por account + cap
  // ============================================================
  let externalSelected: SelectedVideo[]
  if (filters.top_n_per_account && filters.top_n_per_account > 0) {
    const perAccount = new Map<string, number>()
    externalSelected = []
    for (const v of allExternal) {
      const c = perAccount.get(v.account_id) ?? 0
      if (c >= filters.top_n_per_account) continue
      perAccount.set(v.account_id, c + 1)
      externalSelected.push(v)
      if (externalSelected.length >= cap) break
    }
  } else {
    externalSelected = allExternal.slice(0, cap)
  }
  const externalIds = new Set(externalSelected.map((v) => v.id))
  const combined = [
    ...externalSelected,
    ...ownVideos.filter((v) => !externalIds.has(v.id)).filter((v) => isUsefulTranscript(v.transcript)),
  ]

  // ============================================================
  // Auto-transcribir lo que falta
  // ============================================================
  const needTranscript = combined.filter((v) => !v.transcript)
  if (needTranscript.length > MAX_AUTO_TRANSCRIBE) {
    throw new ContentIntelError(
      'too_many_untranscribed',
      `Tu filtro requeriría transcribir ${needTranscript.length} videos. Reduce total_limit o sube min_views.`,
    )
  }
  if (needTranscript.length > 0) {
    console.log(`[corpus-chat] auto-transcribing ${needTranscript.length} videos`)
    try {
      await transcribeBatch({ video_ids: needTranscript.map((v) => v.id) })
      // Re-fetch transcripts
      const { data: refetch } = await supabase
        .from('ci_videos')
        .select('id, transcript')
        .in(
          'id',
          needTranscript.map((v) => v.id),
        )
      const tMap = new Map<string, string | null>()
      for (const r of refetch ?? []) tMap.set(r.id as string, r.transcript as string | null)
      for (const v of combined) {
        if (!v.transcript && tMap.has(v.id)) v.transcript = tMap.get(v.id) ?? null
      }
    } catch (err) {
      console.warn(`[corpus-chat] auto-transcribe failed: ${toErrorMessage(err)}`)
    }
  }

  // ============================================================
  // Filtrar inútiles + validar mínimo
  // ============================================================
  const useful = combined.filter((v) => isUsefulTranscript(v.transcript))
  if (useful.length < MIN_USABLE_VIDEOS) {
    throw new ContentIntelError(
      'insufficient_corpus',
      `Solo ${useful.length} videos con transcripts útiles tras filtrar (>${MIN_TRANSCRIPT_CHARS} chars en español). Necesitas ${MIN_USABLE_VIDEOS} mínimo. Relaja el filtro.`,
    )
  }

  // ============================================================
  // Análisis de patrones (1 llamada LLM, se cachea en el chat)
  // ============================================================
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  const model = createOpenRouter({
    apiKey,
    extraBody: { provider: { order: ['Anthropic'], allow_fallbacks: false } },
  })(LLM_CROSS_QUERY_MODEL)

  const corpusBlock = useful
    .slice(0, 25)
    .map(
      (v, i) =>
        `### Video ${i + 1} — @${v.handle}${v.is_own ? ' (TU CUENTA)' : ''}${v.views ? ` · ${v.views} views` : ''}\n${
          v.caption ? `Caption: ${v.caption.slice(0, 200)}\n` : ''
        }Transcript: ${(v.transcript ?? '').slice(0, 1500)}`,
    )
    .join('\n\n')

  let analysisMd = ''
  let tokens = 0
  try {
    const { text, usage } = await generateText({
      model,
      system: CORPUS_PATTERN_SYSTEM,
      prompt: `Aquí están ${useful.length} videos del corpus filtrado:\n\n${corpusBlock}\n\nExtrae los patrones dominantes en markdown según el formato indicado.`,
      temperature: LLM_TEMPERATURE_ANALYZE,
      maxOutputTokens: 1500,
    })
    analysisMd = text
    tokens = usage?.totalTokens ?? 0
  } catch (err) {
    console.warn(`[corpus-chat] pattern analysis failed: ${toErrorMessage(err)}`)
    analysisMd = '_Análisis no disponible (LLM falló) — el chat seguirá funcionando solo con los transcripts._'
  }

  return {
    videoIds: useful.map((v) => v.id),
    analysisMd,
    videosUsed: useful.length,
    tokensUsed: tokens,
  }
}
