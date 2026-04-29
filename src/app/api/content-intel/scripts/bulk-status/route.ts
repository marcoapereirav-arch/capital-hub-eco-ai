import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { SCRIPT_STATUSES } from '@/features/content-intel/types/script'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BulkStatusSchema = z.object({
  script_ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(SCRIPT_STATUSES),
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

  const parsed = BulkStatusSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('ci_scripts')
      .update({ status: parsed.data.status })
      .in('id', parsed.data.script_ids)
      .select('id')
    if (error) throw new Error(error.message)

    return Response.json({ ok: true, updated: data?.length ?? 0 })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
