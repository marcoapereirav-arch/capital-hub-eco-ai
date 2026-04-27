import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { syncAccount } from '@/features/content-intel/services/sync-pipeline'
import { toErrorMessage } from '@/features/content-intel/lib/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Apify sync runs pueden tardar 60-180s. Subimos maxDuration para permitir.
export const maxDuration = 300

const SyncSchema = z.object({
  account_id: z.string().uuid(),
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

  const parsed = SyncSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await syncAccount(parsed.data.account_id)
    return Response.json({ ok: true, result })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
