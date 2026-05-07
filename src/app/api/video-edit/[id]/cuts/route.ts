import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

const ManualCutSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  reason: z.string().max(200).default('manual'),
})

const Schema = z.object({
  rejected_indices: z.array(z.number().int().min(0)),
  manual: z.array(ManualCutSchema).max(200),
})

/**
 * PUT /api/video-edit/[id]/cuts
 *
 * Guarda las decisiones del usuario sobre los cortes:
 *  - rejected_indices: índices de llm_cuts que el usuario NO quiere aplicar
 *  - manual: cortes adicionales que el usuario añadió manualmente
 *
 * El render combina:
 *   final_cuts = llm_cuts.filter((_, i) => !rejected_indices.includes(i)) ∪ manual
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Validar manual cuts: end > start
  for (const cut of parsed.data.manual) {
    if (cut.end <= cut.start) {
      return Response.json(
        { ok: false, error: 'invalid_cut_timing', detail: `Cut con end <= start` },
        { status: 400 },
      )
    }
  }

  const supabase = createAdminClient()

  const { error: updateErr } = await supabase
    .from('ci_video_edits')
    .update({
      cut_overrides: parsed.data,
      cuts_reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateErr) return Response.json({ ok: false, error: updateErr.message }, { status: 500 })

  return Response.json({
    ok: true,
    rejected: parsed.data.rejected_indices.length,
    manual: parsed.data.manual.length,
  })
}
