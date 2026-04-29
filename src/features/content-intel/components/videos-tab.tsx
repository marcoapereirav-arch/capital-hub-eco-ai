'use client'

import { AlertCircle, Clapperboard, Eye, Heart, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAccounts } from '../hooks/use-accounts'
import { useVideos } from '../hooks/use-videos'
import { useContentIntelStore } from '../store/content-intel-store'
import { formatHandle } from '../lib/normalize-handle'
import type { VideoRow } from '../types/video'
import { VideoDetailSheet } from './video-detail-sheet'

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
  const color = {
    pending: 'bg-muted-foreground/40',
    running: 'bg-foreground animate-pulse',
    ok: 'bg-foreground',
    error: 'bg-destructive',
    skipped: 'bg-muted-foreground/30',
  }[status]
  return <div className={`h-1.5 w-1.5 rounded-full ${color}`} title={status} />
}

export function VideosTab() {
  const { accounts } = useAccounts()
  const videoFilters = useContentIntelStore((s) => s.videoFilters)
  const setVideoFilters = useContentIntelStore((s) => s.setVideoFilters)
  const setSelectedVideoId = useContentIntelStore((s) => s.setSelectedVideoId)

  const { videos, loading, error, refresh } = useVideos(videoFilters)

  const activeAccounts = accounts.filter((a) => a.is_active)
  const selectedAccountId = videoFilters.account_ids[0] ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          Videos
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Inspector de solo lectura del corpus. Para transcribir y analizar, usa <span className="text-foreground/80">Consultas & Guiones → Viral Lab</span> (lo hace todo en un paso).
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Cuenta</label>
          <select
            className="h-9 min-w-[200px] rounded-lg border border-input bg-transparent px-2 text-sm"
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

        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Min. views</label>
          <Input
            type="number"
            min={0}
            className="h-9 w-28"
            placeholder="0"
            value={videoFilters.min_views ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setVideoFilters({ min_views: v === '' ? null : Number(v) })
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Transcripción</label>
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
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

        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Ordenar por</label>
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
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

        <p className="ml-auto self-end text-xs text-muted-foreground">
          {activeAccounts.length} cuentas activas <span className="px-1.5 text-muted-foreground/50">·</span> {videos.length} videos cargados
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="rounded-md border border-border bg-card">
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
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Sin videos. Sincroniza una cuenta en la pestaña Cuentas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {videos.map((v) => {
              const account = accounts.find((a) => a.id === v.account_id)
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVideoId(v.id)}
                  className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/20"
                >
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail_url}
                      alt=""
                      className="h-16 w-24 shrink-0 rounded border border-border bg-muted object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded border border-border bg-muted">
                      <Clapperboard className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {account && (
                        <span className="font-mono text-[11px] text-foreground">
                          {formatHandle(account.handle, account.platform)}
                        </span>
                      )}
                      <Separator orientation="vertical" className="h-3" />
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatDate(v.posted_at)}
                      </span>
                      {v.is_reel && (
                        <Badge variant="outline" className="font-mono text-[9px] px-1 py-0">
                          REEL
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-1 text-sm text-foreground">
                      {v.caption ?? <span className="text-muted-foreground italic">sin caption</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 font-mono text-[11px] text-foreground">
                    <span className="flex items-center gap-1" title="views">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {formatNumber(v.views)}
                    </span>
                    <span className="flex items-center gap-1" title="likes">
                      <Heart className="h-3 w-3 text-muted-foreground" />
                      {formatNumber(v.likes)}
                    </span>
                    <span className="flex items-center gap-1" title="comments">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
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
