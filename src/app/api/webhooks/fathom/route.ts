import { NextRequest, after } from 'next/server'
import crypto from 'node:crypto'
import { processFathomWebhook } from '@/features/meetings/services/pipeline'
import type { FathomWebhookPayload } from '@/features/meetings/types/fathom'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const secret = process.env.FATHOM_WEBHOOK_SECRET
  if (!secret) {
    console.error('[fathom-webhook] FATHOM_WEBHOOK_SECRET not set')
    return Response.json({ ok: false, error: 'server_misconfigured' }, { status: 500 })
  }

  // Fathom no documenta el header oficial: probamos los nombres habituales.
  const sigHeader =
    req.headers.get('x-fathom-signature') ??
    req.headers.get('x-webhook-signature') ??
    req.headers.get('x-signature') ??
    ''

  if (!sigHeader) {
    return Response.json({ ok: false, error: 'missing_signature' }, { status: 401 })
  }

  if (!verifySignature(rawBody, sigHeader, secret)) {
    return Response.json({ ok: false, error: 'invalid_signature' }, { status: 401 })
  }

  let payload: FathomWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const event = payload.event ?? payload.type ?? ''
  const isRelevant =
    !event ||
    event === 'meeting_ended' ||
    event === 'meeting.ended' ||
    event === 'new_meeting_content_ready' ||
    event === 'meeting_content_ready'

  if (!isRelevant) {
    return Response.json({ ok: true, ignored: true, event })
  }

  // Responder 200 rápido; procesar en background.
  after(async () => {
    try {
      const result = await processFathomWebhook(payload)
      if (!result.ok) {
        console.error('[fathom-webhook] pipeline failed', result.error)
      }
    } catch (err) {
      console.error('[fathom-webhook] uncaught', err)
    }
  })

  return Response.json({ ok: true, queued: true })
}

function verifySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  // Soportamos tanto "sha256=<hex>" como "<hex>" directo.
  const cleaned = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7)
    : signatureHeader

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

  const sigBuf = safeHexBuffer(cleaned)
  const expBuf = safeHexBuffer(expected)
  if (!sigBuf || !expBuf || sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

function safeHexBuffer(hex: string): Buffer | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null
  try {
    return Buffer.from(hex, 'hex')
  } catch {
    return null
  }
}
