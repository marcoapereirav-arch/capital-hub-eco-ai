import { NextRequest } from 'next/server'
import { Webhook } from 'svix'
import { createServiceRoleClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

interface ResendEvent { type: string; data: { email_id?: string; to?: string[] } }

export async function POST(req: NextRequest) {
  const payload = await req.text()
  let evt: ResendEvent
  if (WEBHOOK_SECRET) {
    try {
      evt = new Webhook(WEBHOOK_SECRET).verify(payload, {
        'svix-id': req.headers.get('svix-id') ?? '',
        'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
        'svix-signature': req.headers.get('svix-signature') ?? '',
      }) as ResendEvent
    } catch {
      return new Response('invalid signature', { status: 400 })
    }
  } else {
    evt = JSON.parse(payload) as ResendEvent
  }

  const admin = createServiceRoleClient()
  const emailId = evt.data?.email_id ?? null
  await admin.from('email_events').insert({ resend_id: emailId, type: evt.type, payload: evt }).then(() => null, () => null)

  const statusMap: Record<string, string> = { 'email.delivered': 'delivered', 'email.bounced': 'bounced', 'email.complained': 'complained' }
  const newStatus = statusMap[evt.type]
  if (emailId && newStatus) {
    await admin.from('email_messages').update({ status: newStatus }).eq('resend_id', emailId).then(() => null, () => null)
  }
  if (evt.type === 'email.bounced' || evt.type === 'email.complained') {
    const tos = Array.isArray(evt.data?.to) ? evt.data.to : []
    for (const addr of tos) {
      await admin.from('email_suppressions').upsert({ email: addr.toLowerCase(), reason: evt.type }, { onConflict: 'email' }).then(() => null, () => null)
    }
  }
  return Response.json({ ok: true })
}
