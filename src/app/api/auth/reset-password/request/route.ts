import { NextRequest } from 'next/server'
import { requestPasswordReset } from '@/features/auth/services/request-password-reset'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string }
  const result = await requestPasswordReset(body.email ?? '')
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
  return Response.json({ ok: true, sent: true })
}
