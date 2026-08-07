'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Trash2,
  Filter,
  Bot,
  User as UserIcon,
  X,
  ChevronDown,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { extractApiError } from '../lib/extract-api-error'

// Hoja inferior en telefono y cajon por la derecha en monitor, con el lado fijo:
// decidirlo con JavaScript pinta primero el diseno equivocado y luego salta.
const HOJA_LATERAL = cn(
  'gap-0 rounded-t-xl p-0',
  'md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-full md:max-w-xl md:rounded-l-xl md:border-l',
  'md:data-[side=bottom]:max-h-none md:data-[side=bottom]:overflow-y-auto md:data-[side=bottom]:pb-0',
)

// Desplegable nativo con los 44 puntos del dedo y los colores del tema.
const SELECT_CLASS =
  'h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base text-foreground md:h-8 md:text-sm'

interface AccountRow {
  id: string
  handle: string
  role: string | null
  is_own: boolean
  is_active: boolean
  video_count: number | null
}

interface ChatRow {
  id: string
  user_id: string
  title: string
  filters: Filters
  video_ids: string[]
  analysis_md: string | null
  platform: string
  total_videos_in_context: number
  archived: boolean
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used: number
  cost_usd: number
  created_at: string
}

interface ChatWithMessages extends ChatRow {
  messages: ChatMessage[]
}

interface Filters {
  account_ids?: string[]
  min_views?: number
  from_date?: string
  to_date?: string
  order_by?: 'views' | 'engagement_rate' | 'comments' | 'likes' | 'posted_at'
  top_n_per_account?: number
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function describeFiltersShort(f: Filters): string {
  const parts: string[] = []
  if (f.account_ids && f.account_ids.length > 0) {
    parts.push(`${f.account_ids.length} cuentas`)
  } else {
    parts.push('todas')
  }
  if (f.min_views) parts.push(`>${(f.min_views / 1000).toFixed(0)}k`)
  if (f.from_date) {
    const days = Math.round(
      (Date.now() - new Date(f.from_date).getTime()) / (1000 * 60 * 60 * 24),
    )
    parts.push(`${days}d`)
  }
  return parts.join(' · ')
}

interface CorpusChatPanelProps {
  /** Si se pasa, abre ese chat al montar (útil cuando vienes desde tab Ideas) */
  initialChatId?: string | null
  /**
   * Si se pasa junto con initialChatId, el chat se abre y se envía
   * automáticamente este texto como primer mensaje (caso típico: viene
   * desde tab Ideas con una idea recién convertida en chat).
   */
  initialPrompt?: string | null
}

export function CorpusChatPanel({
  initialChatId,
  initialPrompt,
}: CorpusChatPanelProps = {}) {
  const [chats, setChats] = useState<ChatRow[]>([])
  const [activeChat, setActiveChat] = useState<ChatWithMessages | null>(null)
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estado del mensaje en escritura
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  // Modal "Nuevo chat"
  const [newChatOpen, setNewChatOpen] = useState(false)
  // En telefono la lista de chats vive en una hoja inferior: una cosa a la vez.
  const [listaAbierta, setListaAbierta] = useState(false)
  const [newFilters, setNewFilters] = useState<Filters>({
    min_views: 100000,
    from_date: daysAgoISO(30),
    order_by: 'engagement_rate',
  })
  const [newInitialBrief, setNewInitialBrief] = useState('')
  const [newSelectedAccountIds, setNewSelectedAccountIds] = useState<Set<string>>(
    new Set(),
  )
  const [newTotalLimit, setNewTotalLimit] = useState(20)

  // Modal "Cambiar filtros del chat actual"
  const [editFiltersOpen, setEditFiltersOpen] = useState(false)
  const [editFilters, setEditFilters] = useState<Filters>({})
  const [editSelectedAccountIds, setEditSelectedAccountIds] = useState<Set<string>>(
    new Set(),
  )
  const [editTotalLimit, setEditTotalLimit] = useState(20)
  const [editingFilters, setEditingFilters] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // ============================================================
  // Carga inicial
  // ============================================================
  const loadChats = async () => {
    try {
      const res = await fetch('/api/content-intel/corpus-chats', {
        cache: 'no-store',
      })
      const json = await res.json()
      if (json.ok) setChats(json.chats ?? [])
    } catch {
      // silent
    } finally {
      setLoadingList(false)
    }
  }

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/content-intel/accounts', { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) {
        const list = (json.accounts ?? []) as AccountRow[]
        setAccounts(list.filter((a) => a.is_active))
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    void loadChats()
    void loadAccounts()
  }, [])

  // Auto-abrir el chat si llegamos con un initialChatId (desde tab Ideas)
  useEffect(() => {
    if (initialChatId && (!activeChat || activeChat.id !== initialChatId)) {
      void openChat(initialChatId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId])

  // Auto-enviar el initialPrompt como primer mensaje si el chat está vacío
  const initialPromptSentRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      activeChat &&
      initialPrompt &&
      activeChat.messages.length === 0 &&
      !streaming &&
      initialPromptSentRef.current !== activeChat.id
    ) {
      initialPromptSentRef.current = activeChat.id
      void sendMessage(initialPrompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat, initialPrompt])

  // ============================================================
  // Auto-scroll al fondo cuando llegan mensajes nuevos / stream
  // ============================================================
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeChat?.messages.length, streamingText])

  // ============================================================
  // Abrir un chat
  // ============================================================
  const openChat = async (id: string) => {
    setError(null)
    setLoadingChat(true)
    try {
      const res = await fetch(`/api/content-intel/corpus-chats/${id}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'no se pudo cargar el chat')
      setActiveChat(json.chat as ChatWithMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoadingChat(false)
    }
  }

  // ============================================================
  // Crear chat nuevo
  // ============================================================
  const createNewChat = async () => {
    setError(null)
    setCreating(true)
    try {
      // Limpieza defensiva de filtros: solo enviamos campos con valores
      // válidos. Esto evita errores de validación cuando un campo numérico
      // queda como NaN o un string vacío.
      const cleanFilters: Filters = {}
      if (
        typeof newFilters.min_views === 'number' &&
        !isNaN(newFilters.min_views) &&
        newFilters.min_views > 0
      ) {
        cleanFilters.min_views = newFilters.min_views
      }
      if (newFilters.from_date) cleanFilters.from_date = newFilters.from_date
      if (newFilters.to_date) cleanFilters.to_date = newFilters.to_date
      if (newFilters.order_by) cleanFilters.order_by = newFilters.order_by
      if (
        typeof newFilters.top_n_per_account === 'number' &&
        !isNaN(newFilters.top_n_per_account) &&
        newFilters.top_n_per_account > 0
      ) {
        cleanFilters.top_n_per_account = newFilters.top_n_per_account
      }
      if (newSelectedAccountIds.size > 0) {
        cleanFilters.account_ids = Array.from(newSelectedAccountIds)
      }

      // total_limit defensivo
      const safeTotalLimit =
        typeof newTotalLimit === 'number' &&
        !isNaN(newTotalLimit) &&
        newTotalLimit >= 3 &&
        newTotalLimit <= 50
          ? newTotalLimit
          : 20

      // initial_brief: trim + validar longitud
      const trimmedBrief = newInitialBrief.trim()
      const safeBrief =
        trimmedBrief.length === 0
          ? undefined
          : trimmedBrief.slice(0, 8000)

      const res = await fetch('/api/content-intel/corpus-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: cleanFilters,
          platform: 'instagram',
          total_limit: safeTotalLimit,
          initial_brief: safeBrief,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(extractApiError(json, res.status))
      }
      setNewChatOpen(false)
      await loadChats()
      await openChat(json.chat.id)

      // Si pasamos un initial_brief, mandarlo directo como primer mensaje
      if (newInitialBrief.trim()) {
        await sendMessage(newInitialBrief.trim(), json.chat.id)
      }

      // Reset modal state
      setNewInitialBrief('')
      setNewSelectedAccountIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCreating(false)
    }
  }

  // ============================================================
  // Enviar mensaje (con streaming)
  // ============================================================
  const sendMessage = async (text: string, chatIdOverride?: string) => {
    const chatId = chatIdOverride ?? activeChat?.id
    if (!chatId || !text.trim()) return

    setStreaming(true)
    setStreamingText('')
    setError(null)

    // Optimistic: añadir mensaje del usuario en UI
    if (activeChat) {
      setActiveChat({
        ...activeChat,
        messages: [
          ...activeChat.messages,
          {
            id: 'temp-' + Date.now(),
            chat_id: chatId,
            role: 'user',
            content: text,
            tokens_used: 0,
            cost_usd: 0,
            created_at: new Date().toISOString(),
          },
        ],
      })
    }

    try {
      const res = await fetch(
        `/api/content-intel/corpus-chats/${chatId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        },
      )

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(extractApiError(j, res.status))
      }

      if (!res.body) throw new Error('Sin stream en la respuesta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        acc += chunk
        setStreamingText(acc)
      }

      // Stream terminó. Recargamos el chat para tener IDs reales + tokens
      const fresh = await fetch(`/api/content-intel/corpus-chats/${chatId}`, {
        cache: 'no-store',
      })
      const freshJson = await fresh.json()
      if (freshJson.ok) {
        setActiveChat(freshJson.chat as ChatWithMessages)
      }
      void loadChats() // refrescar lista (updated_at + title si cambió)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setStreaming(false)
      setStreamingText('')
      setDraft('')
    }
  }

  // ============================================================
  // Borrar chat
  // ============================================================
  const deleteChat = async (id: string) => {
    if (!confirm('¿Archivar este chat? No aparecerá más en tu lista.')) return
    setError(null)
    try {
      const res = await fetch(`/api/content-intel/corpus-chats/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(extractApiError(json, res.status))
      if (activeChat?.id === id) setActiveChat(null)
      await loadChats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  // ============================================================
  // Cambiar filtros del chat actual
  // ============================================================
  const openEditFilters = () => {
    if (!activeChat) return
    setEditFilters({ ...activeChat.filters })
    setEditSelectedAccountIds(new Set(activeChat.filters.account_ids ?? []))
    setEditTotalLimit(activeChat.total_videos_in_context || 20)
    setEditFiltersOpen(true)
  }

  const applyEditFilters = async () => {
    if (!activeChat) return
    setEditingFilters(true)
    setError(null)
    try {
      const filters: Filters = {
        ...editFilters,
        ...(editSelectedAccountIds.size > 0
          ? { account_ids: Array.from(editSelectedAccountIds) }
          : { account_ids: undefined }),
      }
      const res = await fetch(
        `/api/content-intel/corpus-chats/${activeChat.id}/filters`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters, total_limit: editTotalLimit }),
        },
      )
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(extractApiError(json, res.status))
      // Recargar chat
      const fresh = await fetch(
        `/api/content-intel/corpus-chats/${activeChat.id}`,
        { cache: 'no-store' },
      )
      const freshJson = await fresh.json()
      if (freshJson.ok) setActiveChat(freshJson.chat as ChatWithMessages)
      setEditFiltersOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEditingFilters(false)
    }
  }

  // ============================================================
  // Render
  // ============================================================
  const accountsByRole = useMemo(
    () => ({
      style: accounts.filter((a) => a.role === 'style' && !a.is_own),
      niche: accounts.filter((a) => a.role === 'niche' && !a.is_own),
      other: accounts.filter(
        (a) =>
          !a.is_own &&
          a.role !== 'style' &&
          a.role !== 'niche' &&
          a.role !== 'own',
      ),
    }),
    [accounts],
  )

  const listaChats = (
    <div className="flex flex-col gap-1 overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-3 py-2 text-sm font-semibold tabular-nums text-muted-foreground">
        Tus chats ({chats.length})
      </div>
      {loadingList ? (
        <div className="flex items-center justify-center p-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : chats.length === 0 ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-1 p-4 text-center text-[15px] text-muted-foreground">
          <MessageSquare className="h-5 w-5" />
          <span>No tienes chats todavía</span>
        </div>
      ) : (
        <ScrollArea className="max-h-[50dvh] md:max-h-[calc(100dvh-340px)]">
          <div className="flex flex-col">
            {chats.map((c) => {
              const isActive = activeChat?.id === c.id
              return (
                <div
                  key={c.id}
                  className={cn(
                    'group flex items-start gap-2 border-b border-border px-3 py-2.5 transition last:border-b-0',
                    isActive ? 'bg-muted/40' : 'cursor-pointer md:hover:bg-muted/20',
                  )}
                  onClick={() => {
                    if (!isActive) openChat(c.id)
                    setListaAbierta(false)
                  }}
                >
                  <button className="flex min-h-11 flex-1 flex-col justify-center gap-1 text-left">
                    <span className="line-clamp-2 text-[15px] font-medium text-foreground md:text-sm">
                      {c.title}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {describeFiltersShort(c.filters)} ·{' '}
                      {c.total_videos_in_context} vids
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {new Date(c.updated_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                  {/* En un telefono no hay raton: si la accion solo aparece al
                      pasar por encima, no existe. Aqui siempre se ve. */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void deleteChat(c.id)
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-100 transition-opacity active:bg-destructive/10 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 md:hover:bg-destructive/10 md:hover:text-destructive"
                    title="Archivar"
                    aria-label="Archivar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  return (
    // TELEFONO: una cosa a la vez. La lista de chats vive en una hoja inferior y
    // la conversacion ocupa el ancho entero. MONITOR: las dos columnas.
    <div className="flex flex-col gap-3 md:grid md:h-[calc(100dvh-220px)] md:grid-cols-[280px_1fr] md:gap-4">
      <div className="flex gap-2 md:hidden">
        <Button onClick={() => setNewChatOpen(true)} className="flex-1 gap-2" variant="default">
          <Plus className="h-4 w-4" />
          Nuevo chat
        </Button>
        <button
          onClick={() => setListaAbierta(true)}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-4 text-[15px] text-foreground active:bg-muted"
        >
          <MessageSquare className="h-4 w-4" />
          Chats <span className="tabular-nums">({chats.length})</span>
        </button>
      </div>

      <Sheet open={listaAbierta} onOpenChange={setListaAbierta}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />
          <SheetTitle className="px-4 pt-2 text-[17px] font-semibold">Tus chats</SheetTitle>
          <div className="px-4 pb-safe-4">{listaChats}</div>
        </SheetContent>
      </Sheet>

      {/* SIDEBAR — Lista de chats (monitor) */}
      <aside className="hidden flex-col gap-3 overflow-hidden md:flex">
        <Button
          onClick={() => setNewChatOpen(true)}
          className="gap-2"
          variant="default"
        >
          <Plus className="h-4 w-4" />
          Nuevo chat
        </Button>

        {listaChats}
      </aside>

      {/* MAIN — Chat */}
      <main className="flex min-h-[60dvh] flex-col overflow-hidden rounded-xl border border-border bg-card md:min-h-0">
        {error && (
          <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {!activeChat && !loadingChat && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <h4 className="font-heading text-[17px] font-semibold text-foreground">
              Chat con tu corpus
            </h4>
            <p className="max-w-md text-[15px] text-muted-foreground">
              Crea un chat nuevo eligiendo filtros del corpus. El modelo verá
              los transcripts reales de los videos filtrados y mantendrá el
              contexto durante toda la conversación.
            </p>
            <Button onClick={() => setNewChatOpen(true)} variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Crear primer chat
            </Button>
          </div>
        )}

        {loadingChat && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {activeChat && !loadingChat && (
          <>
            {/* Header del chat */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h3 className="line-clamp-1 text-[15px] font-medium text-foreground">
                  {activeChat.title}
                </h3>
                <p className="truncate text-sm tabular-nums text-muted-foreground">
                  {describeFiltersShort(activeChat.filters)} ·{' '}
                  {activeChat.total_videos_in_context} videos en contexto
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={openEditFilters}
                className="shrink-0 gap-1.5"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>

            {/* Mensajes */}
            <div
              ref={scrollRef}
              className="no-overscroll flex-1 overflow-y-auto px-4 py-4 md:px-5"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-5">
                {activeChat.messages.length === 0 && !streaming && (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-[15px] text-muted-foreground">
                    <p>
                      Chat creado con {activeChat.total_videos_in_context}{' '}
                      videos en contexto. Pregunta lo que quieras: pídele
                      ángulos, análisis de patrones, guiones específicos,
                      ejemplos de hooks reales del corpus, etc.
                    </p>
                  </div>
                )}

                {activeChat.messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}

                {streaming && streamingText && (
                  <MessageBubble
                    message={{
                      id: 'streaming',
                      chat_id: activeChat.id,
                      role: 'assistant',
                      content: streamingText,
                      tokens_used: 0,
                      cost_usd: 0,
                      created_at: new Date().toISOString(),
                    }}
                  />
                )}

                {streaming && !streamingText && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Pensando con el corpus…
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            {/* sticky, no fixed: lo que se desplaza es el area de mensajes, y
                fixed se queda pegado a la ventana, que es lo que tapa el teclado. */}
            <div className="sticky bottom-0 border-t border-border bg-background p-3">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 8000))}
                  maxLength={8000}
                  placeholder="Pregunta lo que sea sobre el corpus filtrado…"
                  rows={2}
                  enterKeyHint="send"
                  className="resize-none"
                  disabled={streaming}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendMessage(draft)
                    }
                  }}
                />
                <Button
                  onClick={() => void sendMessage(draft)}
                  disabled={streaming || draft.trim().length === 0}
                  size="icon"
                  aria-label="Enviar"
                >
                  {streaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* MODAL Nuevo chat */}
      <Sheet open={newChatOpen} onOpenChange={(v) => !creating && setNewChatOpen(v)}>
        <SheetContent side="bottom" className={HOJA_LATERAL}>
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
          <SheetHeader className="border-b border-border px-4 py-4 md:px-6">
            <SheetTitle className="text-[17px] font-semibold">Nuevo chat con el corpus</SheetTitle>
            <SheetDescription className="text-sm">
              Define qué subset del corpus quieres tener en contexto durante toda la conversación.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 py-4 md:px-6">
            <FiltersEditor
              filters={newFilters}
              setFilters={setNewFilters}
              accounts={accounts}
              accountsByRole={accountsByRole}
              selectedAccountIds={newSelectedAccountIds}
              setSelectedAccountIds={setNewSelectedAccountIds}
              totalLimit={newTotalLimit}
              setTotalLimit={setNewTotalLimit}
            />
            <div className="mt-6 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Primer mensaje (opcional)
                </label>
                <span
                  className={cn(
                    'text-sm tabular-nums',
                    newInitialBrief.length > 7500 ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {newInitialBrief.length}/8000
                </span>
              </div>
              <Textarea
                value={newInitialBrief}
                onChange={(e) =>
                  setNewInitialBrief(e.target.value.slice(0, 8000))
                }
                maxLength={8000}
                placeholder="Ej: dame 5 ángulos virales en base a los patrones del corpus, calibrados a Andrés."
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Si pones algo aquí, se envía como primer mensaje en cuanto el
                chat esté listo. Si lo dejas vacío, creas el chat y mandas
                mensajes después.
              </p>
            </div>
          </div>
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-popover px-4 pt-3 pb-safe-4 md:flex-row md:items-center md:justify-end md:px-6 md:pb-3">
            <Button
              variant="ghost"
              className="w-full md:w-auto"
              onClick={() => setNewChatOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button onClick={createNewChat} disabled={creating} className="w-full gap-2 md:w-auto">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando chat…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear chat
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* MODAL Editar filtros del chat actual */}
      <Sheet
        open={editFiltersOpen}
        onOpenChange={(v) => !editingFilters && setEditFiltersOpen(v)}
      >
        <SheetContent side="bottom" className={HOJA_LATERAL}>
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
          <SheetHeader className="border-b border-border px-4 py-4 md:px-6">
            <SheetTitle className="text-[17px] font-semibold">Cambiar filtros del chat</SheetTitle>
            <SheetDescription className="text-sm">
              Re-selecciona videos. El historial del chat se mantiene, pero a
              partir del siguiente mensaje el modelo verá los nuevos videos.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 py-4 md:px-6">
            <FiltersEditor
              filters={editFilters}
              setFilters={setEditFilters}
              accounts={accounts}
              accountsByRole={accountsByRole}
              selectedAccountIds={editSelectedAccountIds}
              setSelectedAccountIds={setEditSelectedAccountIds}
              totalLimit={editTotalLimit}
              setTotalLimit={setEditTotalLimit}
            />
          </div>
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-popover px-4 pt-3 pb-safe-4 md:flex-row md:items-center md:justify-end md:px-6 md:pb-3">
            <Button
              variant="ghost"
              className="w-full md:w-auto"
              onClick={() => setEditFiltersOpen(false)}
              disabled={editingFilters}
            >
              Cancelar
            </Button>
            <Button onClick={applyEditFilters} disabled={editingFilters} className="w-full gap-2 md:w-auto">
              {editingFilters ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aplicando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Aplicar
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ============================================================
// Sub-componente: burbujas de mensaje
// ============================================================
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          // Verde de marca con tinta oscura encima: el blanco sobre verde da
          // 2.11 de contraste y no se lee.
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-muted text-foreground',
        )}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-sm text-muted-foreground">
          {isUser ? 'Tú' : 'Corpus'}
        </div>
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
          {message.content}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Sub-componente: editor de filtros (reusable para nuevo + editar)
// ============================================================
function FiltersEditor({
  filters,
  setFilters,
  accounts,
  accountsByRole,
  selectedAccountIds,
  setSelectedAccountIds,
  totalLimit,
  setTotalLimit,
}: {
  filters: Filters
  setFilters: (f: Filters) => void
  accounts: AccountRow[]
  accountsByRole: {
    style: AccountRow[]
    niche: AccountRow[]
    other: AccountRow[]
  }
  selectedAccountIds: Set<string>
  setSelectedAccountIds: (s: Set<string>) => void
  totalLimit: number
  setTotalLimit: (n: number) => void
}) {
  const [accountsOpen, setAccountsOpen] = useState(true)

  const toggleAccount = (id: string) => {
    const next = new Set(selectedAccountIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedAccountIds(next)
  }

  const selectAllRole = (role: string) => {
    const ids = accounts.filter((a) => a.role === role).map((a) => a.id)
    const next = new Set(selectedAccountIds)
    const all = ids.every((id) => next.has(id))
    if (all) for (const id of ids) next.delete(id)
    else for (const id of ids) next.add(id)
    setSelectedAccountIds(next)
  }

  const setDays = (days: number | null) => {
    setFilters({
      ...filters,
      from_date: days ? daysAgoISO(days) : undefined,
    })
  }

  const currentDays = filters.from_date
    ? Math.round(
        (Date.now() - new Date(filters.from_date).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null

  return (
    <div className="flex flex-col gap-5">
      {/* Cuentas */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/40 p-3">
        <button
          onClick={() => setAccountsOpen((v) => !v)}
          aria-expanded={accountsOpen}
          className="flex min-h-11 items-center justify-between gap-2 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-muted-foreground">
              Cuentas
            </span>
            <Badge variant="outline" className="h-auto py-0.5 text-sm">
              {selectedAccountIds.size > 0
                ? `${selectedAccountIds.size} seleccionadas`
                : 'todas'}
            </Badge>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-muted-foreground transition', !accountsOpen && '-rotate-90')}
          />
        </button>
        {accountsOpen && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => selectAllRole('style')}
                className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
              >
                todas style
              </button>
              <button
                onClick={() => selectAllRole('niche')}
                className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
              >
                todas niche
              </button>
              <button
                onClick={() => setSelectedAccountIds(new Set())}
                className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
              >
                limpiar
              </button>
            </div>
            {[
              { label: 'STYLE', items: accountsByRole.style },
              { label: 'NICHE', items: accountsByRole.niche },
              { label: 'OTHER', items: accountsByRole.other },
            ].map(({ label, items }) =>
              items.length === 0 ? null : (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((a) => {
                      const sel = selectedAccountIds.has(a.id)
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggleAccount(a.id)}
                          aria-pressed={sel}
                          className={cn(
                            'h-11 rounded-lg border px-3 text-sm transition md:h-8',
                            sel
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-foreground active:bg-muted/50',
                          )}
                        >
                          @{a.handle}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Periodo */}
      <div className="flex flex-col gap-2">
        <label className="text-[15px] font-semibold text-muted-foreground">
          Periodo
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { d: 7, label: '7d' },
            { d: 14, label: '14d' },
            { d: 30, label: '30d' },
            { d: 60, label: '60d' },
            { d: 90, label: '90d' },
            { d: null, label: 'todo' },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setDays(opt.d)}
              className={cn(
                'h-11 rounded-lg border border-border px-3 text-sm md:h-8',
                currentDays === opt.d || (opt.d === null && !filters.from_date)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-foreground active:bg-muted/50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Min views */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[15px] font-semibold text-muted-foreground">
          Views mínimos
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { v: 0, label: 'sin' },
            { v: 50000, label: '50k' },
            { v: 100000, label: '100k' },
            { v: 200000, label: '200k' },
            { v: 500000, label: '500k' },
            { v: 1000000, label: '1M' },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() =>
                setFilters({
                  ...filters,
                  min_views: opt.v === 0 ? undefined : opt.v,
                })
              }
              className={cn(
                'h-11 rounded-lg border border-border px-3 text-sm md:h-8',
                (opt.v === 0 && !filters.min_views) || filters.min_views === opt.v
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-foreground active:bg-muted/50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orden + total_limit */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[15px] font-semibold text-muted-foreground">
            Orden
          </label>
          <select
            value={filters.order_by ?? 'engagement_rate'}
            onChange={(e) =>
              setFilters({
                ...filters,
                order_by: e.target.value as Filters['order_by'],
              })
            }
            className={SELECT_CLASS}
          >
            <option value="engagement_rate">Engagement</option>
            <option value="views">Views</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
            <option value="posted_at">Fecha</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[15px] font-semibold text-muted-foreground">
            Max videos
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={3}
            max={50}
            value={totalLimit}
            onChange={(e) => setTotalLimit(parseInt(e.target.value, 10) || 20)}
          />
        </div>
      </div>
    </div>
  )
}
