import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { normalizeHandle } from '@/features/content-intel/lib/normalize-handle'
import { insertAccount, listAccounts } from '@/features/content-intel/services/content-intel-repo'
import { IMPLEMENTED_PLATFORMS, PLATFORMS } from '@/features/content-intel/types/platform'
import { toErrorMessage } from '@/features/content-intel/lib/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CreateAccountSchema = z.object({
  platform: z.enum(PLATFORMS),
  handle: z.string().min(1).max(100),
  display_name: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  try {
    const supabase = createAdminClient()
    const accounts = await listAccounts(supabase)
    return Response.json({ ok: true, accounts })
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

  const parsed = CreateAccountSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (!IMPLEMENTED_PLATFORMS.includes(parsed.data.platform)) {
    return Response.json(
      {
        ok: false,
        error: 'platform_not_implemented',
        detail: `${parsed.data.platform} llegará en V2. MVP solo soporta Instagram.`,
      },
      { status: 400 },
    )
  }

  const handle = normalizeHandle(parsed.data.handle)
  if (!handle) {
    return Response.json({ ok: false, error: 'empty_handle_after_normalize' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const account = await insertAccount(supabase, {
      platform: parsed.data.platform,
      handle,
      display_name: parsed.data.display_name ?? null,
      notes: parsed.data.notes ?? null,
    })
    return Response.json({ ok: true, account }, { status: 201 })
  } catch (err) {
    const msg = toErrorMessage(err)
    const status = msg.includes('duplicate') || msg.includes('unique') ? 409 : 500
    return Response.json({ ok: false, error: msg }, { status })
  }
}
