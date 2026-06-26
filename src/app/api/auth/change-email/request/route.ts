import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requestEmailChange } from '@/features/auth/services/email-change'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** El usuario autenticado pide cambiar SU email. Confirmación va al email nuevo. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { newEmail?: string }
  const r = await requestEmailChange(user.id, user.email ?? '', body.newEmail ?? '')
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ok: true, sent: true, newEmail: r.newEmail })
}
