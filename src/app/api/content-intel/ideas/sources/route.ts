import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import {
  listIdeaSources,
  registerGoogleDocSource,
} from '@/features/content-intel/services/ideas-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RegisterSchema = z.object({
  doc_url_or_id: z.string().min(10),
  display_name: z.string().max(120).optional(),
})

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  try {
    const sources = await listIdeaSources(auth.session.userId)
    return Response.json({ ok: true, sources })
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

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const source = await registerGoogleDocSource(
      auth.session.userId,
      parsed.data.doc_url_or_id,
      parsed.data.display_name,
    )
    return Response.json({ ok: true, source }, { status: 201 })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
