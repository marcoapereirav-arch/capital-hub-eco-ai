import { NextRequest, after } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { runViralLab } from '@/features/content-intel/services/viral-lab'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { PLATFORMS } from '@/features/content-intel/types/platform'
import { VIRAL_INTENTS } from '@/features/content-intel/types/viral-lab'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ViralLabSchema = z.object({
  platform: z.enum(PLATFORMS).optional().default('instagram'),
  filters: z
    .object({
      account_ids: z.array(z.string().uuid()).optional(),
      min_views: z.number().optional(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      order_by: z
        .enum(['views', 'engagement_rate', 'comments', 'likes', 'posted_at'])
        .optional(),
      top_n_per_account: z.number().optional(),
    })
    .optional()
    .default({}),
  total_limit: z.number().optional().default(50),
  num_scripts: z.number().optional().default(3),
  intent: z.enum(VIRAL_INTENTS).optional().default('viral'),
  extra_brief: z.string().optional(),
  background: z.boolean().optional().default(false),
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

  const parsed = ViralLabSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const input = parsed.data

  if (input.background) {
    after(async () => {
      try {
        const result = await runViralLab(input)
        console.log(
          `[viral-lab-bg] OK: ${result.script_ids.length} scripts, cost=$${result.cost_usd.toFixed(4)}`,
        )
      } catch (err) {
        console.error('[viral-lab-bg] FAILED:', toErrorMessage(err))
      }
    })
    return Response.json({
      ok: true,
      queued: true,
      message: 'Viral Lab en curso en background. Consulta drafts en Pendientes cuando termine.',
    })
  }

  try {
    const result = await runViralLab(input)
    return Response.json({ ok: true, result })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
