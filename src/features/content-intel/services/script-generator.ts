import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { LLM_SCRIPT_GENERATOR_MODEL, LLM_TEMPERATURE_GENERATE } from '../constants'
import { ContentIntelError, toErrorMessage } from '../lib/errors'
import {
  SCRIPT_GENERATOR_SYSTEM_PROMPT,
  buildScriptUserPrompt,
  type GenerateScriptInput,
} from '../prompts/generate-script'
import { loadBrandContext } from './brand-context'
import type { Platform } from '../types/platform'
import type { ContentPillar, ScriptOutput, ScriptRow } from '../types/script'

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
}

export async function generateScript(input: GenerateScriptApiInput): Promise<ScriptRow> {
  const supabase = createAdminClient()

  const brand = await loadBrandContext()
  const references = await fetchReferences(supabase, input.reference_video_ids ?? [])

  const promptInput: GenerateScriptInput = {
    brief: input.brief,
    platform: input.platform,
    duration_target_s: input.duration_target_s ?? null,
    content_pillar: input.content_pillar ?? null,
    brand,
    references,
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
  const cost = (tokens / 1_000_000) * 3

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
      tokens_used: tokens,
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
