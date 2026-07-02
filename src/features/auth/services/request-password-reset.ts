import 'server-only'
import crypto from 'node:crypto'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email/server'
import { renderPasswordResetEmail } from '@/lib/email/templates/password-reset'

const TOKEN_TTL_HOURS = 24
const MAX_PER_WINDOW = 3
const WINDOW_MIN = 10

export type RequestPasswordResetResult =
  | { ok: true; sent: true }
  | { ok: false; status: number; error: string }

/**
 * Lógica única de "solicitar reset de contraseña" (email-token-based).
 *
 * Se ejecuta SIEMPRE en el servidor (service-role + Resend). La consume tanto
 * el endpoint POST /api/auth/reset-password/request como la server action
 * `resetPassword`. NUNCA se hace un self-fetch HTTP a la propia API route:
 * eso dependía de NEXT_PUBLIC_SITE_URL (vacío en local → fetch revienta) y era
 * frágil en producción (round-trip serverless / Attack Challenge Mode de Vercel).
 */
export async function requestPasswordReset(rawEmail: string): Promise<RequestPasswordResetResult> {
  const email = (rawEmail ?? '').trim().toLowerCase()
  if (!email || !/^.+@.+\..+$/.test(email)) {
    return { ok: false, status: 400, error: 'email invalido' }
  }

  const supabase = createServiceRoleClient()

  // Rate limit: máx N solicitudes por ventana. Respondemos "ok" igual para no
  // filtrar si el email existe (enumeration-safe).
  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString()
  const { count } = await supabase.from('auth_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('email', email).eq('type', 'password_reset').gte('created_at', since)
  if ((count ?? 0) >= MAX_PER_WINDOW) return { ok: true, sent: true }

  // Email no registrado → respondemos ok igual (enumeration-safe), sin enviar.
  const { data: profile } = await supabase.from('profiles').select('id, email').ilike('email', email).maybeSingle()
  if (!profile) return { ok: true, sent: true }

  const p = profile as { id: string; email: string }
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000).toISOString()
  const { error: insErr } = await supabase.from('auth_tokens').insert({
    token, email: p.email, user_id: p.id, type: 'password_reset', expires_at: expiresAt,
  })
  if (insErr) return { ok: false, status: 500, error: insErr.message }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://os.capitalhubapp.com'
  const { subject, html, text } = renderPasswordResetEmail({ resetLink: `${baseUrl}/auth/reset-password?token=${token}` })
  const result = await sendEmail({ to: p.email, subject, html, text, tag: 'auth_password_reset', templateName: 'password-reset' })
  if (!result.ok) return { ok: false, status: 500, error: result.error ?? 'No se pudo enviar el email' }

  return { ok: true, sent: true }
}
