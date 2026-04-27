'use client'

import { useState } from 'react'
import { Loader2, Eye, Heart, MessageSquare, ExternalLink, Sparkles } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
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
    <Sheet open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="shrink-0 border-b border-border pb-4">
          <SheetTitle className="font-heading text-lg font-medium tracking-tight">
            Detalle del video
          </SheetTitle>
          <SheetDescription className="text-xs">
            Metadata, transcript y análisis.
          </SheetDescription>
        </SheetHeader>

        {!video && loading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {video && (
          <ScrollArea className="flex-1 px-0">
            <div className="flex flex-col gap-4 p-1">
              {video.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="w-full rounded border border-border bg-muted object-cover aspect-video"
                />
              )}

              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatNumber(video.views)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatNumber(video.likes)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatNumber(video.comments)}
                </span>
                {video.duration_s != null && (
                  <span className="text-muted-foreground">{video.duration_s}s</span>
                )}
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  Ver en IG <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {video.caption && (
                <div className="rounded border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Caption
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {video.caption}
                  </p>
                </div>
              )}

              <Separator />

              {/* Transcript */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    Transcript
                  </h3>
                  {hasTranscript ? (
                    <Badge variant="outline" className="font-mono text-[9px]">
                      {video.transcript_language?.toUpperCase() ?? '??'}
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={runTranscribe} disabled={transcribing}>
                      {transcribing ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Transcribir
                    </Button>
                  )}
                </div>
                {hasTranscript ? (
                  <div className="rounded border border-border bg-card p-3 max-h-80 overflow-auto">
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {video.transcript}
                    </p>
                  </div>
                ) : video.transcript === '[NO_SPEECH]' ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    Video sin audio hablado — solo música o visuales.
                  </p>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">
                    Todavía no hay transcript. Usa el botón para generarlo.
                  </p>
                )}
              </div>

              <Separator />

              {/* Analysis */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">
                    Análisis
                  </h3>
                  {hasTranscript && (
                    <Button
                      size="sm"
                      variant={hasAnalysis ? 'ghost' : 'default'}
                      onClick={runAnalyze}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                      )}
                      {hasAnalysis ? 'Re-analizar' : 'Analizar'}
                    </Button>
                  )}
                </div>

                {video.analysis ? (
                  <div className="flex flex-col gap-3 rounded border border-border bg-card p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Hook
                      </p>
                      <p className="text-sm text-foreground">{video.analysis.hook}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        CTA
                      </p>
                      <p className="text-sm text-foreground">
                        <span className="font-mono text-xs">{video.analysis.cta_type}</span>
                        {video.analysis.cta_detail && (
                          <> · {video.analysis.cta_detail}</>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Pilares
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {video.analysis.pillars.map((p) => (
                          <Badge key={p} variant="outline" className="font-mono text-[10px]">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Hipótesis de viralidad
                      </p>
                      <p className="text-sm text-foreground">
                        {video.analysis.virality_hypothesis}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Señales de intención (comentarios)
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {video.analysis.intent_signals_count} / 100
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground">
                    {hasTranscript
                      ? 'Sin analizar. Usa el botón para extraer hook + CTA + pilares.'
                      : 'Transcribe primero para poder analizar.'}
                  </p>
                )}
              </div>

              {actionError && (
                <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {actionError}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}
