import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { chatScript } from '@/features/content-intel/services/script-chat'
import { toErrorMessage } from '@/features/content-intel/lib/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const ChatSchema = z.object({
  current_script: z.string().min(1).max(20_000),
  user_message: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(5000),
      }),
    )
    .max(30)
    .optional()
    .default([]),
})

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = ChatSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await chatScript({
      currentScript: parsed.data.current_script,
      history: parsed.data.history,
      userMessage: parsed.data.user_message,
    })

    return Response.json({
      ok: true,
      script_id: id,
      response: result.response,
      new_script_markdown: result.new_script_markdown,
      tokens_used: result.tokens_used,
      cost_usd: result.cost_usd,
      model: result.model,
    })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
