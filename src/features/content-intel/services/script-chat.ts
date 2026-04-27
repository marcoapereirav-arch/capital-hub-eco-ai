import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import { LLM_SCRIPT_GENERATOR_MODEL } from '../constants'
import { ContentIntelError } from '../lib/errors'
import {
  SCRIPT_CHAT_SYSTEM_PROMPT,
  buildScriptChatUserPrompt,
  type ChatMessage,
} from '../prompts/script-chat'

const ScriptChatResponseSchema = z.object({
  response: z.string().min(1).max(6000),
  new_script_markdown: z.string().max(10_000).nullable(),
})

export type ScriptChatResponse = z.infer<typeof ScriptChatResponseSchema>

const OPENROUTER_PROVIDER_PREFERENCE = {
  provider: { order: ['Anthropic'], allow_fallbacks: false },
} as const

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  return createOpenRouter({ apiKey, extraBody: OPENROUTER_PROVIDER_PREFERENCE })(
    LLM_SCRIPT_GENERATOR_MODEL,
  )
}

export interface ChatScriptInput {
  currentScript: string
  history: ChatMessage[]
  userMessage: string
}

export interface ChatScriptResult {
  response: string
  new_script_markdown: string | null
  tokens_used: number
  cost_usd: number
  model: string
}

export async function chatScript(input: ChatScriptInput): Promise<ChatScriptResult> {
  const userPrompt = buildScriptChatUserPrompt(input)

  const { object, usage } = await generateObject({
    model: getModel(),
    schema: ScriptChatResponseSchema,
    system: SCRIPT_CHAT_SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.6,
    maxOutputTokens: 6000,
  })

  const tokens = usage?.totalTokens ?? 0
  const cost = (tokens / 1_000_000) * 3

  return {
    response: object.response,
    new_script_markdown: object.new_script_markdown,
    tokens_used: tokens,
    cost_usd: cost,
    model: LLM_SCRIPT_GENERATOR_MODEL,
  }
}
