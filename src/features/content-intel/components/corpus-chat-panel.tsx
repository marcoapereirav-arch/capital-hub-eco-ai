'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Trash2,
  Filter,
  Sparkles,
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
import { extractApiError } from '../lib/extract-api-error'

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

  return (
    <div className="grid h-[calc(100vh-220px)] grid-cols-[280px_1fr] gap-4">
      {/* SIDEBAR — Lista de chats */}
      <aside className="flex flex-col gap-3 overflow-hidden">
        <Button
          onClick={() => setNewChatOpen(true)}
          className="gap-2"
          variant="default"
        >
          <Plus className="h-4 w-4" />
          Nuevo chat
        </Button>

        <div className="flex flex-col gap-1 overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
            Tus chats ({chats.length})
          </div>
          {loadingList ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center gap-1 p-4 text-center text-xs text-muted-foreground">
              <MessageSquare className="h-5 w-5 opacity-50" />
              <span>No tienes chats todavía</span>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-340px)]">
              <div className="flex flex-col">
                {chats.map((c) => {
                  const isActive = activeChat?.id === c.id
                  return (
                    <div
                      key={c.id}
                      className={`group flex items-start gap-2 border-b border-border px-3 py-2.5 transition last:border-b-0 ${
                        isActive
                          ? 'bg-muted/40'
                          : 'hover:bg-muted/20 cursor-pointer'
                      }`}
                      onClick={() => !isActive && openChat(c.id)}
                    >
                      <button className="flex flex-1 flex-col gap-1 text-left">
                        <span className="line-clamp-2 text-xs font-medium text-foreground">
                          {c.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {describeFiltersShort(c.filters)} ·{' '}
                          {c.total_videos_in_context} vids
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.updated_at).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void deleteChat(c.id)
                        }}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title="Archivar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </aside>

      {/* MAIN — Chat */}
      <main className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        {error && (
          <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {!activeChat && !loadingChat && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/50" />
            <h4 className="font-heading text-lg font-medium text-foreground">
              Chat con tu corpus
            </h4>
            <p className="max-w-md text-sm text-muted-foreground">
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
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <h3 className="line-clamp-1 text-sm font-medium text-foreground">
                  {activeChat.title}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {describeFiltersShort(activeChat.filters)} ·{' '}
                  {activeChat.total_videos_in_context} videos en contexto
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openEditFilters}
                className="gap-1.5 text-xs"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </Button>
            </div>

            {/* Mensajes */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-5">
                {activeChat.messages.length === 0 && !streaming && (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
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
            <div className="border-t border-border bg-background p-3">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 8000))}
                  maxLength={8000}
                  placeholder="Pregunta lo que sea sobre el corpus filtrado…"
                  rows={2}
                  className="resize-none text-sm"
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
                  size="default"
                  className="gap-1.5"
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
        <SheetContent side="right" className="flex w-full max-w-xl flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-base">Nuevo chat con el corpus</SheetTitle>
            <SheetDescription className="text-xs">
              Define qué subset del corpus quieres tener en contexto durante toda la conversación.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Primer mensaje (opcional)
                </label>
                <span
                  className={`text-[10px] tabular-nums ${
                    newInitialBrief.length > 7500
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
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
              <p className="text-[11px] text-muted-foreground">
                Si pones algo aquí, se envía como primer mensaje en cuanto el
                chat esté listo. Si lo dejas vacío, creas el chat y mandas
                mensajes después.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-card/30 px-6 py-3">
            <Button
              variant="ghost"
              onClick={() => setNewChatOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button onClick={createNewChat} disabled={creating} className="gap-2">
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
        <SheetContent side="right" className="flex w-full max-w-xl flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-base">Cambiar filtros del chat</SheetTitle>
            <SheetDescription className="text-xs">
              Re-selecciona videos. El historial del chat se mantiene, pero a
              partir del siguiente mensaje el modelo verá los nuevos videos.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
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
          <div className="flex items-center justify-end gap-2 border-t border-border bg-card/30 px-6 py-3">
            <Button
              variant="ghost"
              onClick={() => setEditFiltersOpen(false)}
              disabled={editingFilters}
            >
              Cancelar
            </Button>
            <Button onClick={applyEditFilters} disabled={editingFilters} className="gap-2">
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
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-foreground text-background'
            : 'border border-border bg-muted text-foreground'
        }`}
      >
        {isUser ? (
          <UserIcon className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="text-xs text-muted-foreground">
          {isUser ? 'Tú' : 'Corpus'}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
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
          className="flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cuentas
            </span>
            <Badge variant="outline" className="text-[10px]">
              {selectedAccountIds.size > 0
                ? `${selectedAccountIds.size} seleccionadas`
                : 'todas'}
            </Badge>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition ${accountsOpen ? '' : '-rotate-90'}`}
          />
        </button>
        {accountsOpen && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => selectAllRole('style')}
                className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
              >
                todas style
              </button>
              <button
                onClick={() => selectAllRole('niche')}
                className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
              >
                todas niche
              </button>
              <button
                onClick={() => setSelectedAccountIds(new Set())}
                className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
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
                  <span className="text-[10px] font-mono uppercase text-muted-foreground/70">
                    {label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((a) => {
                      const sel = selectedAccountIds.has(a.id)
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggleAccount(a.id)}
                          className={`rounded-full px-2 py-0.5 text-[11px] transition ${
                            sel
                              ? 'bg-foreground text-background'
                              : 'border border-border text-foreground hover:bg-muted/50'
                          }`}
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
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
              className={`rounded-md border border-border px-2.5 py-1 text-xs ${
                currentDays === opt.d ||
                (opt.d === null && !filters.from_date)
                  ? 'bg-foreground text-background'
                  : 'text-foreground hover:bg-muted/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Min views */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
              className={`rounded-md border border-border px-2.5 py-1 text-xs ${
                (opt.v === 0 && !filters.min_views) ||
                filters.min_views === opt.v
                  ? 'bg-foreground text-background'
                  : 'text-foreground hover:bg-muted/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orden + total_limit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
            className="h-9 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="engagement_rate">Engagement</option>
            <option value="views">Views</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
            <option value="posted_at">Fecha</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Max videos
          </label>
          <Input
            type="number"
            min={3}
            max={50}
            value={totalLimit}
            onChange={(e) => setTotalLimit(parseInt(e.target.value, 10) || 20)}
            className="h-9"
          />
        </div>
      </div>
    </div>
  )
}
