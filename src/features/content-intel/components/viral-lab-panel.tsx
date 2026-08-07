'use client'

import { useMemo, useState } from 'react'
import {
  Loader2,
  Wand2,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAccounts } from '../hooks/use-accounts'
import { formatHandle } from '../lib/normalize-handle'
import {
  VIRAL_INTENTS,
  VIRAL_INTENT_LABELS,
  type AngleSuggestion,
  type ViralIntent,
} from '../types/viral-lab'

type OrderBy = 'views' | 'engagement_rate' | 'comments' | 'likes' | 'posted_at'

interface RunResult {
  analysis_markdown: string
  angles: AngleSuggestion[]
  script_ids: string[]
  cost_usd: number
  tokens_used: number
  videos_used: number
  query_id: string | null
  reference_video_ids: string[]
}

interface RunResponse {
  ok: boolean
  error?: string
  result?: RunResult
}

interface FromAngleResponse {
  ok: boolean
  error?: string
  result?: { script_id: string; cost_usd: number; tokens_used: number }
}

const INTENT_DOT_COLOR: Record<ViralIntent, string> = {
  viral: 'bg-primary',
  cta: 'bg-primary',
  conexion: 'bg-primary',
  libre: 'bg-muted-foreground',
}

// Desplegable nativo con los 44 puntos del dedo y los colores del tema.
const SELECT_CLASS =
  'h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base text-foreground md:h-8 md:text-sm'

const FIT_LABEL: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'Avatar · alta',
  media: 'Avatar · media',
  baja: 'Avatar · baja',
}

// El encaje alto se marca con el verde de marca; el resto, con el borde normal.
const FIT_RING: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'ring-2 ring-primary/40',
  media: 'ring-1 ring-border',
  baja: 'ring-1 ring-border',
}

const ORDER_LABELS: Record<OrderBy, string> = {
  views: 'Views',
  engagement_rate: 'Engagement rate',
  comments: 'Comments',
  likes: 'Likes',
  posted_at: 'Fecha (más reciente)',
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

interface ViralLabPanelProps {
  onSwitchToGenerate?: () => void
}

export function ViralLabPanel({ onSwitchToGenerate }: ViralLabPanelProps) {
  const { accounts } = useAccounts()

  // Filtros
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [minViews, setMinViews] = useState<number | null>(10000)
  const [dateRangeDays, setDateRangeDays] = useState<number | null>(90)
  const [orderBy, setOrderBy] = useState<OrderBy>('engagement_rate')
  const [topNPerAccount, setTopNPerAccount] = useState<number | null>(null)
  const [totalLimit, setTotalLimit] = useState<number>(50)

  // Generación
  const [intent, setIntent] = useState<ViralIntent>('viral')
  const [numScripts, setNumScripts] = useState<number>(3)
  const [extraBrief, setExtraBrief] = useState<string>('')

  // UI state
  const [filterOpen, setFilterOpen] = useState(true)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null)
  const [angleLoading, setAngleLoading] = useState<number | null>(null)
  const [generatedAngles, setGeneratedAngles] = useState<Set<number>>(new Set())

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

  const run = async () => {
    const ctrl = new AbortController()
    setAbortCtrl(ctrl)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/content-intel/viral-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          platform: 'instagram',
          filters: {
            account_ids: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
            min_views: minViews ?? undefined,
            from_date: dateRangeDays ? daysAgoISO(dateRangeDays) : undefined,
            order_by: orderBy,
            top_n_per_account: topNPerAccount ?? undefined,
          },
          total_limit: totalLimit,
          num_scripts: numScripts,
          intent,
          extra_brief: extraBrief.trim() || undefined,
        }),
      })
      const json = (await res.json()) as RunResponse
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setResult(json.result ?? null)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Cancelado. El análisis en servidor puede seguir un rato, pero la UI ya está libre.')
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    } finally {
      setLoading(false)
      setAbortCtrl(null)
    }
  }

  const cancel = () => {
    abortCtrl?.abort()
  }

  const handleGenerateFromAngle = async (angle: AngleSuggestion, idx: number) => {
    if (!result) return
    setAngleLoading(idx)
    setError(null)
    try {
      const res = await fetch('/api/content-intel/viral-lab/from-angle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angle,
          analysis_markdown: result.analysis_markdown,
          reference_video_ids: result.reference_video_ids,
          platform: 'instagram',
        }),
      })
      const json = (await res.json()) as FromAngleResponse
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      if (json.result) {
        setResult({
          ...result,
          script_ids: [...result.script_ids, json.result.script_id],
          cost_usd: result.cost_usd + json.result.cost_usd,
          tokens_used: result.tokens_used + json.result.tokens_used,
        })
        setGeneratedAngles((prev) => new Set(prev).add(idx))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setAngleLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="h-5 w-5 text-foreground" strokeWidth={1.5} />
          <h3 className="font-heading text-2xl font-medium tracking-tight text-foreground">
            Viral Lab
          </h3>
        </div>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Filtra videos del corpus, deja que el sistema analice patrones reales + tu voz, y elige qué ángulos quieres convertir en guion.
        </p>
      </div>

      {/* FILTROS */}
      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          aria-expanded={filterOpen}
          className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-4 text-left transition-colors active:bg-muted/20 md:px-5 md:hover:bg-muted/20"
        >
          <div className="flex min-w-0 flex-col">
            <span className="text-[15px] font-medium text-foreground">Filtro del corpus</span>
            <span className="truncate text-sm text-muted-foreground">{selectedLabel}</span>
          </div>
          {filterOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {filterOpen && (
          <div className="flex flex-col gap-5 border-t border-border px-4 pt-4 pb-5 md:px-5">
            <div className="flex flex-col gap-2">
              <label className="text-[15px] font-semibold text-muted-foreground">
                Cuentas <span className="font-normal">· vacío = todas activas</span>
              </label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {accounts
                  .filter((a) => a.is_active)
                  .map((a) => {
                    const active = selectedAccountIds.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAccount(a.id)}
                        aria-pressed={active}
                        className={cn(
                          'h-11 rounded-lg border px-3 text-sm transition-colors md:h-8',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-muted-foreground md:hover:border-primary/40 md:hover:text-foreground',
                        )}
                        title={`${a.role} · ${a.video_count} videos`}
                      >
                        {formatHandle(a.handle, a.platform)}
                      </button>
                    )
                  })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Min. views
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  value={minViews ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setMinViews(v === '' ? null : Number(v))
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Últimos X días
                </label>
                <select
                  className={SELECT_CLASS}
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Ordenar por
                </label>
                <select
                  className={SELECT_CLASS}
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

              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Top por cuenta <span className="font-normal">· opcional</span>
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={50}
                  placeholder="sin límite"
                  value={topNPerAccount ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setTopNPerAccount(v === '' ? null : Number(v))
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <label className="text-[15px] font-semibold text-muted-foreground">Tope total de videos</label>
              <Input
                type="number"
                inputMode="numeric"
                min={5}
                max={100}
                className="w-full md:w-24"
                value={totalLimit}
                onChange={(e) => setTotalLimit(Math.max(5, Math.min(100, Number(e.target.value) || 50)))}
              />
              <span className="text-sm text-muted-foreground">
                máximo 100 para controlar coste
              </span>
            </div>
          </div>
        )}
      </div>

      {/* GENERACIÓN */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <span className="text-[15px] font-medium text-foreground">Qué generar</span>
          <span className="text-sm text-muted-foreground">
            Si pones 0 guiones, solo verás los 5 ángulos detectados — eliges manualmente cuáles convertir.
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-semibold text-muted-foreground">Intent</label>
            <select
              className={SELECT_CLASS}
              value={intent}
              onChange={(e) => setIntent(e.target.value as ViralIntent)}
            >
              {VIRAL_INTENTS.map((k) => (
                <option key={k} value={k}>
                  {VIRAL_INTENT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-semibold text-muted-foreground">Número de guiones</label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={10}
              value={numScripts}
              onChange={(e) => setNumScripts(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-[15px] font-semibold text-muted-foreground">
            Brief adicional <span className="font-normal">· opcional</span>
          </label>
          <Textarea
            rows={3}
            placeholder='Ej: "enfócate en temas de dinero y ambición" o "hazme storytelling con metáfora"'
            value={extraBrief}
            onChange={(e) => setExtraBrief(e.target.value)}
          />
        </div>
      </div>

      {/* ACCIÓN */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm tabular-nums text-muted-foreground">
          Coste estimado <span className="text-foreground">~${(totalLimit * 0.015 + numScripts * 0.1).toFixed(2)}</span>
          <span className="px-1.5" aria-hidden>·</span>
          Tiempo <span className="text-foreground">~{Math.max(1, Math.ceil(totalLimit / 20) + numScripts)} min</span>
        </p>
        <div className="flex items-center gap-2">
          {loading && (
            <Button onClick={cancel} variant="ghost" className="flex-1 md:flex-none">
              <X className="mr-1.5 h-4 w-4" />
              Cancelar
            </Button>
          )}
          <Button onClick={run} disabled={loading} className="flex-1 md:flex-none">
            {loading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-1.5 h-4 w-4" />
            )}
            Ejecutar Viral Lab
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:p-5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <p className="mt-2 text-sm text-muted-foreground">
            Filtrando videos · auto-transcribiendo lo que falte · analizando patrones · detectando 5 ángulos accionables.
          </p>
        </div>
      )}

      {/* RESULT */}
      {result && !loading && (
        <div className="flex flex-col gap-6">
          {/* Banner de pendientes (si hay scripts ya generados) */}
          {result.script_ids.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-[15px] font-medium text-foreground">
                    {result.script_ids.length} guion{result.script_ids.length !== 1 && 'es'} creado{result.script_ids.length !== 1 && 's'} en Pendientes
                  </p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    Drafts guardados · {result.tokens_used.toLocaleString('es-ES')} tokens · ${result.cost_usd.toFixed(4)}
                  </p>
                </div>
                {onSwitchToGenerate && (
                  <Button onClick={onSwitchToGenerate} variant="outline" className="w-full shrink-0 md:w-auto">
                    Ver pendientes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* TOP 5 ÁNGULOS — la pieza estrella */}
          {result.angles.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-xl font-medium tracking-tight text-foreground">
                  Top {result.angles.length} ángulos para esta semana
                </h3>
                <p className="text-[15px] text-muted-foreground">
                  La IA propone los ángulos más fuertes según tu corpus + tu avatar. Genera el guion del que más te convenza con un clic.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {result.angles.map((angle, i) => {
                  const isLoading = angleLoading === i
                  const isGenerated = generatedAngles.has(i)
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all md:p-5 md:hover:border-primary/40',
                        FIT_RING[angle.avatar_fit],
                        isGenerated && 'opacity-60',
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          {FIT_LABEL[angle.avatar_fit]}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn('h-2 w-2 rounded-full', INTENT_DOT_COLOR[angle.suggested_intent])} />
                          <span className="text-sm text-muted-foreground">
                            {VIRAL_INTENT_LABELS[angle.suggested_intent]}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-heading text-lg leading-snug font-medium tracking-tight text-foreground">
                        {angle.title}
                      </h4>

                      <p className="text-[15px] leading-relaxed text-foreground">
                        <span className="text-muted-foreground">Hook · </span>
                        {angle.hook_idea}
                      </p>

                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {angle.why_it_works}
                      </p>

                      <div className="mt-auto pt-2">
                        <Button
                          onClick={() => handleGenerateFromAngle(angle, i)}
                          disabled={isLoading || isGenerated}
                          variant={isGenerated ? 'ghost' : 'default'}
                          className="w-full"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              Generando…
                            </>
                          ) : isGenerated ? (
                            <>
                              <Check className="mr-1.5 h-4 w-4" />
                              Generado
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-1.5 h-4 w-4" />
                              Generar guion
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Análisis crudo — colapsable, baja prioridad visual */}
          <div className="rounded-xl border border-border bg-card">
            <button
              onClick={() => setAnalysisOpen(!analysisOpen)}
              aria-expanded={analysisOpen}
              className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-4 text-left transition-colors active:bg-muted/20 md:px-5 md:hover:bg-muted/20"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-[15px] font-medium text-foreground">Análisis completo de patrones</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {result.videos_used} videos analizados · markdown crudo
                </span>
              </div>
              {analysisOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {analysisOpen && (
              <>
                <Separator />
                <div className="no-overscroll max-h-[60dvh] overflow-auto px-4 py-4 text-[15px] leading-relaxed whitespace-pre-wrap text-foreground md:px-5">
                  {result.analysis_markdown}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
