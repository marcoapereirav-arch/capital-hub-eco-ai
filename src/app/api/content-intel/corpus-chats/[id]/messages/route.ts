import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { ContentIntelError } from '@/features/content-intel/lib/errors'
import { streamCorpusChatMessage } from '@/features/content-intel/services/corpus-chat'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface Params {
  params: Promise<{ id: string }>
}

const Schema = z.object({
  message: z.string().min(1).max(8000),
})

/**
 * POST /api/content-intel/corpus-chats/[id]/messages
 *
 * Envía un mensaje al chat y devuelve la respuesta del modelo en streaming
 * (text/plain). El cliente debe leer el body como stream y mostrar el texto
 * según va llegando para que se sienta como Claude.ai.
 *
 * El user message se guarda en BD ANTES de iniciar el stream. La respuesta
 * del assistant se guarda DESPUÉS de que el stream termine (en un finally
 * dentro del stream pipe).
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const { stream, saveAssistantResponse } = await streamCorpusChatMessage({
      chatId: id,
      userId: auth.session.userId,
      userMessage: parsed.data.message,
    })

    // Tee el stream: uno para el cliente, otro para acumular y guardar
    const [forClient, forSave] = stream.tee()

    // Acumular en background para guardar tras terminar
    void (async () => {
      const reader = forSave.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let approxTokens = 0
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
        }
        // Estimación rough de tokens: ~4 chars per token
        approxTokens = Math.ceil(fullText.length / 4)
        await saveAssistantResponse(fullText, approxTokens)
      } catch (err) {
        console.error('[corpus-chat/messages] save failed:', err)
      } finally {
        reader.releaseLock()
      }
    })()

    return new Response(forClient, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  } catch (err) {
    const code = err instanceof ContentIntelError ? err.code : 'stream_failed'
    const message = err instanceof Error ? err.message : 'unknown'
    return Response.json({ ok: false, error: code, detail: message }, { status: 500 })
  }
}
