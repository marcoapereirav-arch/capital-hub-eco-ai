import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email/server'
import { renderEmailChangeEmail } from '@/lib/email/templates/email-change'

/**
 * Cambio de email seguro SIN tocar el esquema de BD.
 *
 * `auth_tokens.type` tiene un CHECK que NO incluye 'email_change' y la BD vive en
 * la cuenta de Adrián, así que no añadimos un tipo ni una tabla. En su lugar el
 * token es un JWT HS256 firmado con el service-role key (server-only):
 *   - va firmado → no se puede falsificar
 *   - lleva exp (24h) → caduca solo
 *   - lleva `oldEmail` → si el email actual ya cambió, el enlace deja de valer
 *     (anti-replay efectivo sin persistencia)
 * La confirmación llega SIEMPRE al email NUEVO (verifica que el dueño lo controla).
 */

const TTL = '24h'

function secret(): Uint8Array {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
  return new TextEncoder().encode(s)
}

export type EmailChangeResult = { ok: true; newEmail?: string } | { ok: false; status: number; error: string }

/** Genera el token + envía el correo de confirmación al email NUEVO. */
export async function requestEmailChange(userId: string, oldEmailRaw: string, newEmailRaw: string): Promise<EmailChangeResult> {
  const newEmail = (newEmailRaw ?? '').trim().toLowerCase()
  const oldEmail = (oldEmailRaw ?? '').trim().toLowerCase()
  if (!newEmail || !/^.+@.+\..+$/.test(newEmail)) return { ok: false, status: 400, error: 'Email inválido' }
  if (newEmail === oldEmail) return { ok: false, status: 400, error: 'Ese ya es el email actual' }

  const supabase = createServiceRoleClient()
  const { data: taken } = await supabase.from('profiles').select('id').ilike('email', newEmail).maybeSingle()
  if (taken && (taken as { id: string }).id !== userId) return { ok: false, status: 409, error: 'Ese email ya lo usa otra cuenta' }

  const token = await new SignJWT({ newEmail, oldEmail, kind: 'email_change' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secret())

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://os.capitalhubapp.com'
  const { subject, html, text } = renderEmailChangeEmail({ confirmLink: `${baseUrl}/auth/confirm-email-change?token=${token}`, newEmail })
  const r = await sendEmail({ to: newEmail, subject, html, text, tag: 'auth_email_change', templateName: 'email-change' })
  if (!r.ok) return { ok: false, status: 500, error: r.error ?? 'No se pudo enviar el email de confirmación' }
  return { ok: true, newEmail }
}

/** Verifica el token y aplica el cambio de email en auth + profiles + users. */
export async function confirmEmailChange(tokenRaw: string): Promise<EmailChangeResult> {
  const token = (tokenRaw ?? '').trim()
  if (!token) return { ok: false, status: 400, error: 'Enlace inválido' }

  let payload: { sub?: string; newEmail?: string; oldEmail?: string; kind?: string }
  try {
    const v = await jwtVerify(token, secret())
    payload = v.payload as typeof payload
  } catch {
    return { ok: false, status: 400, error: 'El enlace es inválido o ha caducado' }
  }
  if (payload.kind !== 'email_change' || !payload.sub || !payload.newEmail) {
    return { ok: false, status: 400, error: 'Enlace inválido' }
  }

  const userId = payload.sub
  const newEmail = payload.newEmail.trim().toLowerCase()
  const supabase = createServiceRoleClient()

  // Anti-replay: el email actual debe seguir siendo el de origen del token.
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  const currentEmail = (authUser.user?.email ?? '').trim().toLowerCase()
  if (payload.oldEmail && currentEmail && currentEmail !== payload.oldEmail.trim().toLowerCase()) {
    return { ok: false, status: 400, error: 'Este enlace ya no es válido (el email cambió desde que se pidió).' }
  }

  const { data: taken } = await supabase.from('profiles').select('id').ilike('email', newEmail).maybeSingle()
  if (taken && (taken as { id: string }).id !== userId) return { ok: false, status: 409, error: 'Ese email ya lo usa otra cuenta' }

  const { error: updErr } = await supabase.auth.admin.updateUserById(userId, { email: newEmail, email_confirm: true })
  if (updErr) return { ok: false, status: 500, error: updErr.message }

  // Mirrors (best-effort): profiles (OS) + users (App).
  await supabase.from('profiles').update({ email: newEmail, updated_at: new Date().toISOString() }).eq('id', userId).then(() => null, () => null)
  await supabase.from('users').update({ email: newEmail }).eq('auth_user_id', userId).then(() => null, () => null)

  return { ok: true, newEmail }
}
