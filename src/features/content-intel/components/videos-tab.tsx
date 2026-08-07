'use client'

import { useState } from 'react'
import { AlertCircle, Clapperboard, Eye, Heart, MessageSquare, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAccounts } from '../hooks/use-accounts'
import { useVideos } from '../hooks/use-videos'
import { useContentIntelStore } from '../store/content-intel-store'
import { formatHandle } from '../lib/normalize-handle'
import type { VideoRow } from '../types/video'
import { VideoDetailSheet } from './video-detail-sheet'

// Desplegable nativo con los 44 puntos del dedo y los colores del tema.
const SELECT_CLASS =
  'h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base text-foreground md:h-8 md:text-sm'

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatEngagement(rate: number | null): string {
  if (rate == null) return '—'
  return `${(rate * 100).toFixed(1)}%`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
}

function TranscriptStatusDot({ status }: { status: VideoRow['transcript_status'] }) {
  // `skipped` va hueco (solo borde) y `pending` relleno: antes compartian la misma
  // clase y no habia forma de saber si el video estaba por transcribir o descartado.
  const color = {
    pending: 'bg-muted-foreground',
    running: 'bg-primary animate-pulse',
    ok: 'bg-primary',
    error: 'bg-destructive',
    skipped: 'border border-border bg-transparent',
  }[status]
  // En el telefono no hay raton, asi que el `title` no existe: el texto va al lado.
  const label = {
    pending: 'Pendiente',
    running: 'Transcribiendo',
    ok: 'Transcrito',
    error: 'Error',
    skipped: 'Descartado',
  }[status]
  return (
    <span className="flex items-center gap-1.5" title={label}>
      <span className={cn('h-2 w-2 shrink-0 rounded-full', color)} />
      <span className="text-sm text-muted-foreground md:hidden">{label}</span>
    </span>
  )
}

export function VideosTab() {
  const { accounts } = useAccounts()
  const videoFilters = useContentIntelStore((s) => s.videoFilters)
  const setVideoFilters = useContentIntelStore((s) => s.setVideoFilters)
  const setSelectedVideoId = useContentIntelStore((s) => s.setSelectedVideoId)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  const { videos, loading, error, refresh } = useVideos(videoFilters)

  const activeAccounts = accounts.filter((a) => a.is_active)
  const selectedAccountId = videoFilters.account_ids[0] ?? null

  // Cuantos filtros estan reduciendo la lista: es el numero del boton "Filtros".
  const filtrosActivos =
    (selectedAccountId ? 1 : 0) +
    (videoFilters.min_views != null && videoFilters.min_views !== 0 ? 1 : 0) +
    (videoFilters.has_transcript !== 'all' ? 1 : 0)

  const cuerpoFiltros = (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[15px] font-semibold text-muted-foreground">Cuenta</label>
        <select
          className={cn(SELECT_CLASS, 'md:min-w-[200px]')}
          value={selectedAccountId ?? ''}
          onChange={(e) => {
            const v = e.target.value
            setVideoFilters({ account_ids: v ? [v] : [] })
          }}
        >
          <option value="">Todas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {formatHandle(a.handle, a.platform)} · {a.video_count}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[15px] font-semibold text-muted-foreground">Min. views</label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          className="w-full md:w-28"
          placeholder="0"
          value={videoFilters.min_views ?? ''}
          onChange={(e) => {
            const v = e.target.value
            setVideoFilters({ min_views: v === '' ? null : Number(v) })
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[15px] font-semibold text-muted-foreground">Transcripción</label>
        <select
          className={SELECT_CLASS}
          value={videoFilters.has_transcript}
          onChange={(e) =>
            setVideoFilters({ has_transcript: e.target.value as 'all' | 'yes' | 'no' })
          }
        >
          <option value="all">Todas</option>
          <option value="yes">Con transcripción</option>
          <option value="no">Sin transcripción</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[15px] font-semibold text-muted-foreground">Ordenar por</label>
        <select
          className={SELECT_CLASS}
          value={videoFilters.order_by}
          onChange={(e) =>
            setVideoFilters({
              order_by: e.target.value as
                | 'views'
                | 'engagement_rate'
                | 'posted_at'
                | 'likes'
                | 'comments',
            })
          }
        >
          <option value="views">Views</option>
          <option value="engagement_rate">Engagement</option>
          <option value="likes">Likes</option>
          <option value="comments">Comments</option>
          <option value="posted_at">Fecha</option>
        </select>
      </div>

      <p className="text-sm tabular-nums text-muted-foreground md:ml-auto md:self-end">
        {activeAccounts.length} cuentas activas · {videos.length} videos cargados
      </p>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          Videos
        </h2>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Inspector de solo lectura del corpus. Para transcribir y analizar, usa <span className="text-foreground">Consultas & Guiones → Viral Lab</span> (lo hace todo en un paso).
        </p>
      </div>

      {/* TELEFONO: cuatro desplegables apilados no parecen una aplicacion. Van
          detras de un solo boton "Filtros" que abre una hoja inferior. */}
      <button
        onClick={() => setFiltrosAbiertos(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-[15px] text-foreground active:bg-muted md:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {filtrosActivos > 0 && <span className="tabular-nums">({filtrosActivos})</span>}
      </button>

      <Sheet open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />
          <SheetTitle className="px-4 pt-2 text-[17px] font-semibold">Filtros</SheetTitle>
          <div className="px-4 pb-4">{cuerpoFiltros}</div>
          <div className="sticky bottom-0 border-t border-border bg-popover px-4 pt-3 pb-safe-4">
            <button
              onClick={() => setFiltrosAbiertos(false)}
              className="h-11 w-full rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90"
            >
              Ver resultados
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* MONITOR: la barra de filtros a la vista */}
      <div className="hidden rounded-xl border border-border bg-card px-5 py-4 md:block">
        {cuerpoFiltros}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-16 w-24 shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay videos</h3>
            <p className="max-w-[38ch] text-[15px] text-muted-foreground">
              Sin videos. Sincroniza una cuenta en la pestaña Cuentas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {videos.map((v) => {
              const account = accounts.find((a) => a.id === v.account_id)
              return (
                // TELEFONO: ficha con la miniatura arriba a la izquierda y las
                // cifras debajo. MONITOR: la fila de siempre.
                <button
                  key={v.id}
                  onClick={() => setSelectedVideoId(v.id)}
                  className="flex flex-col gap-2 p-3 text-left transition-colors active:bg-muted/40 md:flex-row md:items-center md:gap-3 md:hover:bg-muted/20"
                >
                  <div className="flex min-w-0 items-start gap-3 md:flex-1">
                    {v.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnail_url}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded-lg border border-border bg-muted object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                        <Clapperboard className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {account && (
                          <span className="text-sm text-foreground">
                            {formatHandle(account.handle, account.platform)}
                          </span>
                        )}
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatDate(v.posted_at)}
                        </span>
                        {v.is_reel && (
                          <Badge variant="outline" className="h-auto px-1 py-0 text-sm">
                            REEL
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-[15px] text-foreground md:line-clamp-1">
                        {v.caption ?? <span className="text-muted-foreground italic">sin caption</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums text-foreground md:shrink-0">
                    <span className="flex items-center gap-1" title="views">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatNumber(v.views)}
                    </span>
                    <span className="flex items-center gap-1" title="likes">
                      <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatNumber(v.likes)}
                    </span>
                    <span className="flex items-center gap-1" title="comments">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatNumber(v.comments)}
                    </span>
                    <span className="text-muted-foreground" title="engagement rate">
                      {formatEngagement(v.engagement_rate)}
                    </span>
                    <TranscriptStatusDot status={v.transcript_status} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <VideoDetailSheet onRefresh={refresh} />
    </div>
  )
}
