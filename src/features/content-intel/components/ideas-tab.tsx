'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  RefreshCw,
  Plus,
  Lightbulb,
  Sparkles,
  ExternalLink,
  Trash2,
  Check,
  Video,
  Share2,
  FileText,
  Filter,
  AlertCircle,
  TrendingUp,
  Zap,
  Sunrise,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

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

const STATUS_VARIANT: Record<Idea['status'], string> = {
  pending: 'border-foreground/40 text-foreground',
  generating: 'border-foreground/40 text-foreground animate-pulse',
  generated: 'border-foreground text-foreground',
  recorded: 'border-blue-500/60 text-blue-500',
  published: 'border-emerald-500/60 text-emerald-500',
  archived: 'border-border text-muted-foreground',
}

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
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
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
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
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
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
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
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
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
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <h3 className="font-heading text-2xl font-medium tracking-tight text-foreground">
              Ideas
            </h3>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
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
            className="gap-2"
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
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-foreground/40 bg-foreground/10 px-4 py-3 text-sm">
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Fuente registrada */}
      {!hasSources ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
          <h4 className="font-medium text-foreground">No tienes fuentes conectadas</h4>
          <p className="max-w-md text-sm text-muted-foreground">
            Conecta tu Google Doc de ideas. Solo necesitas que el doc esté en
            modo &quot;cualquiera con el link puede ver&quot;.
          </p>
          <Button onClick={() => setAddOpen(true)} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Conectar Google Doc
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">{s.display_name ?? 'Doc sin nombre'}</span>
              {s.source_url && (
                <a
                  href={s.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  title="Abrir en Google Docs"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span className="text-[10px] text-muted-foreground">
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
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-xs"
              >
                {syncing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Sync
              </Button>
            </div>
          ))}
          <Button
            onClick={() => setAddOpen(true)}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Otro doc
          </Button>
          {ideas.length > 0 && (
            <Button
              onClick={runRank}
              disabled={ranking}
              variant="default"
              size="sm"
              className="ml-auto gap-1.5 text-xs"
              title="Analiza tus ideas pendientes y rankea por potencial de palanca"
            >
              {ranking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analizando ideas…
                </>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5" />
                  Rankear por potencial
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Filtros status */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {(['pending', 'generated', 'recorded', 'published', 'all'] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
                filter === f
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
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
              <span className="ml-1 opacity-60">
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
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
          <Lightbulb className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
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
              <div
                key={idea.id}
                className="flex items-start gap-3 border-b border-border p-4 last:border-b-0"
              >
                <Lightbulb
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
                    {idea.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${STATUS_VARIANT[idea.status]}`}
                    >
                      {STATUS_LABELS[idea.status]}
                    </Badge>
                    {idea.position_in_source !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        #{(idea.position_in_source ?? 0) + 1}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {(idea.status === 'pending' || idea.status === 'generated') && (
                    <Button
                      onClick={() => openGenerate(idea.id)}
                      size="sm"
                      variant={idea.status === 'generated' ? 'ghost' : 'default'}
                      disabled={isGenerating}
                      className="h-8 gap-1 text-xs"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {idea.status === 'generated' ? 'Re-generar' : 'Generar guion'}
                    </Button>
                  )}
                  {idea.status === 'generated' && idea.generated_chat_id && (
                    <Button
                      onClick={() =>
                        onChatGenerated?.(idea.generated_chat_id!, undefined)
                      }
                      size="sm"
                      variant="default"
                      className="h-8 gap-1 text-xs"
                    >
                      Abrir chat
                    </Button>
                  )}
                  {idea.status === 'generated' && (
                    <Button
                      onClick={() => setIdeaStatus(idea.id, 'recorded')}
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs"
                    >
                      <Video className="h-3 w-3" />
                      Grabado
                    </Button>
                  )}
                  {idea.status === 'recorded' && (
                    <Button
                      onClick={() => setIdeaStatus(idea.id, 'published')}
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs"
                    >
                      <Share2 className="h-3 w-3" />
                      Publicado
                    </Button>
                  )}
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Borrar idea"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL: ranking de ideas por potencial */}
      <Sheet open={rankOpen} onOpenChange={setRankOpen}>
        <SheetContent
          side="right"
          className="flex w-full max-w-2xl flex-col gap-0 p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Ideas rankeadas por potencial
            </SheetTitle>
            <SheetDescription className="text-xs">
              Basado en patrones del corpus + avatar Andrés + cuello de
              botella actual de la cuenta. Las top te las recomiendo grabar
              primero.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 px-6 py-4">
              {rankResult && (
                <>
                  <div className="rounded-lg border border-border bg-card/40 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      Cuello de botella detectado
                    </div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {rankResult.bottleneck}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {rankResult.videosUsed} videos del corpus analizados · ~$
                      {rankResult.cost.toFixed(3)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {rankResult.items.map((it, idx) => {
                      const scoreColor =
                        it.score >= 80
                          ? 'border-emerald-500/60 text-emerald-500'
                          : it.score >= 60
                            ? 'border-foreground text-foreground'
                            : it.score >= 40
                              ? 'border-foreground/40 text-foreground'
                              : 'border-border text-muted-foreground'
                      const funnelColor =
                        it.funnel === 'TOFU'
                          ? 'border-blue-500/60 text-blue-500'
                          : it.funnel === 'MOFU'
                            ? 'border-purple-500/60 text-purple-500'
                            : 'border-emerald-500/60 text-emerald-500'
                      return (
                        <div
                          key={it.idea_id}
                          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-[11px] font-medium text-muted-foreground">
                              #{idx + 1}
                            </span>
                            <Badge
                              variant="outline"
                              className={`shrink-0 font-mono text-[10px] ${scoreColor}`}
                            >
                              {it.score}/100
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[10px] ${funnelColor}`}
                            >
                              {it.funnel}
                            </Badge>
                            <p className="flex-1 text-xs leading-relaxed text-foreground">
                              {it.content.slice(0, 200)}
                              {it.content.length > 200 ? '…' : ''}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
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
                              size="sm"
                              variant={idx < 3 ? 'default' : 'ghost'}
                              className="h-7 gap-1 text-xs"
                            >
                              <Sparkles className="h-3 w-3" />
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
          </ScrollArea>
          <div className="flex items-center justify-between gap-2 border-t border-border bg-card/30 px-6 py-3">
            <p className="text-[11px] text-muted-foreground">
              Te recomiendo grabar las top 3 esta semana.
            </p>
            <Button variant="ghost" onClick={() => setRankOpen(false)}>
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
        <SheetContent
          side="right"
          className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-base">Conectar Google Doc</SheetTitle>
            <SheetDescription className="text-xs">
              Pega la URL del doc. Importante: tiene que estar en modo
              &quot;cualquiera con el link puede ver&quot; (no requiere login).
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  URL del Google Doc
                </label>
                <Input
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nombre interno (opcional)
                </label>
                <Input
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Ej: Mi doc de ideas"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Para hacer público el doc: en Google Docs → Compartir →
                &quot;Cualquier persona con el enlace&quot; → Lector.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-card/30 px-6 py-3">
            <Button
              variant="ghost"
              onClick={() => setAddOpen(false)}
              disabled={addingSource}
            >
              Cancelar
            </Button>
            <Button onClick={addSource} disabled={addingSource} className="gap-2">
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
        <SheetContent
          side="right"
          className="flex w-full max-w-xl flex-col gap-0 p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Generar guion desde idea
            </SheetTitle>
            <SheetDescription className="text-xs">
              Elige los filtros del corpus para anclar el guion. El sistema
              creará un chat con esos videos en contexto y la idea como brief
              inicial.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-5 px-6 py-4">
              {/* Cuentas */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                    className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
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
                    className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
                  >
                    todas niche
                  </button>
                  <button
                    onClick={() => setGenSelectedAccountIds(new Set())}
                    className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
                  >
                    limpiar (= todas)
                  </button>
                </div>
                {accounts.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Cargando cuentas…</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
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
                )}
              </div>

              {/* Periodo */}
              <div className="flex flex-col gap-1.5">
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
                        className={`rounded-md border border-border px-2.5 py-1 text-xs ${
                          active
                            ? 'bg-foreground text-background'
                            : 'text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
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
                        className={`rounded-md border border-border px-2.5 py-1 text-xs ${
                          active
                            ? 'bg-foreground text-background'
                            : 'text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                    value={genTotalLimit}
                    onChange={(e) =>
                      setGenTotalLimit(parseInt(e.target.value, 10) || 20)
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-card/30 px-6 py-3">
            <Button
              variant="ghost"
              onClick={() => setGenerateIdeaId(null)}
              disabled={generating}
            >
              Cancelar
            </Button>
            <Button onClick={runGenerate} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando chat…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
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
