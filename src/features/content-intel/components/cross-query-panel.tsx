'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAccounts } from '../hooks/use-accounts'
import { formatHandle } from '../lib/normalize-handle'

// Placeholder sin Fase 5. Se completa con la lógica real al cablear /api/content-intel/query.
export function CrossQueryPanel() {
  const { accounts } = useAccounts()
  const [prompt, setPrompt] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [minViews, setMinViews] = useState<number | null>(null)
  const [maxVideos, setMaxVideos] = useState<number>(30)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [videosUsed, setVideosUsed] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const runQuery = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await fetch('/api/content-intel/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          account_ids: selectedAccounts,
          filters: minViews !== null ? { min_views: minViews } : {},
          max_videos: maxVideos,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setResponse(json.response_markdown ?? '(sin respuesta)')
      setVideosUsed(json.videos_used ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-[17px] font-semibold text-foreground">
          Consulta cruzada
        </h3>
        <p className="text-sm text-muted-foreground">
          Pregunta en lenguaje natural. El sistema recupera los videos más relevantes por similitud
          semántica y Claude responde citando ejemplos.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-muted-foreground">
            Consulta
          </label>
          <Textarea
            rows={4}
            placeholder="Ej: De los 20 videos más virales, ¿qué hook usan? ¿Qué tipo de CTA predomina?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Una columna en telefono: los campos no se estrechan, se apilan */}
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Cuentas (vacío = todas)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {accounts.map((a) => {
                const active = selectedAccounts.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAccount(a.id)}
                    aria-pressed={active}
                    className={cn(
                      'h-11 rounded-lg border px-3 text-[15px] transition-colors md:h-8 md:text-sm',
                      active
                        ? 'border-primary bg-primary/10 font-semibold text-foreground'
                        : 'border-border text-muted-foreground md:hover:text-foreground',
                    )}
                  >
                    {formatHandle(a.handle, a.platform)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Min. views
            </label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              className="w-full md:w-28"
              placeholder="0"
              value={minViews ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setMinViews(v === '' ? null : Number(v))
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Max videos en contexto
            </label>
            <Input
              type="number"
              inputMode="numeric"
              min={5}
              max={60}
              className="w-full md:w-20"
              value={maxVideos}
              onChange={(e) => setMaxVideos(Math.max(5, Number(e.target.value) || 30))}
            />
          </div>

          <div className="flex items-end md:ml-auto">
            <Button onClick={runQuery} disabled={loading || !prompt.trim()} className="w-full md:w-auto">
              {loading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Consultar
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <p className="mt-3 text-sm text-muted-foreground">
            Recuperando videos relevantes y construyendo la respuesta…
          </p>
        </div>
      )}

      {response && !loading && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-semibold text-muted-foreground">
            Respuesta
          </p>
          <div className="text-[15px] whitespace-pre-wrap text-foreground">{response}</div>
          {videosUsed.length > 0 && (
            <p className="mt-2 text-sm tabular-nums text-muted-foreground">
              Basado en {videosUsed.length} videos.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
