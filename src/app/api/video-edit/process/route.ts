import { NextRequest, after } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { runEditPipeline } from '@/features/video-edit/services/edit-pipeline'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 800

const Schema = z.object({
  edit_id: z.string().uuid(),
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

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Marcar como pending para arrancar el pipeline en background
  const supabase = createAdminClient()
  const { error: updateErr } = await supabase
    .from('ci_video_edits')
    .update({ status: 'pending', error: null })
    .eq('id', parsed.data.edit_id)
  if (updateErr) {
    return Response.json({ ok: false, error: updateErr.message }, { status: 500 })
  }

  // Pipeline en background — no bloqueamos la respuesta HTTP
  after(async () => {
    try {
      await runEditPipeline(parsed.data.edit_id)
    } catch (err) {
      console.error('[video-edit] pipeline error:', err)
    }
  })

  return Response.json({ ok: true, queued: true })
}
