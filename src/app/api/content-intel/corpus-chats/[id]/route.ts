import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import {
  archiveCorpusChat,
  getCorpusChat,
  updateCorpusChatTitle,
} from '@/features/content-intel/services/corpus-chat'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

const PatchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
})

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  try {
    const chat = await getCorpusChat(id, auth.session.userId)
    if (!chat) return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
    return Response.json({ ok: true, chat })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}

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
    if (parsed.data.title) {
      await updateCorpusChatTitle(id, auth.session.userId, parsed.data.title)
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
    await archiveCorpusChat(id, auth.session.userId)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
