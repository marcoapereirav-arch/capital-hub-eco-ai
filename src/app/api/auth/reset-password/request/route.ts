import { NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email/server'
import { renderPasswordResetEmail } from '@/lib/email/templates/password-reset'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const TOKEN_TTL_HOURS = 24
const MAX_PER_WINDOW = 3
const WINDOW_MIN = 10

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || !/^.+@.+\..+$/.test(email)) return Response.json({ error: 'email invalido' }, { status: 400 })

  const supabase = createServiceRoleClient()

  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString()
  const { count } = await supabase.from('auth_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('email', email).eq('type', 'password_reset').gte('created_at', since)
  if ((count ?? 0) >= MAX_PER_WINDOW) return Response.json({ ok: true, sent: true })

  const { data: profile } = await supabase.from('profiles').select('id, email').ilike('email', email).maybeSingle()
  if (!profile) return Response.json({ ok: true, sent: true })

  const p = profile as { id: string; email: string }
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000).toISOString()
  const { error: insErr } = await supabase.from('auth_tokens').insert({ token, email: p.email, user_id: p.id, type: 'password_reset', expires_at: expiresAt })
  if (insErr) return Response.json({ error: insErr.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://ecoai.capitalhubapp.com'
  const { subject, html, text } = renderPasswordResetEmail({ resetLink: `${baseUrl}/auth/reset-password?token=${token}` })
  const result = await sendEmail({ to: p.email, subject, html, text, tag: 'auth_password_reset', templateName: 'password-reset' })
  if (!result.ok) return Response.json({ error: result.error }, { status: 500 })
  return Response.json({ ok: true, sent: true })
}
