'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  RefreshCw,
  Plus,
  Lightbulb,
  Wand2,
  ExternalLink,
  Trash2,
  Check,
  Video,
  Share2,
  FileText,
  AlertCircle,
  TrendingUp,
  Zap,
  Sunrise,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { extractApiError } from '../lib/extract-api-error'
interface Source {
  id: string
  source_type: 'google_doc'
  source_url: string | null
  display_name: string | null
  last_synced_at: string | null
  last_sync_error: string | null
  total_ideas_imported: number
}

interface Idea {
  id: string
  user_id: string
  source_id: string | null
  content: string
  status:
    | 'pending'
    | 'generating'
    | 'generated'
    | 'recorded'
    | 'published'
    | 'archived'
  generated_chat_id: string | null
  position_in_source: number | null
  created_at: string
}

interface AccountRow {
  id: string
  handle: string
  role: string | null
  is_own: boolean
  is_active: boolean
}

interface Filters {
  account_ids?: string[]
  min_views?: number
  from_date?: string
  to_date?: string
  order_by?: 'views' | 'engagement_rate' | 'comments' | 'likes' | 'posted_at'
  top_n_per_account?: number
}

type StatusFilter = 'pending' | 'generated' | 'recorded' | 'published' | 'all'

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const STATUS_LABELS: Record<Idea['status'], string> = {
  pending: 'Pendiente',
  generating: 'Generando',
  generated: 'Guion creado',
  recorded: 'Grabado',
  published: 'Publicado',
  archived: 'Archivado',
}

// Todo el color sale del tema: verde de marca para lo que ya avanzo, borde
// normal para lo que sigue pendiente. Ninguna otra familia de color entra.
const STATUS_VARIANT: Record<Idea['status'], string> = {
  pending: 'border-border text-foreground',
  generating: 'border-primary/60 text-primary animate-pulse',
  generated: 'border-primary/60 text-primary',
  recorded: 'border-primary text-primary',
  published: 'border-primary bg-primary/10 text-primary',
  archived: 'border-border text-muted-foreground',
}

// Hoja inferior en telefono y cajon por la derecha en monitor, con el lado fijo:
// decidirlo con JavaScript pinta primero el diseno equivocado y luego salta.
const HOJA_BASE = 'gap-0 rounded-t-xl p-0'
const hojaAncho = (anchoMd: string) =>
  cn(
    HOJA_BASE,
    'md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-full md:rounded-l-xl md:border-l',
    anchoMd,
    'md:data-[side=bottom]:max-h-none md:data-[side=bottom]:overflow-y-auto md:data-[side=bottom]:pb-0',
  )

// Desplegable nativo con los 44 puntos del dedo y los colores del tema.
const SELECT_CLASS =
  'h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base text-foreground md:h-8 md:text-sm'

interface IdeasTabProps {
  /** Callback opcional: cuando se genera un chat, podemos saltar al tab Chat con Corpus */
  onChatGenerated?: (chatId: string, ideaContent?: string) => void
}

export function IdeasTab({ onChatGenerated }: IdeasTabProps = {}) {
  const [sources, setSources] = useState<Source[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('pending')

  // Add source dialog
  const [addOpen, setAddOpen] = useState(false)
  const [newDocUrl, setNewDocUrl] = useState('')
  const [newDocName, setNewDocName] = useState('')
  const [addingSource, setAddingSource] = useState(false)

  // Generate dialog
  const [generateIdeaId, setGenerateIdeaId] = useState<string | null>(null)
  const [genFilters, setGenFilters] = useState<Filters>({
    min_views: 100000,
    from_date: daysAgoISO(30),
    order_by: 'engagement_rate',
  })
  const [genSelectedAccountIds, setGenSelectedAccountIds] = useState<Set<string>>(
    new Set(),
  )
  const [genTotalLimit, setGenTotalLimit] = useState(20)
  const [generating, setGenerating] = useState(false)

  // Daily session
  const [startingDaily, setStartingDaily] = useState(false)

  // Rank dialog
  const [rankOpen, setRankOpen] = useState(false)
  const [ranking, setRanking] = useState(false)
  type RankedItem = {
    idea_id: string
    content: string
    score: number
    funnel: 'TOFU' | 'MOFU' | 'BOFU'
    reason: string
    hook_preview: string
    corpus_anchor: string
  }
  const [rankResult, setRankResult] = useState<{
    bottleneck: string
    items: RankedItem[]
    videosUsed: number
    cost: number
  } | null>(null)

  // ============================================================
  // Carga
  // ============================================================
  const loadSources = async () => {
    try {
      const res = await fetch('/api/content-intel/ideas/sources', {
        cache: 'no-store',
      })
      const json = await res.json()
      if (json.ok) setSources(json.sources ?? [])
    } catch {
      // silent
    }
  }

  const loadIdeas = async () => {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/content-intel/ideas'
        : `/api/content-intel/ideas?status=${filter}`
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) setIdeas(json.ideas ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
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
    void loadSources()
    void loadAccounts()
  }, [])

  useEffect(() => {
    void loadIdeas()
  }, [filter])

  // ============================================================
  // Add source
  // ============================================================
  const addSource = async () => {
    if (!newDocUrl.trim()) {
      setError('Pega la URL del Google Doc')
      return
    }
    setAddingSource(true)
    setError(null)
    try {
      const res = await fetch('/api/content-intel/ideas/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_url_or_id: newDocUrl.trim(),
          display_name: newDocName.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(extractApiError(json, res.status))
      setNewDocUrl('')
      setNewDocName('')
      setAddOpen(false)
      await loadSources()
      // Auto-sync recién añadido
      if (json.source) {
        await syncSource(json.source.id, true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setAddingSource(false)
    }
  }

  // ============================================================
  // Sync
  // ============================================================
  const syncSource = async (sourceId: string, silent = false) => {
    setSyncing(true)
    if (!silent) setError(null)
    try {
      const res = await fetch(
        `/api/content-intel/ideas/sources/${sourceId}/sync`,
        { method: 'POST' },
      )
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(extractApiError(json, res.status))
      const r = json.result
      setSuccess(
        `Sync OK · ${r.imported} ideas nuevas · ${r.skipped_existing} ya existían (total parseadas: ${r.total_parsed})`,
      )
      await loadSources()
      await loadIdeas()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSyncing(false)
    }
  }

  // ============================================================
  // Generar guion (crea chat de corpus)
  // ============================================================
  const openGenerate = (ideaId: string) => {
    setGenerateIdeaId(ideaId)
  }

  const runGenerate = async () => {
    if (!generateIdeaId) return
    setGenerating(true)
    setError(null)
    try {
      const filters: Filters = {
        ...genFilters,
        ...(genSelectedAccountIds.size > 0
          ? { account_ids: Array.from(genSelectedAccountIds) }
          : {}),
      }
      const res = await fetch(
        `/api/content-intel/ideas/${generateIdeaId}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters, total_limit: genTotalLimit }),
        },
      )
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(extractApiError(json, res.status))
      setGenerateIdeaId(null)
      setSuccess(`Chat creado. Cambiando al tab "Chat con Corpus"…`)
      await loadIdeas()
      if (onChatGenerated && json.result?.chatId) {
        setTimeout(
          () => onChatGenerated(json.result.chatId, json.result.ideaContent),
          800,
        )
      }
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setGenerating(false)
    }
  }

  // ============================================================
  // Sesión del día (chat conversacional con corpus + ideas)
  // ============================================================
  const startDailySession = async () => {
    setStartingDaily(true)
    setError(null)
    try {
      const res = await fetch('/api/content-intel/ideas/daily-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'instagram', total_limit: 25 }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(extractApiError(json, res.status))
      // Saltamos al tab "Chat con Corpus" con el chat ya creado + el primer
      // mensaje auto-enviado pidiendo las 3 mejores ideas
      if (onChatGenerated && json.chat_id) {
        onChatGenerated(json.chat_id, json.first_user_message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setStartingDaily(false)
    }
  }

  // ============================================================
  // Rank ideas por potencial (cuello de botella)
  // ============================================================
  const runRank = async () => {
    setRanking(true)
    setError(null)
    try {
      const filters: Filters = {
        min_views: 100000,
        from_date: daysAgoISO(60),
        order_by: 'engagement_rate',
        top_n_per_account: 3,
      }
      const res = await fetch('/api/content-intel/ideas/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          total_limit: 25,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(extractApiError(json, res.status))
      setRankResult({
        bottleneck: json.result.bottleneck_analysis,
        items: json.result.ranked,
        videosUsed: json.result.videos_used,
        cost: json.result.cost_usd,
      })
      setRankOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setRanking(false)
    }
  }

  // ============================================================
  // Status update / delete
  // ============================================================
  const setIdeaStatus = async (id: string, status: Idea['status']) => {
    try {
      await fetch(`/api/content-intel/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await loadIdeas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const deleteIdea = async (id: string) => {
    if (!confirm('¿Borrar esta idea?')) return
    try {
      await fetch(`/api/content-intel/ideas/${id}`, { method: 'DELETE' })
      await loadIdeas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  // ============================================================
  // Counts
  // ============================================================
  const counts = useMemo(() => {
    const c = {
      pending: 0,
      generated: 0,
      recorded: 0,
      published: 0,
      all: ideas.length,
    }
    for (const i of ideas) {
      if (i.status === 'pending') c.pending++
      else if (i.status === 'generated' || i.status === 'generating') c.generated++
      else if (i.status === 'recorded') c.recorded++
      else if (i.status === 'published') c.published++
    }
    return c
  }, [ideas])

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

  // ============================================================
  // Render
  // ============================================================
  const hasSources = sources.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <h3 className="font-heading text-2xl font-medium tracking-tight text-foreground">
              Ideas
            </h3>
          </div>
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Conecta un Google Doc con tus ideas crudas. Sincroniza para
            importarlas, y convierte cada idea en un guion grounded en el
            corpus con 1 clic.
          </p>
        </div>
        {sources.length > 0 && (
          <Button
            onClick={startDailySession}
            disabled={startingDaily}
            size="lg"
            variant="default"
            className="w-full gap-2 md:w-auto"
            title="Inicia una sesión conversacional para elegir las 3 ideas del día y generar los 3 guiones"
          >
            {startingDaily ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparando sesión…
              </>
            ) : (
              <>
                <Sunrise className="h-4 w-4" />
                Sesión del día
              </>
            )}
          </Button>
        )}
      </div>

      {/* Errores / éxitos */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">{success}</span>
        </div>
      )}

      {/* Fuente registrada */}
      {!hasSources ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          <h4 className="text-[17px] font-semibold text-foreground">No tienes fuentes conectadas</h4>
          <p className="max-w-md text-[15px] text-muted-foreground">
            Conecta tu Google Doc de ideas. Solo necesitas que el doc esté en
            modo &quot;cualquiera con el link puede ver&quot;.
          </p>
          <Button onClick={() => setAddOpen(true)} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Conectar Google Doc
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 md:flex-row md:flex-wrap md:items-center">
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 text-[15px]">{s.display_name ?? 'Doc sin nombre'}</span>
              {s.source_url && (
                <a
                  href={s.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:h-6 md:w-6"
                  title="Abrir en Google Docs"
                  aria-label="Abrir en Google Docs"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <span className="text-sm tabular-nums text-muted-foreground">
                {s.last_synced_at
                  ? `sync: ${new Date(s.last_synced_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'sin sync'}
              </span>
              <Button
                onClick={() => syncSource(s.id)}
                disabled={syncing}
                variant="ghost"
                className="gap-1"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync
              </Button>
            </div>
          ))}
          <Button
            onClick={() => setAddOpen(true)}
            variant="ghost"
            className="w-full md:w-auto"
          >
            <Plus className="mr-1 h-4 w-4" />
            Otro doc
          </Button>
          {ideas.length > 0 && (
            <Button
              onClick={runRank}
              disabled={ranking}
              variant="default"
              className="w-full gap-1.5 md:ml-auto md:w-auto"
              title="Analiza tus ideas pendientes y rankea por potencial de palanca"
            >
              {ranking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando ideas…
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Rankear por potencial
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Filtros status */}
      {/* Tira deslizable: cinco filtros no caben en 375 puntos sin encogerse */}
      <div className="-mx-4 flex snap-x gap-1 overflow-x-auto px-4 md:mx-0 md:rounded-lg md:border md:border-border md:bg-card md:p-1">
        {(['pending', 'generated', 'recorded', 'published', 'all'] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'h-11 shrink-0 snap-start rounded-lg px-3 text-[15px] whitespace-nowrap transition-colors md:h-8 md:flex-1 md:text-sm',
                filter === f
                  ? 'bg-primary font-semibold text-primary-foreground'
                  : 'bg-card text-muted-foreground md:bg-transparent md:hover:text-foreground',
              )}
            >
              {f === 'pending'
                ? 'Pendientes'
                : f === 'generated'
                  ? 'Con guion'
                  : f === 'recorded'
                    ? 'Grabados'
                    : f === 'published'
                      ? 'Publicados'
                      : 'Todas'}
              <span className="ml-1 tabular-nums">
                ({f === 'all' ? counts.all : counts[f]})
              </span>
            </button>
          ),
        )}
      </div>

      {/* Lista de ideas */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
          <Lightbulb className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          <h4 className="text-[17px] font-semibold text-foreground">Nada por aquí</h4>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            {filter === 'pending'
              ? 'No tienes ideas pendientes. Sincroniza tu doc o cambia el filtro.'
              : `Sin ideas en estado "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col rounded-xl border border-border bg-card">
          {ideas.map((idea) => {
            const isGenerating = idea.status === 'generating'
            return (
              // TELEFONO: ficha apilada con las acciones abajo, a 44 puntos.
              // MONITOR: la fila de siempre.
              <div
                key={idea.id}
                className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 md:flex-row md:items-start"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Lightbulb
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="line-clamp-3 text-[15px] leading-relaxed text-foreground">
                      {idea.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn('h-auto py-0.5 text-sm', STATUS_VARIANT[idea.status])}
                      >
                        {STATUS_LABELS[idea.status]}
                      </Badge>
                      {idea.position_in_source !== null && (
                        <span className="text-sm tabular-nums text-muted-foreground">
                          #{(idea.position_in_source ?? 0) + 1}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:shrink-0 md:flex-nowrap">
                  {(idea.status === 'pending' || idea.status === 'generated') && (
                    <Button
                      onClick={() => openGenerate(idea.id)}
                      variant={idea.status === 'generated' ? 'ghost' : 'default'}
                      disabled={isGenerating}
                      className="flex-1 gap-1 md:flex-none"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {idea.status === 'generated' ? 'Re-generar' : 'Generar guion'}
                    </Button>
                  )}
                  {idea.status === 'generated' && idea.generated_chat_id && (
                    <Button
                      onClick={() =>
                        onChatGenerated?.(idea.generated_chat_id!, undefined)
                      }
                      variant="default"
                      className="flex-1 gap-1 md:flex-none"
                    >
                      Abrir chat
                    </Button>
                  )}
                  {idea.status === 'generated' && (
                    <Button
                      onClick={() => setIdeaStatus(idea.id, 'recorded')}
                      variant="ghost"
                      className="flex-1 gap-1 md:flex-none"
                    >
                      <Video className="h-4 w-4" />
                      Grabado
                    </Button>
                  )}
                  {idea.status === 'recorded' && (
                    <Button
                      onClick={() => setIdeaStatus(idea.id, 'published')}
                      variant="ghost"
                      className="flex-1 gap-1 md:flex-none"
                    >
                      <Share2 className="h-4 w-4" />
                      Publicado
                    </Button>
                  )}
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-destructive/10 md:h-8 md:w-8 md:hover:bg-destructive/10 md:hover:text-destructive"
                    title="Borrar idea"
                    aria-label="Borrar idea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL: ranking de ideas por potencial */}
      <Sheet open={rankOpen} onOpenChange={setRankOpen}>
        <SheetContent side="bottom" className={hojaAncho('md:max-w-2xl')}>
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
          <SheetHeader className="border-b border-border px-4 py-4 md:px-6">
            <SheetTitle className="flex items-center gap-2 text-[17px] font-semibold">
              <TrendingUp className="h-4 w-4" />
              Ideas rankeadas por potencial
            </SheetTitle>
            <SheetDescription className="text-sm">
              Basado en patrones del corpus + avatar Andrés + cuello de
              botella actual de la cuenta. Las top te las recomiendo grabar
              primero.
            </SheetDescription>
          </SheetHeader>
          <div>
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
              {rankResult && (
                <>
                  <div className="rounded-lg border border-border bg-card/40 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      Cuello de botella detectado
                    </div>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
                      {rankResult.bottleneck}
                    </p>
                    <p className="mt-2 text-sm tabular-nums text-muted-foreground">
                      {rankResult.videosUsed} videos del corpus analizados · ~$
                      {rankResult.cost.toFixed(3)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {rankResult.items.map((it, idx) => {
                      // Cuanto mas alta la nota, mas verde de marca. El resto,
                      // borde normal: no entra ninguna otra familia de color.
                      const scoreColor =
                        it.score >= 80
                          ? 'border-primary bg-primary/10 text-primary'
                          : it.score >= 60
                            ? 'border-primary/60 text-primary'
                            : it.score >= 40
                              ? 'border-border text-foreground'
                              : 'border-border text-muted-foreground'
                      // Las tres etapas se distinguen con recursos del tema (relleno,
                      // solo borde, neutro) en vez de con tres familias de color:
                      // asi la columna de embudo se sigue leyendo de un vistazo.
                      const funnelColor =
                        it.funnel === 'BOFU'
                          ? 'border-primary bg-primary/10 text-primary'
                          : it.funnel === 'MOFU'
                            ? 'border-primary/50 text-primary'
                            : 'border-border text-muted-foreground'
                      return (
                        <div
                          key={it.idea_id}
                          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                #{idx + 1}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn('h-auto shrink-0 py-0.5 text-sm tabular-nums', scoreColor)}
                              >
                                {it.score}/100
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn('h-auto shrink-0 py-0.5 text-sm', funnelColor)}
                              >
                                {it.funnel}
                              </Badge>
                            </div>
                            <p className="text-[15px] leading-relaxed text-foreground">
                              {it.content.slice(0, 200)}
                              {it.content.length > 200 ? '…' : ''}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 border-t border-border pt-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium text-foreground">
                                Hook propuesto:
                              </span>{' '}
                              <em>&quot;{it.hook_preview}&quot;</em>
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                Por qué:
                              </span>{' '}
                              {it.reason}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                Ancla en corpus:
                              </span>{' '}
                              {it.corpus_anchor}
                            </div>
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              onClick={() => {
                                setRankOpen(false)
                                setTimeout(() => openGenerate(it.idea_id), 200)
                              }}
                              variant={idx < 3 ? 'default' : 'ghost'}
                              className="w-full gap-1 md:w-auto"
                            >
                              <Wand2 className="h-4 w-4" />
                              Generar guion
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* sticky, no fixed: lo que se desplaza es la hoja */}
          <div className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-popover px-4 pt-3 pb-safe-4 md:flex-row md:items-center md:justify-between md:px-6 md:pb-3">
            <p className="text-sm text-muted-foreground">
              Te recomiendo grabar las top 3 esta semana.
            </p>
            <Button variant="ghost" className="w-full md:w-auto" onClick={() => setRankOpen(false)}>
              Cerrar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* MODAL: añadir fuente */}
      <Sheet
        open={addOpen}
        onOpenChange={(v) => !addingSource && setAddOpen(v)}
      >
        <SheetContent side="bottom" className={hojaAncho('md:max-w-md')}>
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
          <SheetHeader className="border-b border-border px-4 py-4 md:px-6">
            <SheetTitle className="text-[17px] font-semibold">Conectar Google Doc</SheetTitle>
            <SheetDescription className="text-sm">
              Pega la URL del doc. Importante: tiene que estar en modo
              &quot;cualquiera con el link puede ver&quot; (no requiere login).
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  URL del Google Doc
                </label>
                <Input
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  inputMode="url"
                  enterKeyHint="next"
                  placeholder="https://docs.google.com/document/d/..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Nombre interno (opcional)
                </label>
                <Input
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  enterKeyHint="done"
                  placeholder="Ej: Mi doc de ideas"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Para hacer público el doc: en Google Docs → Compartir →
                &quot;Cualquier persona con el enlace&quot; → Lector.
              </p>
            </div>
          </div>
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-popover px-4 pt-3 pb-safe-4 md:flex-row md:items-center md:justify-end md:px-6 md:pb-3">
            <Button
              variant="ghost"
              className="w-full md:w-auto"
              onClick={() => setAddOpen(false)}
              disabled={addingSource}
            >
              Cancelar
            </Button>
            <Button onClick={addSource} disabled={addingSource} className="w-full gap-2 md:w-auto">
              {addingSource ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Conectar
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* MODAL: generar (filtros) */}
      <Sheet
        open={generateIdeaId !== null}
        onOpenChange={(v) => !generating && !v && setGenerateIdeaId(null)}
      >
        <SheetContent side="bottom" className={hojaAncho('md:max-w-xl')}>
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
          <SheetHeader className="border-b border-border px-4 py-4 md:px-6">
            <SheetTitle className="flex items-center gap-2 text-[17px] font-semibold">
              <Wand2 className="h-4 w-4" />
              Generar guion desde idea
            </SheetTitle>
            <SheetDescription className="text-sm">
              Elige los filtros del corpus para anclar el guion. El sistema
              creará un chat con esos videos en contexto y la idea como brief
              inicial.
            </SheetDescription>
          </SheetHeader>
          <div>
            <div className="flex flex-col gap-5 px-4 py-4 md:px-6">
              {/* Cuentas */}
              <div className="flex flex-col gap-2">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Cuentas de referencia
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      const ids = accountsByRole.style.map((a) => a.id)
                      const next = new Set(genSelectedAccountIds)
                      const all = ids.every((id) => next.has(id))
                      if (all) for (const id of ids) next.delete(id)
                      else for (const id of ids) next.add(id)
                      setGenSelectedAccountIds(next)
                    }}
                    className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
                  >
                    todas style
                  </button>
                  <button
                    onClick={() => {
                      const ids = accountsByRole.niche.map((a) => a.id)
                      const next = new Set(genSelectedAccountIds)
                      const all = ids.every((id) => next.has(id))
                      if (all) for (const id of ids) next.delete(id)
                      else for (const id of ids) next.add(id)
                      setGenSelectedAccountIds(next)
                    }}
                    className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
                  >
                    todas niche
                  </button>
                  <button
                    onClick={() => setGenSelectedAccountIds(new Set())}
                    className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
                  >
                    limpiar (= todas)
                  </button>
                </div>
                {accounts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Cargando cuentas…</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {accounts
                      .filter((a) => !a.is_own)
                      .map((a) => {
                        const sel = genSelectedAccountIds.has(a.id)
                        return (
                          <button
                            key={a.id}
                            onClick={() => {
                              const next = new Set(genSelectedAccountIds)
                              if (next.has(a.id)) next.delete(a.id)
                              else next.add(a.id)
                              setGenSelectedAccountIds(next)
                            }}
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
                )}
              </div>

              {/* Periodo */}
              <div className="flex flex-col gap-1.5">
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
                  ].map((opt) => {
                    const currentDays = genFilters.from_date
                      ? Math.round(
                          (Date.now() - new Date(genFilters.from_date).getTime()) /
                            (1000 * 60 * 60 * 24),
                        )
                      : null
                    const active =
                      currentDays === opt.d ||
                      (opt.d === null && !genFilters.from_date)
                    return (
                      <button
                        key={opt.label}
                        onClick={() =>
                          setGenFilters({
                            ...genFilters,
                            from_date: opt.d ? daysAgoISO(opt.d) : undefined,
                          })
                        }
                        aria-pressed={active}
                        className={cn(
                          'h-11 rounded-lg border border-border px-3 text-sm md:h-8',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'text-foreground active:bg-muted/50',
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
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
                  ].map((opt) => {
                    const active =
                      (opt.v === 0 && !genFilters.min_views) ||
                      genFilters.min_views === opt.v
                    return (
                      <button
                        key={opt.label}
                        onClick={() =>
                          setGenFilters({
                            ...genFilters,
                            min_views: opt.v === 0 ? undefined : opt.v,
                          })
                        }
                        aria-pressed={active}
                        className={cn(
                          'h-11 rounded-lg border border-border px-3 text-sm md:h-8',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'text-foreground active:bg-muted/50',
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[15px] font-semibold text-muted-foreground">
                    Orden
                  </label>
                  <select
                    value={genFilters.order_by ?? 'engagement_rate'}
                    onChange={(e) =>
                      setGenFilters({
                        ...genFilters,
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
                    value={genTotalLimit}
                    onChange={(e) =>
                      setGenTotalLimit(parseInt(e.target.value, 10) || 20)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-popover px-4 pt-3 pb-safe-4 md:flex-row md:items-center md:justify-end md:px-6 md:pb-3">
            <Button
              variant="ghost"
              className="w-full md:w-auto"
              onClick={() => setGenerateIdeaId(null)}
              disabled={generating}
            >
              Cancelar
            </Button>
            <Button onClick={runGenerate} disabled={generating} className="w-full gap-2 md:w-auto">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando chat…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Crear chat
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
