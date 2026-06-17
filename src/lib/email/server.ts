import 'server-only'
import { getResendClient, RESEND_FROM } from './resend-client'
import { createServiceRoleClient } from '@/lib/supabase/service'

const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || undefined

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tag?: string
  templateName?: string
  metadata?: Record<string, unknown>
}
export interface SendEmailResult { ok: boolean; id?: string; error?: string; skipped?: boolean }

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  let client
  try { client = getResendClient() } catch { return { ok: false, skipped: true, error: 'RESEND_API_KEY no configurada' } }

  const list = Array.isArray(input.to) ? input.to : [input.to]
  const cleanTo = list.map((s) => s.trim().toLowerCase()).filter(Boolean)
  if (cleanTo.length === 0) return { ok: false, error: 'Sin destinatarios.' }

  const admin = createServiceRoleClient()
  const { data: suppressed } = await admin.from('email_suppressions').select('email').in('email', cleanTo)
  if (suppressed && suppressed.length > 0) {
    const blocked = suppressed.map((s: { email: string }) => s.email)
    const remaining = cleanTo.filter((e) => !blocked.includes(e))
    if (remaining.length === 0) return { ok: false, skipped: true, error: 'Destinatarios bloqueados (suppressed).' }
    cleanTo.splice(0, cleanTo.length, ...remaining)
  }

  const fromAddr = input.from || RESEND_FROM
  const baseRow = {
    to_email: cleanTo[0], from_email: fromAddr, subject: input.subject,
    tag: input.tag ?? null, template_name: input.templateName ?? null, metadata: input.metadata ?? {},
  }

  try {
    const { data, error } = await client.emails.send({
      from: fromAddr,
      to: cleanTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo || EMAIL_REPLY_TO,
      tags: input.tag ? [{ name: 'category', value: input.tag }] : undefined,
    })
    if (error) {
      await admin.from('email_messages').insert({ ...baseRow, resend_id: null, status: 'failed', error_message: error.message }).then(() => null, () => null)
      return { ok: false, error: error.message }
    }
    await admin.from('email_messages').insert({ ...baseRow, resend_id: data?.id ?? null, status: 'sent' }).then(() => null, () => null)
    return { ok: true, id: data?.id }
  } catch (err) {
    const message = (err as Error).message
    await admin.from('email_messages').insert({ ...baseRow, resend_id: null, status: 'failed', error_message: message }).then(() => null, () => null)
    return { ok: false, error: message }
  }
}
