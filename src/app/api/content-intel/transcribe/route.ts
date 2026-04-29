import { NextRequest, after } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { transcribeBatch } from '@/features/content-intel/services/transcribe-pipeline'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { DEFAULT_TRANSCRIBE_TOP_X } from '@/features/content-intel/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 800

const TranscribeSchema = z
  .object({
    account_id: z.string().uuid().optional(),
    video_ids: z.array(z.string().uuid()).optional(),
    top_x: z.number().int().min(1).max(200).optional(),
    min_views: z.number().int().min(0).optional(),
    order_by: z
      .enum(['views', 'engagement_rate', 'posted_at', 'likes', 'comments'])
      .optional(),
    /** Si true, responde inmediato y procesa en background (no bloquea HTTP). */
    background: z.boolean().optional().default(false),
  })
  .refine(
    (v) => Boolean(v.account_id) || (v.video_ids && v.video_ids.length > 0),
    'Se requiere account_id o video_ids',
  )

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = TranscribeSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const batchArgs = {
    account_id: parsed.data.account_id,
    video_ids: parsed.data.video_ids,
    top_x: parsed.data.top_x ?? DEFAULT_TRANSCRIBE_TOP_X,
    min_views: parsed.data.min_views,
    order_by: parsed.data.order_by,
  }

  // Modo background: respondemos al instante, procesamos tras enviar la respuesta.
  if (parsed.data.background) {
    after(async () => {
      try {
        const result = await transcribeBatch(batchArgs)
        console.log(
          `[transcribe-bg] Completado: ok=${result.ok} errors=${result.errors} skipped=${result.skipped} cost=$${result.total_cost_usd.toFixed(4)}`,
        )
      } catch (err) {
        console.error('[transcribe-bg] Falló batch:', toErrorMessage(err))
      }
    })
    return Response.json({
      ok: true,
      queued: true,
      video_count_requested: parsed.data.video_ids?.length ?? parsed.data.top_x ?? DEFAULT_TRANSCRIBE_TOP_X,
      message: 'Transcripción en curso en background. Monitoriza estado vía GET /api/content-intel/videos o directamente en la webapp.',
    })
  }

  // Modo sincrónico (comportamiento original): bloquea hasta terminar.
  try {
    const result = await transcribeBatch(batchArgs)
    return Response.json({ ok: true, result })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
