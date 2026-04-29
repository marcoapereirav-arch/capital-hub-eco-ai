import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import {
  deleteAccount,
  getAccount,
  updateAccount,
} from '@/features/content-intel/services/content-intel-repo'
import { toErrorMessage } from '@/features/content-intel/lib/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UpdateAccountSchema = z.object({
  display_name: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().optional(),
})

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  try {
    const supabase = createAdminClient()
    const account = await getAccount(supabase, id)
    if (!account) return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
    return Response.json({ ok: true, account })
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

  const parsed = UpdateAccountSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const supabase = createAdminClient()
    const account = await updateAccount(supabase, id, parsed.data)
    return Response.json({ ok: true, account })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  try {
    const supabase = createAdminClient()
    await deleteAccount(supabase, id)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
