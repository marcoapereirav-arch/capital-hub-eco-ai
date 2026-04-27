import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LLM_CLASSIFIER_MODEL, LLM_TEMPERATURE } from '../constants'
import { ClassificationSchema, type ClassificationResult } from '../types/classification'
import { buildUserPrompt, CLASSIFY_SYSTEM_PROMPT, type ClassifierInput } from '../prompts/classify'

function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')
  const openrouter = createOpenRouter({ apiKey })
  return openrouter(LLM_CLASSIFIER_MODEL)
}

export async function classifyMeeting(input: ClassifierInput): Promise<ClassificationResult> {
  const userPrompt = buildUserPrompt(input)

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: ClassificationSchema,
      system: CLASSIFY_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: LLM_TEMPERATURE,
      maxOutputTokens: 4000,
    })
    return object
  } catch (err) {
    // Un reintento con prompt reforzado si el schema falló.
    const { object } = await generateObject({
      model: getModel(),
      schema: ClassificationSchema,
      system: CLASSIFY_SYSTEM_PROMPT,
      prompt: `${userPrompt}\n\nTu respuesta anterior no pasó la validación del schema (${
        err instanceof Error ? err.message : 'unknown'
      }). Asegúrate de devolver exactamente el objeto JSON pedido, nada más.`,
      temperature: 0,
      maxOutputTokens: 4000,
    })
    return object
  }
}
