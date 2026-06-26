import { NextRequest, NextResponse } from 'next/server'
import { confirmEmailChange } from '@/features/auth/services/email-change'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Confirma el cambio de email vía el token JWT del enlace. No requiere sesión:
 *  el token firmado + binding al email anterior son la prueba de identidad. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: string }
  const r = await confirmEmailChange(body.token ?? '')
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ok: true, newEmail: r.newEmail })
}
