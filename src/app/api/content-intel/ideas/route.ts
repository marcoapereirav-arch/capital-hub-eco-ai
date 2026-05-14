import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import { listIdeas } from '@/features/content-intel/services/ideas-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const StatusEnum = z.enum([
  'pending',
  'generating',
  'generated',
  'recorded',
  'published',
  'archived',
])

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const url = new URL(req.url)
  const statusParam = url.searchParams.get('status')
  const parsedStatus = statusParam ? StatusEnum.safeParse(statusParam) : null

  try {
    const ideas = await listIdeas(
      auth.session.userId,
      parsedStatus?.success ? parsedStatus.data : undefined,
    )
    return Response.json({ ok: true, ideas })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
