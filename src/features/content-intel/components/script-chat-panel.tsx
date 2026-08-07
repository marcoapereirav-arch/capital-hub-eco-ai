'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, Bot, User, MessageSquare, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** Si la IA modificó el guion, se marca aquí para mostrar badge. */
  applied_edit?: boolean
}

interface ScriptChatPanelProps {
  scriptId: string | null
  currentScript: string
  onScriptUpdate: (newMarkdown: string) => void
}

export function ScriptChatPanel({
  scriptId,
  currentScript,
  onScriptUpdate,
}: ScriptChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset chat cuando cambia de guion.
  useEffect(() => {
    setMessages([])
    setError(null)
    setInput('')
  }, [scriptId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  if (!scriptId) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[15px] text-muted-foreground">
          Abre un guion del panel derecho para empezar a chatear sobre él.
        </p>
      </div>
    )
  }

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setError(null)

    const userMsg: ChatMessage = { role: 'user', content: text }
    const optimisticMessages = [...messages, userMsg]
    setMessages(optimisticMessages)
    setInput('')

    try {
      const res = await fetch(`/api/content-intel/scripts/${scriptId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_script: currentScript,
          user_message: text,
          history: messages,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)

      const appliedEdit = Boolean(json.new_script_markdown)
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: json.response as string,
        applied_edit: appliedEdit,
      }
      setMessages((prev) => [...prev, aiMsg])

      if (appliedEdit && typeof json.new_script_markdown === 'string') {
        onScriptUpdate(json.new_script_markdown)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-[15px] font-medium text-foreground">
            Chat sobre este guion
          </h4>
        </div>
        <span className="text-sm text-muted-foreground">
          Cmd/Ctrl + Enter para enviar
        </span>
      </div>

      {/* En telefono el alto se mide contra la pantalla (dvh), no en pixeles:
          con 360 fijos la conversacion se comia media pantalla del movil. */}
      <div ref={scrollRef} className="no-overscroll flex max-h-[50dvh] flex-col gap-3 overflow-y-auto px-3 py-3 md:max-h-[360px]">
        {messages.length === 0 && !sending && (
          <div className="flex flex-col gap-1 rounded-lg border border-dashed border-border bg-muted/20 p-3">
            <p className="text-sm font-semibold text-muted-foreground">Ejemplos</p>
            <ul className="list-disc pl-4 text-[15px] text-foreground">
              <li>Dame 5 variaciones del hook 3.</li>
              <li>El hook 3 queda fijo, borra los otros y las alternativas.</li>
              <li>Cambia la línea del McMenú, la odio. Propón 3 alternativas.</li>
              <li>Hazlo 30s máximo, más pelado, sin florituras.</li>
              <li>El cierre me sobra, quítalo.</li>
            </ul>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {m.role === 'assistant' && (
              <div className="mt-0.5 shrink-0 rounded-full border border-border bg-muted/30 p-1">
                <Bot className="h-3.5 w-3.5 text-foreground" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-[15px]',
                // La burbuja propia va en verde de marca con tinta oscura encima:
                // el blanco sobre verde da 2.11 de contraste y no se lee.
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-foreground',
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.applied_edit && (
                <p className="mt-1 flex items-center gap-1 text-sm">
                  <Check className="h-3.5 w-3.5" /> Guion actualizado arriba
                </p>
              )}
            </div>
            {m.role === 'user' && (
              <div className="mt-0.5 shrink-0 rounded-full border border-border bg-muted/30 p-1">
                <User className="h-3.5 w-3.5 text-foreground" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Pensando…
          </div>
        )}
      </div>

      {error && (
        <div className="mx-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* sticky, no fixed: lo que se desplaza es el contenedor, y fixed se queda
          pegado a la ventana, que es justo lo que tapa el teclado. */}
      <div className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-card p-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Qué quieres cambiar o explorar…"
          rows={2}
          enterKeyHint="send"
          className="min-h-12 resize-none"
          disabled={sending}
        />
        <Button onClick={send} disabled={sending || !input.trim()} size="icon" aria-label="Enviar">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
