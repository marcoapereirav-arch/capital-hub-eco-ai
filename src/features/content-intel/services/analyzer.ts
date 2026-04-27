import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'
import { LLM_ANALYZER_MODEL, LLM_TEMPERATURE_ANALYZE } from '../constants'
import { ContentIntelError } from '../lib/errors'
import {
  ANALYZE_SYSTEM_PROMPT,
  buildAnalyzeUserPrompt,
  type AnalyzeInput,
} from '../prompts/analyze-video'
import type { VideoAnalysis } from '../types/video'

const CTA_TYPES = [
  'none',
  'lead_magnet',
  'follow',
  'dm',
  'link_bio',
  'product',
  'engagement',
  'other',
] as const

export const AnalysisSchema = z.object({
  hook: z.string().max(400),
  cta_type: z.enum(CTA_TYPES),
  cta_detail: z.string().max(400).nullable(),
  pillars: z.array(z.string().max(40)).max(4),
  virality_hypothesis: z.string().max(600),
  intent_signals_count: z.number().int().min(0).max(100),
}) satisfies z.ZodType<VideoAnalysis>

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ContentIntelError('openrouter_key_missing', 'OPENROUTER_API_KEY not set')
  const provider = createOpenRouter({ apiKey })
  return provider(LLM_ANALYZER_MODEL)
}

export interface AnalyzeResult {
  analysis: VideoAnalysis
  model: string
  tokens_used: number
}

export async function analyzeVideo(input: AnalyzeInput): Promise<AnalyzeResult> {
  const userPrompt = buildAnalyzeUserPrompt(input)

  const { object, usage } = await generateObject({
    model: getModel(),
    schema: AnalysisSchema,
    system: ANALYZE_SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: LLM_TEMPERATURE_ANALYZE,
    maxOutputTokens: 1500,
  })

  return {
    analysis: object,
    model: LLM_ANALYZER_MODEL,
    tokens_used: usage?.totalTokens ?? 0,
  }
}
