'use client'

import { useState } from 'react'
import { Loader2, Eye, Heart, MessageSquare, ExternalLink, Wand2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useContentIntelStore } from '../store/content-intel-store'
import { useVideo } from '../hooks/use-videos'

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString('es-ES')
}

export function VideoDetailSheet({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const selectedVideoId = useContentIntelStore((s) => s.selectedVideoId)
  const setSelectedVideoId = useContentIntelStore((s) => s.setSelectedVideoId)

  const { video, loading, refresh } = useVideo(selectedVideoId)

  const [transcribing, setTranscribing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isOpen = selectedVideoId !== null
  const handleClose = () => setSelectedVideoId(null)

  const runTranscribe = async () => {
    if (!video) return
    setTranscribing(true)
    setActionError(null)
    try {
      const res = await fetch('/api/content-intel/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_ids: [video.id] }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      await refresh()
      await onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setTranscribing(false)
    }
  }

  const runAnalyze = async () => {
    if (!video) return
    setAnalyzing(true)
    setActionError(null)
    try {
      const res = await fetch('/api/content-intel/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setAnalyzing(false)
    }
  }

  const hasTranscript = video?.transcript && video.transcript !== '[NO_SPEECH]'
  const hasAnalysis = Boolean(video?.analysis)

  return (
    // Hoja inferior en telefono, cajon por la derecha en monitor. El lado se fija
    // con clases: decidirlo con JavaScript pinta primero el diseno equivocado.
    <Sheet open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side="bottom"
        className={cn(
          'rounded-t-xl',
          'md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-full md:max-w-2xl md:rounded-l-xl md:border-l',
          'md:data-[side=bottom]:max-h-none md:data-[side=bottom]:pb-0',
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
        <SheetHeader className="shrink-0 border-b border-border pb-4">
          <SheetTitle className="font-heading text-lg font-medium tracking-tight">
            Detalle del video
          </SheetTitle>
          <SheetDescription className="text-sm">
            Metadata, transcript y análisis.
          </SheetDescription>
        </SheetHeader>

        {!video && loading && (
          <div className="flex flex-1 items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {video && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            {video.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnail_url}
                alt=""
                className="aspect-video w-full rounded-lg border border-border bg-muted object-cover"
              />
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm tabular-nums">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-muted-foreground" />
                {formatNumber(video.views)}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-muted-foreground" />
                {formatNumber(video.likes)}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                {formatNumber(video.comments)}
              </span>
              {video.duration_s != null && (
                <span className="text-muted-foreground">{video.duration_s}s</span>
              )}
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex h-11 items-center gap-1 text-[15px] text-muted-foreground md:h-auto md:text-sm md:hover:text-foreground"
              >
                Ver en IG <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {video.caption && (
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="mb-1.5 text-sm font-semibold text-muted-foreground">
                  Caption
                </p>
                <p className="text-[15px] whitespace-pre-wrap text-foreground">
                  {video.caption}
                </p>
              </div>
            )}

            <Separator />

            {/* Transcript */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15px] font-medium text-foreground">
                  Transcript
                </h3>
                {hasTranscript ? (
                  <Badge variant="outline" className="h-auto py-0.5 text-sm">
                    {video.transcript_language?.toUpperCase() ?? '??'}
                  </Badge>
                ) : (
                  <Button onClick={runTranscribe} disabled={transcribing}>
                    {transcribing ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : null}
                    Transcribir
                  </Button>
                )}
              </div>
              {hasTranscript ? (
                <div className="max-h-80 overflow-auto rounded-lg border border-border bg-card p-3">
                  <p className="text-[15px] whitespace-pre-wrap text-foreground">
                    {video.transcript}
                  </p>
                </div>
              ) : video.transcript === '[NO_SPEECH]' ? (
                <p className="text-sm text-muted-foreground">
                  Video sin audio hablado — solo música o visuales.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay transcript. Usa el botón para generarlo.
                </p>
              )}
            </div>

            <Separator />

            {/* Analysis */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15px] font-medium text-foreground">
                  Análisis
                </h3>
                {hasTranscript && (
                  <Button
                    variant={hasAnalysis ? 'ghost' : 'default'}
                    onClick={runAnalyze}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-1 h-4 w-4" />
                    )}
                    {hasAnalysis ? 'Re-analizar' : 'Analizar'}
                  </Button>
                )}
              </div>

              {video.analysis ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Hook
                    </p>
                    <p className="text-[15px] text-foreground">{video.analysis.hook}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      CTA
                    </p>
                    <p className="text-[15px] text-foreground">
                      {video.analysis.cta_type}
                      {video.analysis.cta_detail && (
                        <> · {video.analysis.cta_detail}</>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Pilares
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {video.analysis.pillars.map((p) => (
                        <Badge key={p} variant="outline" className="h-auto py-0.5 text-sm">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Hipótesis de viralidad
                    </p>
                    <p className="text-[15px] text-foreground">
                      {video.analysis.virality_hypothesis}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Señales de intención (comentarios)
                    </p>
                    <p className="text-[15px] tabular-nums text-foreground">
                      {video.analysis.intent_signals_count} / 100
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {hasTranscript
                    ? 'Sin analizar. Usa el botón para extraer hook + CTA + pilares.'
                    : 'Transcribe primero para poder analizar.'}
                </p>
              )}
            </div>

            {actionError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {actionError}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
