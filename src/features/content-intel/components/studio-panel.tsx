'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Send,
  Bot,
  User as UserIcon,
  Check,
  Lightbulb,
  FileText,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAccounts } from '../hooks/use-accounts'
import { formatHandle } from '../lib/normalize-handle'
import {
  VIRAL_INTENT_LABELS,
  type AngleSuggestion,
  type StudioChatMessage,
  type ViralIntent,
} from '../types/viral-lab'

type OrderBy = 'views' | 'engagement_rate' | 'comments' | 'likes' | 'posted_at'

interface StudioChatResultDTO {
  reply: string
  intent: 'generate' | 'angles' | 'analyze' | 'chat'
  analysis_md?: string
  angles?: AngleSuggestion[]
  script_ids: string[]
  query_id: string | null
  cost_usd: number
  tokens_used: number
}

interface StudioApiResponse {
  ok: boolean
  error?: string
  result?: StudioChatResultDTO
}

interface FromAngleResponse {
  ok: boolean
  error?: string
  result?: { script_id: string; cost_usd: number; tokens_used: number }
}

const ORDER_LABELS: Record<OrderBy, string> = {
  views: 'Views',
  engagement_rate: 'Engagement rate',
  comments: 'Comments',
  likes: 'Likes',
  posted_at: 'Fecha (más reciente)',
}

const FIT_LABEL: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'Avatar · alta',
  media: 'Avatar · media',
  baja: 'Avatar · baja',
}

const FIT_RING: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'ring-2 ring-foreground/30',
  media: 'ring-1 ring-border',
  baja: 'ring-1 ring-border',
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const SUGGESTION_PROMPTS: string[] = [
  'Propón 5 ángulos accionables para esta semana.',
  'Genera 3 guiones virales sin CTA basados en lo que más funciona.',
  'Analiza qué tipo de hooks pegan más en este corpus.',
  'Hazme un guion conexión sobre cómo dejar el trabajo de oficina sin perder los nervios.',
]

interface StudioPanelProps {
  onSwitchToDrafts?: () => void
}

export function StudioPanel({ onSwitchToDrafts }: StudioPanelProps) {
  const { accounts } = useAccounts()

  // Filtros
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [minViews, setMinViews] = useState<number | null>(10000)
  const [dateRangeDays, setDateRangeDays] = useState<number | null>(90)
  const [orderBy, setOrderBy] = useState<OrderBy>('engagement_rate')
  const [topNPerAccount, setTopNPerAccount] = useState<number | null>(null)
  const [totalLimit, setTotalLimit] = useState<number>(50)

  // Chat state
  const [messages, setMessages] = useState<StudioChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(true)

  // Cache de análisis por sesión (evita re-analizar en cada turno)
  const cachedAnalysisMd = useRef<string | null>(null)
  const cachedQueryId = useRef<string | null>(null)
  const cachedFilterSig = useRef<string>('')

  const abortRef = useRef<AbortController | null>(null)

  // Estado de generación desde tarjetas de ángulo
  const [angleGenLoading, setAngleGenLoading] = useState<{ msg: number; idx: number } | null>(null)
  const [generatedAngleKeys, setGeneratedAngleKeys] = useState<Set<string>>(new Set())

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chatLoading])

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const selectedLabel = useMemo(() => {
    if (selectedAccountIds.length === 0) return 'Todas las cuentas activas'
    if (selectedAccountIds.length === accounts.length) return 'Todas las cuentas'
    return `${selectedAccountIds.length} cuenta(s) seleccionadas`
  }, [selectedAccountIds, accounts.length])

  function buildFilterPayload() {
    return {
      platform: 'instagram' as const,
      filters: {
        account_ids: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
        min_views: minViews ?? undefined,
        from_date: dateRangeDays ? daysAgoISO(dateRangeDays) : undefined,
        order_by: orderBy,
        top_n_per_account: topNPerAccount ?? undefined,
      },
      total_limit: totalLimit,
    }
  }

  function currentFilterSignature(): string {
    return JSON.stringify(buildFilterPayload())
  }

  const send = async (rawMessage?: string) => {
    const message = (rawMessage ?? input).trim()
    if (!message || chatLoading) return

    // Si el filtro cambió, invalidamos el caché de análisis
    const sig = currentFilterSignature()
    if (sig !== cachedFilterSig.current) {
      cachedAnalysisMd.current = null
      cachedQueryId.current = null
      cachedFilterSig.current = sig
    }

    const userMsg: StudioChatMessage = { role: 'user', content: message }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setChatLoading(true)
    setError(null)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/content-intel/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          ...buildFilterPayload(),
          message,
          history: messages,
          cached_analysis_md: cachedAnalysisMd.current,
          cached_query_id: cachedQueryId.current,
        }),
      })
      const json = (await res.json()) as StudioApiResponse
      if (!res.ok || !json.ok || !json.result) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const r = json.result

      if (r.analysis_md) cachedAnalysisMd.current = r.analysis_md
      if (r.query_id) cachedQueryId.current = r.query_id

      const assistantMsg: StudioChatMessage = {
        role: 'assistant',
        content: r.reply,
        script_ids: r.script_ids,
        angles: r.angles,
        analysis_md: r.intent === 'analyze' ? r.analysis_md : undefined,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Cancelado. La consulta del servidor puede seguir un rato, pero la UI ya está libre.',
          },
        ])
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    } finally {
      setChatLoading(false)
      abortRef.current = null
    }
  }

  const cancelChat = () => {
    abortRef.current?.abort()
  }

  const generateFromAngle = async (msgIdx: number, angle: AngleSuggestion, angleIdx: number) => {
    if (!cachedAnalysisMd.current) {
      setError('Falta el análisis del corpus para generar desde el ángulo. Pide primero un análisis o ángulos.')
      return
    }
    setAngleGenLoading({ msg: msgIdx, idx: angleIdx })
    setError(null)
    try {
      const res = await fetch('/api/content-intel/viral-lab/from-angle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angle,
          analysis_markdown: cachedAnalysisMd.current,
          reference_video_ids: [],
          platform: 'instagram',
        }),
      })
      const json = (await res.json()) as FromAngleResponse
      if (!res.ok || !json.ok || !json.result) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const scriptId = json.result.script_id
      const key = `${msgIdx}:${angleIdx}`
      setGeneratedAngleKeys((prev) => new Set(prev).add(key))
      // Añadimos un mensaje del asistente confirmando el draft creado
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Listo. Draft creado del ángulo: "${angle.title}". Lo encuentras en Drafts.`,
          script_ids: [scriptId],
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setAngleGenLoading(null)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-foreground" strokeWidth={1.5} />
          <h3 className="font-heading text-2xl font-medium tracking-tight text-foreground">
            Studio
          </h3>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Filtra el corpus y conversa. Pide ángulos, genera guiones, analiza patrones, o pregunta cualquier cosa — todo anclado a los videos que filtraste.
        </p>
      </div>

      {/* FILTRO */}
      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left transition-colors hover:bg-muted/20"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Filtro del corpus</span>
            <span className="text-xs text-muted-foreground">{selectedLabel}</span>
          </div>
          {filterOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {filterOpen && (
          <div className="flex flex-col gap-5 border-t border-border px-5 pb-5 pt-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">
                Cuentas <span className="text-muted-foreground/60">· vacío = todas activas</span>
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {accounts
                  .filter((a) => a.is_active)
                  .map((a) => {
                    const active = selectedAccountIds.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAccount(a.id)}
                        className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                          active
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                        }`}
                        title={`${a.role} · ${a.video_count} videos`}
                      >
                        {formatHandle(a.handle, a.platform)}
                      </button>
                    )
                  })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Min. views</label>
                <Input
                  type="number"
                  min={0}
                  className="h-9"
                  placeholder="0"
                  value={minViews ?? ''}
                  onChange={(e) =>
                    setMinViews(e.target.value === '' ? null : Number(e.target.value))
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Últimos X días</label>
                <select
                  className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={dateRangeDays ?? ''}
                  onChange={(e) =>
                    setDateRangeDays(e.target.value === '' ? null : Number(e.target.value))
                  }
                >
                  <option value="">Sin límite</option>
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                  <option value={180}>180 días</option>
                  <option value={365}>365 días</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Ordenar por</label>
                <select
                  className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value as OrderBy)}
                >
                  {(Object.keys(ORDER_LABELS) as OrderBy[]).map((k) => (
                    <option key={k} value={k}>
                      {ORDER_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">
                  Top por cuenta <span className="text-muted-foreground/60">· opcional</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  className="h-9"
                  placeholder="sin límite"
                  value={topNPerAccount ?? ''}
                  onChange={(e) =>
                    setTopNPerAccount(e.target.value === '' ? null : Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">Tope total de videos</label>
              <Input
                type="number"
                min={5}
                max={100}
                className="h-9 w-24"
                value={totalLimit}
                onChange={(e) =>
                  setTotalLimit(Math.max(5, Math.min(100, Number(e.target.value) || 50)))
                }
              />
              <span className="text-xs text-muted-foreground/70">máximo 100</span>
            </div>
          </div>
        )}
      </div>

      {/* CHAT */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-sm font-medium text-foreground">Chat sobre el corpus</span>
          <span className="text-xs text-muted-foreground">
            Enter para enviar
          </span>
        </div>

        <div ref={scrollRef} className="flex max-h-[60vh] min-h-[280px] flex-col gap-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Empieza preguntando lo que necesites — el sistema usa el filtro de arriba para anclar las respuestas. Sugerencias:
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTION_PROMPTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-lg border border-border bg-muted/10 px-4 py-2.5 text-left text-sm text-foreground/90 transition-colors hover:border-foreground/40 hover:bg-muted/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="mt-0.5 shrink-0 rounded-full border border-border bg-muted/30 p-1.5">
                  <Bot className="h-3.5 w-3.5 text-foreground" />
                </div>
              )}
              <div className={`flex max-w-[85%] flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-foreground text-background'
                      : 'bg-muted/30 text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>

                {/* Drafts creados */}
                {m.script_ids && m.script_ids.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {m.script_ids.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="gap-1.5 px-2 py-1 text-[11px]"
                      >
                        <FileText className="h-3 w-3" />
                        Draft {id.slice(0, 8)}
                      </Badge>
                    ))}
                    {onSwitchToDrafts && (
                      <Button onClick={onSwitchToDrafts} size="sm" variant="ghost" className="h-7 text-[11px]">
                        Ver drafts
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Ángulos como tarjetas */}
                {m.angles && m.angles.length > 0 && (
                  <div className="grid w-full gap-3 md:grid-cols-2">
                    {m.angles.map((angle, j) => {
                      const key = `${i}:${j}`
                      const generated = generatedAngleKeys.has(key)
                      const loading = angleGenLoading?.msg === i && angleGenLoading?.idx === j
                      return (
                        <div
                          key={j}
                          className={`flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/40 ${FIT_RING[angle.avatar_fit]} ${generated ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {FIT_LABEL[angle.avatar_fit]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {VIRAL_INTENT_LABELS[angle.suggested_intent as ViralIntent]}
                            </span>
                          </div>
                          <h4 className="font-heading text-base font-medium leading-snug tracking-tight text-foreground">
                            {angle.title}
                          </h4>
                          <p className="text-xs leading-relaxed text-foreground/80">
                            <span className="text-muted-foreground">Hook · </span>
                            {angle.hook_idea}
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {angle.why_it_works}
                          </p>
                          <Button
                            onClick={() => generateFromAngle(i, angle, j)}
                            disabled={loading || generated}
                            size="sm"
                            variant={generated ? 'ghost' : 'default'}
                            className="mt-auto"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Generando…
                              </>
                            ) : generated ? (
                              <>
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Generado
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Convertir en guion
                              </>
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Análisis crudo (intent='analyze') */}
                {m.analysis_md && (
                  <details className="w-full rounded-xl border border-border bg-card">
                    <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/20">
                      <Lightbulb className="h-4 w-4 text-muted-foreground" />
                      Ver análisis completo de patrones
                    </summary>
                    <Separator />
                    <div className="max-h-[50vh] overflow-auto whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-foreground/90">
                      {m.analysis_md}
                    </div>
                  </details>
                )}
              </div>
              {m.role === 'user' && (
                <div className="mt-0.5 shrink-0 rounded-full border border-border bg-muted/30 p-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-foreground" />
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0 rounded-full border border-border bg-muted/30 p-1.5">
                <Bot className="h-3.5 w-3.5 text-foreground" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Pensando · si es la primera consulta puede tardar 2-5 min mientras analizo el corpus.
                </span>
                <Button
                  onClick={cancelChat}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-foreground hover:bg-foreground/10"
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-destructive/40 bg-destructive/10 px-5 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-border px-5 py-3">
          <Input
            placeholder="Pídeme algo… (ej: 'genera 2 guiones virales sobre dinero')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={chatLoading}
            className="h-10 flex-1"
          />
          <Button onClick={() => void send()} disabled={chatLoading || !input.trim()} size="default">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
