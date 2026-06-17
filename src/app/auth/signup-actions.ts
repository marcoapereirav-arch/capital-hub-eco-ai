'use server'
import crypto from 'node:crypto'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email/server'
import { renderEmailConfirmationEmail } from '@/lib/email/templates/email-confirmation'

const TTL_HOURS = 24

export async function signUpWithEmailConfirmation(email: string, password: string) {
  const e = email.trim().toLowerCase()
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.auth.admin.createUser({ email: e, password, email_confirm: false })
  if (error) return { ok: false, error: error.message }

  const userId = data.user?.id ?? null
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3600 * 1000).toISOString()
  await supabase.from('auth_tokens').insert({ token, email: e, user_id: userId, type: 'email_confirmation', expires_at: expiresAt })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://ecoai.capitalhubapp.com'
  const { subject, html, text } = renderEmailConfirmationEmail({ confirmLink: `${baseUrl}/auth/confirm-email?token=${token}` })
  await sendEmail({ to: e, subject, html, text, tag: 'auth_email_confirmation', templateName: 'email-confirmation' })
  return { ok: true, userId }
}
