import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  DEFAULT_CROSS_QUERY_MAX_VIDEOS,
  DEFAULT_SEMANTIC_MATCH_THRESHOLD,
  LLM_CROSS_QUERY_MODEL,
} from '../constants'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import { CROSS_QUERY_SYSTEM_PROMPT, buildCrossQueryUserPrompt } from '../prompts/cross-query'
import { embedText } from './transcriber'
import type { Platform } from '../types/platform'

interface MatchedVideo {
  id: string
  account_id: string
  platform: string
  external_id: string
  url: string
  caption: string | null
  views: number | null
  likes: number | null
  comments: number | null
  transcript: string | null
  similarity: number
}

async function semanticMatch(
  supabase: SupabaseClient,
  args: {
    queryEmbedding: number[]
    accountIds: string[]
    platform: Platform | null
    minViews: number | null
    matchThreshold: number
    matchCount: number
  },
): Promise<MatchedVideo[]> {
  // pgvector expects array string for RPC call
  const { data, error } = await supabase.rpc('match_videos', {
    query_embedding: JSON.stringify(args.queryEmbedding),
    match_threshold: args.matchThreshold,
    match_count: args.matchCount,
    filter_account_ids: args.accountIds.length > 0 ? args.accountIds : null,
    filter_platform: args.platform,
    filter_min_views: args.minViews,
  })

  if (error) throw new ContentIntelError('match_videos_failed', error.message)
  return (data ?? []) as MatchedVideo[]
}

async function fallbackKeyword(
  supabase: SupabaseClient,
  args: {
    accountIds: string[]
    platform: Platform | null
    minViews: number | null
    matchCount: number
  },
): Promise<MatchedVideo[]> {
  // Si no hay embeddings aún, volvemos por views (el caso típico al inicio).
  let q = supabase
    .from('ci_videos')
    .select(
      'id, account_id, platform, external_id, url, caption, views, likes, comments, transcript',
    )
    .not('transcript', 'is', null)
    .order('views', { ascending: false, nullsFirst: false })
    .limit(args.matchCount)

  if (args.accountIds.length > 0) q = q.in('account_id', args.accountIds)
  if (args.platform) q = q.eq('platform', args.platform)
  if (args.minViews !== null) q = q.gte('views', args.minViews)

  const { data, error } = await q
  if (error) throw new ContentIntelError('fallback_videos_failed', error.message)

  return ((data ?? []) as Omit<MatchedVideo, 'similarity'>[]).map((v) => ({
    ...v,
    similarity: 0,
  }))
}

function getLlmModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  return createOpenRouter({ apiKey })(LLM_CROSS_QUERY_MODEL)
}

export interface CrossQueryInput {
  prompt: string
  account_ids: string[]
  platform?: Platform | null
  min_views?: number | null
  max_videos?: number
  match_threshold?: number
}

export interface CrossQueryResult {
  id: string
  response_markdown: string
  videos_used: string[]
  model: string
  tokens_used: number
  cost_usd: number
}

async function lookupHandles(
  supabase: SupabaseClient,
  accountIds: string[],
): Promise<Map<string, string>> {
  if (accountIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('ci_seed_accounts')
    .select('id, handle')
    .in('id', accountIds)
  if (error) return new Map()
  const map = new Map<string, string>()
  for (const row of data ?? []) map.set(row.id as string, row.handle as string)
  return map
}

export async function runCrossQuery(input: CrossQueryInput): Promise<CrossQueryResult> {
  const supabase = createAdminClient()

  const maxVideos = Math.min(60, Math.max(5, input.max_videos ?? DEFAULT_CROSS_QUERY_MAX_VIDEOS))
  const matchThreshold = input.match_threshold ?? DEFAULT_SEMANTIC_MATCH_THRESHOLD

  // Persist query row in "running" state first.
  const inserted = await supabase
    .from('ci_queries')
    .insert({
      prompt: input.prompt,
      account_ids: input.account_ids,
      filters: {
        platform: input.platform ?? null,
        min_views: input.min_views ?? null,
        max_videos: maxVideos,
      },
      status: 'running',
    })
    .select('id')
    .single()
  if (inserted.error) {
    throw new ContentIntelError('query_insert_failed', inserted.error.message)
  }
  const queryId = inserted.data.id as string

  try {
    const embedded = await embedText(input.prompt, 'RETRIEVAL_QUERY')

    let matches = await semanticMatch(supabase, {
      queryEmbedding: embedded.values,
      accountIds: input.account_ids,
      platform: input.platform ?? null,
      minViews: input.min_views ?? null,
      matchThreshold,
      matchCount: maxVideos,
    })

    if (matches.length === 0) {
      matches = await fallbackKeyword(supabase, {
        accountIds: input.account_ids,
        platform: input.platform ?? null,
        minViews: input.min_views ?? null,
        matchCount: maxVideos,
      })
    }

    const handleMap = await lookupHandles(
      supabase,
      [...new Set(matches.map((m) => m.account_id))],
    )

    const userPrompt = buildCrossQueryUserPrompt({
      prompt: input.prompt,
      videos: matches.map((m) => ({
        id: m.id,
        handle: handleMap.get(m.account_id) ?? '?',
        views: m.views,
        likes: m.likes,
        comments: m.comments,
        caption: m.caption,
        transcript: m.transcript,
      })),
    })

    const { text, usage } = await generateText({
      model: getLlmModel(),
      system: CROSS_QUERY_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.3,
      maxOutputTokens: 2500,
    })

    const tokens = usage?.totalTokens ?? 0
    const cost = (tokens / 1_000_000) * 3 // estimación rough, Claude Sonnet ~$3/M tokens

    await supabase
      .from('ci_queries')
      .update({
        response_markdown: text,
        videos_used: matches.map((m) => m.id),
        model: LLM_CROSS_QUERY_MODEL,
        tokens_used: tokens,
        cost_usd: cost,
        status: 'ok',
      })
      .eq('id', queryId)

    return {
      id: queryId,
      response_markdown: text,
      videos_used: matches.map((m) => m.id),
      model: LLM_CROSS_QUERY_MODEL,
      tokens_used: tokens,
      cost_usd: cost,
    }
  } catch (err) {
    const msg = toErrorMessage(err)
    await supabase
      .from('ci_queries')
      .update({ status: 'error', error: msg })
      .eq('id', queryId)
    throw err
  }
}

export async function listQueries(supabase: SupabaseClient, limit = 50) {
  const { data, error } = await supabase
    .from('ci_queries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new ContentIntelError('list_queries_failed', error.message)
  return data ?? []
}
