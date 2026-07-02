import { NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email/server'
import { renderEmailConfirmationEmail } from '@/lib/email/templates/email-confirmation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const TTL_HOURS = 24

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!email) return Response.json({ error: 'email invalido' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data: profile } = await supabase.from('profiles').select('id, email').ilike('email', email).maybeSingle()
  if (!profile) return Response.json({ ok: true })
  const p = profile as { id: string; email: string }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3600 * 1000).toISOString()
  await supabase.from('auth_tokens').insert({ token, email: p.email, user_id: p.id, type: 'email_confirmation', expires_at: expiresAt })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://os.capitalhubapp.com'
  const { subject, html, text } = renderEmailConfirmationEmail({ confirmLink: `${baseUrl}/auth/confirm-email?token=${token}` })
  await sendEmail({ to: p.email, subject, html, text, tag: 'auth_email_confirmation', templateName: 'email-confirmation' })
  return Response.json({ ok: true })
}
