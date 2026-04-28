'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Upload,
  Loader2,
  Check,
  AlertCircle,
  Film,
  Trash2,
  RefreshCw,
  Sparkles,
  Download,
  RotateCcw,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  VIDEO_EDIT_STATUS_LABELS,
  FUNNEL_STAGE_LABELS,
  FUNNEL_STAGE_DESCRIPTIONS,
  CTA_TYPE_LABELS,
  type CtaType,
  type FunnelStage,
  type VideoEditRow,
  type VideoEditStatus,
  type VideoPresetOption,
} from '../types/video-edit'

interface UploadUrlResponse {
  ok: boolean
  error?: string
  edit_id?: string
  upload_url?: string
  token?: string
  path?: string
}

interface ListResponse {
  ok: boolean
  error?: string
  edits?: VideoEditRow[]
}

interface PresetsResponse {
  ok: boolean
  error?: string
  presets?: VideoPresetOption[]
}

interface RenderGetResponse {
  ok: boolean
  error?: string
  edit?: Partial<VideoEditRow>
  shotstack_status?: string
}

interface RenderPostResponse {
  ok: boolean
  error?: string
  render_id?: string
}

const ACTIVE_STATUSES: VideoEditStatus[] = [
  'pending',
  'uploading',
  'transcribing',
  'cutting',
  'subtitling',
  'rendering',
]

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatDuration(s: number | null): string {
  if (!s) return '—'
  const mins = Math.floor(s / 60)
  const secs = Math.round(s % 60)
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function statusVariant(status: VideoEditStatus): { className: string } {
  switch (status) {
    case 'done':
      return { className: 'border-foreground text-foreground' }
    case 'error':
    case 'cancelled':
      return { className: 'border-destructive/60 text-destructive' }
    default:
      return { className: 'border-foreground/40 text-foreground animate-pulse' }
  }
}

export function VideoEditPanel() {
  const [edits, setEdits] = useState<VideoEditRow[]>([])
  const [presets, setPresets] = useState<VideoPresetOption[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<{ filename: string; pct: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [renderingIds, setRenderingIds] = useState<Set<string>>(new Set())

  // Configuración previa al upload
  const [presetSlug, setPresetSlug] = useState<string>('vertical-clean')
  const [funnelStage, setFunnelStage] = useState<FunnelStage | ''>('')
  const [ctaType, setCtaType] = useState<CtaType | ''>('')
  const [headlineText, setHeadlineText] = useState<string>('')
  const [ctaWord, setCtaWord] = useState<string>('')

  const fileRef = useRef<HTMLInputElement>(null)

  const loadEdits = async () => {
    try {
      const res = await fetch('/api/video-edit', { cache: 'no-store' })
      const json = (await res.json()) as ListResponse
      if (json.ok) setEdits(json.edits ?? [])
    } catch {
      // silent
    } finally {
      setLoadingList(false)
    }
  }

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/video-edit/presets', { cache: 'no-store' })
      const json = (await res.json()) as PresetsResponse
      if (json.ok && json.presets) setPresets(json.presets)
    } catch {
      // silent
    }
  }

  useEffect(() => {
    void loadEdits()
    void loadPresets()
  }, [])

  // Polling: edits en proceso → recargar lista cada 4s
  useEffect(() => {
    const hasActive = edits.some((e) => ACTIVE_STATUSES.includes(e.status))
    if (!hasActive) return
    const t = setInterval(() => void loadEdits(), 4000)
    return () => clearInterval(t)
  }, [edits])

  // Polling render: para cada edit en 'rendering', preguntar a Shotstack
  useEffect(() => {
    const renderingEdits = edits.filter((e) => e.status === 'rendering')
    if (renderingEdits.length === 0) return
    const t = setInterval(async () => {
      for (const edit of renderingEdits) {
        try {
          const res = await fetch(`/api/video-edit/${edit.id}/render`, { cache: 'no-store' })
          const json = (await res.json()) as RenderGetResponse
          if (json.ok && json.edit?.status && json.edit.status !== 'rendering') {
            void loadEdits()
            return
          }
        } catch {
          // silent
        }
      }
    }, 5000)
    return () => clearInterval(t)
  }, [edits])

  const currentPreset = presets.find((p) => p.slug === presetSlug)
  const requiresHeadline = currentPreset?.expected_inputs?.headline_text === true

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('video/')) {
      setError('Tiene que ser un archivo de video (mp4, mov).')
      return
    }
    if (file.size > 5_368_709_120) {
      setError('El video supera 5 GB. Comprímelo o usa uno más corto.')
      return
    }
    if (requiresHeadline && headlineText.trim().length === 0) {
      setError('Esta variante requiere un titular para la franja superior.')
      return
    }
    setError(null)
    setUploadProgress({ filename: file.name, pct: 0 })

    try {
      const urlRes = await fetch('/api/video-edit/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          size_bytes: file.size,
          content_type: file.type,
          preset_slug: presetSlug,
          headline_text: requiresHeadline ? headlineText.trim() : null,
          funnel_stage: funnelStage || null,
          cta_type: ctaType || null,
          cta_word: ctaWord.trim() ? ctaWord.trim() : null,
        }),
      })
      const urlJson = (await urlRes.json()) as UploadUrlResponse
      if (!urlRes.ok || !urlJson.ok || !urlJson.upload_url || !urlJson.edit_id) {
        throw new Error(urlJson.error ?? 'No se pudo iniciar el upload')
      }
      const editId = urlJson.edit_id

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', urlJson.upload_url!)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress({ filename: file.name, pct: Math.round((e.loaded / e.total) * 100) })
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload falló (HTTP ${xhr.status})`))
        }
        xhr.onerror = () => reject(new Error('Error de red durante el upload'))
        xhr.send(file)
      })

      const procRes = await fetch('/api/video-edit/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_id: editId }),
      })
      const procJson = await procRes.json()
      if (!procRes.ok || !procJson.ok) {
        throw new Error(procJson.error ?? 'No se pudo iniciar el procesado')
      }

      setUploadProgress(null)
      await loadEdits()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setUploadProgress(null)
    }
  }

  const handleRender = async (id: string) => {
    setError(null)
    setRenderingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/video-edit/${id}/render`, { method: 'POST' })
      const json = (await res.json()) as RenderPostResponse
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      await loadEdits()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al encolar el render')
    } finally {
      setRenderingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este video y su archivo? No se puede deshacer.')) return
    try {
      const res = await fetch(`/api/video-edit/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'unknown')
      await loadEdits()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <Film className="h-5 w-5 text-foreground" strokeWidth={1.5} />
          <h3 className="font-heading text-2xl font-medium tracking-tight text-foreground">
            Edición de video
          </h3>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Sube un video, elige variante del playbook, y la IA monta el Reel: corta silencios &gt; 400ms, subtítulos palabra a palabra estilo Capital Hub, render via Shotstack. Sandbox = marca de agua.
        </p>
      </div>

      {/* CONFIGURACIÓN DEL UPLOAD */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Configuración para el siguiente upload</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Preset / variante visual */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Variante visual
            </label>
            <select
              value={presetSlug}
              onChange={(e) => setPresetSlug(e.target.value)}
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              {presets.length === 0 ? (
                <option value="vertical-clean">Vertical Clean (cargando…)</option>
              ) : (
                presets.map((p) => {
                  const pendingRefs = p.implementation_status === 'pending-references'
                  return (
                    <option key={p.slug} value={p.slug}>
                      {p.display_name}
                      {pendingRefs ? ' · pendiente referencias' : ''}
                    </option>
                  )
                })
              )}
            </select>
            {currentPreset && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {currentPreset.description}
              </p>
            )}
            {currentPreset?.implementation_status === 'pending-references' && (
              <p className="text-xs text-amber-500">
                ⚠ Esta variante todavía no renderiza — pendiente de referencias visuales del usuario.
              </p>
            )}
          </div>

          {/* Funnel stage */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Posición en el embudo
            </label>
            <select
              value={funnelStage}
              onChange={(e) => setFunnelStage(e.target.value as FunnelStage | '')}
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">— Sin clasificar</option>
              {(Object.keys(FUNNEL_STAGE_LABELS) as FunnelStage[]).map((t) => (
                <option key={t} value={t}>
                  {FUNNEL_STAGE_LABELS[t]}
                </option>
              ))}
            </select>
            {funnelStage && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {FUNNEL_STAGE_DESCRIPTIONS[funnelStage]}
              </p>
            )}
          </div>

          {/* CTA type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Tipo de CTA
            </label>
            <select
              value={ctaType}
              onChange={(e) => setCtaType(e.target.value as CtaType | '')}
              className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              <option value="">— Sin CTA</option>
              {(Object.keys(CTA_TYPE_LABELS) as CtaType[]).map((t) => (
                <option key={t} value={t}>
                  {CTA_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Headline (solo Variante 2) */}
          {requiresHeadline && (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Titular para la franja superior <span className="text-destructive">*</span>
              </label>
              <Input
                value={headlineText}
                onChange={(e) => setHeadlineText(e.target.value)}
                placeholder="Ej: La verdad que nadie te dice sobre la libertad"
                maxLength={120}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Aparece estático desde el frame 0 en la franja negra superior.
              </p>
            </div>
          )}

          {/* CTA word (Tipo B) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Palabra del CTA (solo si pieza tipo B)
            </label>
            <Input
              value={ctaWord}
              onChange={(e) => setCtaWord(e.target.value.replace(/\s+/g, '').toUpperCase())}
              placeholder="Ej: RUTA"
              maxLength={30}
              className="h-10 font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Una sola palabra, sin espacios. Se mostrará destacada en los últimos 3-5s.
            </p>
          </div>
        </div>
      </div>

      {/* UPLOAD ZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (uploadProgress) return
          void handleFiles(e.dataTransfer.files)
        }}
        className={`flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card/50 px-6 py-8 text-center transition-colors ${
          dragOver ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/40'
        }`}
      >
        {uploadProgress ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
            <p className="text-sm font-medium text-foreground">{uploadProgress.filename}</p>
            <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${uploadProgress.pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{uploadProgress.pct}% subido</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-foreground">Arrastra un video aquí, o</p>
            <Button onClick={() => fileRef.current?.click()} variant="outline" size="default">
              Seleccionar archivo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-m4v"
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <p className="text-xs text-muted-foreground">MP4 / MOV · máx 5 GB</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* LISTA DE JOBS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Tus videos ({edits.length})</h4>
          <Button onClick={loadEdits} variant="ghost" size="sm" className="text-xs">
            <RefreshCw className="mr-1 h-3 w-3" />
            Refrescar
          </Button>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : edits.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Film className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Aún no has subido ningún video.
            </p>
          </div>
        ) : (
          <div className="flex flex-col rounded-xl border border-border bg-card">
            {edits.map((edit) => {
              const variant = statusVariant(edit.status)
              const isRendering = edit.status === 'rendering'
              const canRender = edit.status === 'done' && edit.transcript !== null
              const hasOutput = !!edit.output_url
              const isQueueing = renderingIds.has(edit.id)

              return (
                <div
                  key={edit.id}
                  className="flex flex-wrap items-center gap-4 border-b border-border p-4 last:border-b-0"
                >
                  <Film className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">
                      {edit.source_filename ?? edit.source_path}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className={`text-[10px] ${variant.className}`}>
                        {VIDEO_EDIT_STATUS_LABELS[edit.status]}
                      </Badge>
                      {edit.preset_slug && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {edit.preset_slug.replace(/-/g, ' ')}
                        </Badge>
                      )}
                      {edit.funnel_stage && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {edit.funnel_stage}
                        </Badge>
                      )}
                      {edit.cta_type && (
                        <Badge variant="outline" className="text-[10px]">
                          CTA: {edit.cta_type.replace('_', ' ')}
                        </Badge>
                      )}
                      {edit.cta_word && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {edit.cta_word}
                        </Badge>
                      )}
                      <span>{formatBytes(edit.size_bytes)}</span>
                      <span>·</span>
                      <span>{formatDuration(edit.duration_seconds)}</span>
                      <span>·</span>
                      <span>
                        {new Date(edit.created_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {edit.transcript && edit.transcript.words && (
                        <>
                          <span>·</span>
                          <span>{edit.transcript.words.length} palabras</span>
                        </>
                      )}
                    </div>
                    {edit.error && (
                      <p className="mt-1 text-xs text-destructive">{edit.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasOutput && edit.output_url && (
                      <a href={edit.output_url} target="_blank" rel="noreferrer" download>
                        <Button size="sm" variant="default" className="h-8 text-xs">
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Descargar
                        </Button>
                      </a>
                    )}

                    {canRender && !hasOutput && (
                      <Button
                        onClick={() => handleRender(edit.id)}
                        size="sm"
                        variant="default"
                        disabled={isQueueing}
                        className="h-8 text-xs"
                      >
                        {isQueueing ? (
                          <>
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            Encolando…
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            Generar con subtítulos
                          </>
                        )}
                      </Button>
                    )}

                    {hasOutput && canRender && (
                      <Button
                        onClick={() => handleRender(edit.id)}
                        size="sm"
                        variant="ghost"
                        disabled={isQueueing}
                        className="h-8 text-xs"
                        title="Re-renderizar"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {isRendering && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-foreground/40 text-[10px] text-foreground"
                      >
                        <Loader2 className="h-3 w-3 animate-spin" />
                        renderizando
                      </Badge>
                    )}

                    {edit.status === 'done' && !hasOutput && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Check className="h-3 w-3" />
                        transcrito
                      </Badge>
                    )}

                    <button
                      onClick={() => handleDelete(edit.id)}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Eliminar"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
