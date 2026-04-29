import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { generateScript, listScripts } from '@/features/content-intel/services/script-generator'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { IMPLEMENTED_PLATFORMS, PLATFORMS } from '@/features/content-intel/types/platform'
import { CONTENT_PILLARS } from '@/features/content-intel/types/script'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180

const GenerateSchema = z.object({
  brief: z.string().min(3).max(2000),
  platform: z.enum(PLATFORMS),
  duration_target_s: z.number().int().min(10).max(600).optional(),
  content_pillar: z
    .union([z.enum(CONTENT_PILLARS), z.string().max(60)])
    .optional(),
  reference_video_ids: z.array(z.string().uuid()).optional().default([]),
})

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  try {
    const supabase = createAdminClient()
    const scripts = await listScripts(supabase, 50)
    return Response.json({ ok: true, scripts })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (!IMPLEMENTED_PLATFORMS.includes(parsed.data.platform)) {
    return Response.json(
      {
        ok: false,
        error: 'platform_not_implemented',
        detail: `${parsed.data.platform} llegará en V2. MVP solo soporta Instagram.`,
      },
      { status: 400 },
    )
  }

  try {
    const script = await generateScript({
      brief: parsed.data.brief,
      platform: parsed.data.platform,
      duration_target_s: parsed.data.duration_target_s,
      content_pillar: parsed.data.content_pillar,
      reference_video_ids: parsed.data.reference_video_ids,
    })
    return Response.json({ ok: true, script }, { status: 201 })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
