import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import {
  deleteIdea,
  updateIdeaStatus,
} from '@/features/content-intel/services/ideas-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

const PatchSchema = z.object({
  status: z
    .enum([
      'pending',
      'generating',
      'generated',
      'recorded',
      'published',
      'archived',
    ])
    .optional(),
  notes: z.string().max(2000).optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    if (parsed.data.status) {
      await updateIdeaStatus(
        auth.session.userId,
        id,
        parsed.data.status,
        parsed.data.notes,
      )
    }
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  try {
    await deleteIdea(auth.session.userId, id)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
