import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { generateScriptFromAngle } from '@/features/content-intel/services/viral-lab'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { PLATFORMS } from '@/features/content-intel/types/platform'
import { VIRAL_INTENTS } from '@/features/content-intel/types/viral-lab'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const FromAngleSchema = z.object({
  angle: z.object({
    title: z.string().min(1),
    hook_idea: z.string().min(1),
    why_it_works: z.string().min(1),
    avatar_fit: z.enum(['alta', 'media', 'baja']),
    suggested_intent: z.enum(VIRAL_INTENTS),
  }),
  analysis_markdown: z.string().min(50),
  reference_video_ids: z.array(z.string().uuid()).default([]),
  platform: z.enum(PLATFORMS).optional().default('instagram'),
})

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = FromAngleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await generateScriptFromAngle(parsed.data)
    return Response.json({ ok: true, result })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
