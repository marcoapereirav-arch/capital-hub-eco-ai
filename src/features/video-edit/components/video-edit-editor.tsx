'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Type,
  Scissors,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  VideoEditRow,
  WhisperWord,
  LlmCut,
} from '../types/video-edit'

interface VideoEditEditorProps {
  edit: VideoEditRow | null
  open: boolean
  onClose: () => void
  /** Callback cuando se completa una re-renderización exitosa. */
  onRerendered?: () => void
}

interface ManualCutDraft {
  start: string
  end: string
  reason: string
}

/**
 * Editor manual del transcript y los cortes detectados por la IA.
 *
 * Se abre como sheet lateral. El usuario puede:
 *  1. Editar/borrar palabras del transcript (corregir errores de Whisper).
 *  2. Aprobar o rechazar cada corte detectado por el LLM.
 *  3. Añadir cortes manuales (start/end en segundos).
 *  4. Renderizar con sus cambios — el endpoint combina todo y dispara el
 *     pipeline de Remotion.
 */
export function VideoEditEditor({
  edit,
  open,
  onClose,
  onRerendered,
}: VideoEditEditorProps) {
  // Estado local
  const [words, setWords] = useState<WhisperWord[]>([])
  const [llmCuts, setLlmCuts] = useState<LlmCut[]>([])
  const [rejectedIdx, setRejectedIdx] = useState<Set<number>>(new Set())
  const [manualCuts, setManualCuts] = useState<LlmCut[]>([])
  const [draft, setDraft] = useState<ManualCutDraft>({ start: '', end: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState({ transcript: false, cuts: false })

  // Sincronizar cuando cambia el edit seleccionado
  useEffect(() => {
    if (!edit) return
    setWords(edit.transcript?.words ?? [])
    setLlmCuts(edit.llm_cuts ?? [])
    setRejectedIdx(new Set(edit.cut_overrides?.rejected_indices ?? []))
    setManualCuts(edit.cut_overrides?.manual ?? [])
    setDirty({ transcript: false, cuts: false })
    setError(null)
  }, [edit])

  const totalDuration = useMemo(() => {
    if (words.length === 0) return 0
    return words[words.length - 1]?.end ?? 0
  }, [words])

  const updateWord = (index: number, newWord: string) => {
    setWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, word: newWord } : w)),
    )
    setDirty((d) => ({ ...d, transcript: true }))
  }

  const deleteWord = (index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index))
    setDirty((d) => ({ ...d, transcript: true }))
  }

  const toggleRejected = (index: number) => {
    setRejectedIdx((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
    setDirty((d) => ({ ...d, cuts: true }))
  }

  const addManualCut = () => {
    const start = parseFloat(draft.start)
    const end = parseFloat(draft.end)
    if (isNaN(start) || isNaN(end) || end <= start) {
      setError('Start y end deben ser números válidos con end > start')
      return
    }
    if (start < 0 || end > totalDuration + 5) {
      setError(`Los cortes deben estar dentro del rango 0-${totalDuration.toFixed(1)}s`)
      return
    }
    setManualCuts((prev) => [
      ...prev,
      { start, end, reason: draft.reason.trim() || 'manual' },
    ])
    setDraft({ start: '', end: '', reason: '' })
    setDirty((d) => ({ ...d, cuts: true }))
    setError(null)
  }

  const removeManualCut = (index: number) => {
    setManualCuts((prev) => prev.filter((_, i) => i !== index))
    setDirty((d) => ({ ...d, cuts: true }))
  }

  /**
   * Guarda transcript editado y cuts en BD, luego dispara render.
   */
  const handleRerender = async () => {
    if (!edit) return
    setError(null)
    setSaving(true)

    try {
      // 1) Guardar transcript si cambió
      if (dirty.transcript) {
        const res = await fetch(`/api/video-edit/${edit.id}/transcript`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words }),
        })
        const json = await res.json()
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? `transcript save failed (HTTP ${res.status})`)
        }
      }

      // 2) Guardar cut overrides si cambió
      if (dirty.cuts) {
        const res = await fetch(`/api/video-edit/${edit.id}/cuts`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rejected_indices: Array.from(rejectedIdx),
            manual: manualCuts,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? `cuts save failed (HTTP ${res.status})`)
        }
      }

      setDirty({ transcript: false, cuts: false })
      setSaving(false)
      setRendering(true)

      // 3) Disparar render
      const renderRes = await fetch(`/api/video-edit/${edit.id}/render`, {
        method: 'POST',
      })
      const renderJson = await renderRes.json()
      if (!renderRes.ok || !renderJson.ok) {
        throw new Error(renderJson.error ?? `render failed (HTTP ${renderRes.status})`)
      }

      setRendering(false)
      onRerendered?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setSaving(false)
      setRendering(false)
    }
  }

  if (!edit) return null

  const isProcessing = saving || rendering
  const approvedLlmCount = llmCuts.length - rejectedIdx.size

  return (
    <Sheet open={open} onOpenChange={(v) => !v && !isProcessing && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full max-w-3xl flex-col gap-0 p-0 sm:max-w-3xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base font-medium">
            Editor manual
            <Badge variant="outline" className="ml-2 font-mono text-[10px]">
              {edit.source_filename ?? edit.id.slice(0, 8)}
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-xs">
            Corrige palabras mal transcritas y aprueba/rechaza cortes detectados.
            Al terminar, pulsa &quot;Renderizar con mis cambios&quot; para generar el video
            final.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="transcript" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid w-fit grid-cols-2">
            <TabsTrigger value="transcript" className="gap-1.5 text-xs">
              <Type className="h-3.5 w-3.5" />
              Subtítulos ({words.length})
            </TabsTrigger>
            <TabsTrigger value="cuts" className="gap-1.5 text-xs">
              <Scissors className="h-3.5 w-3.5" />
              Cortes ({approvedLlmCount + manualCuts.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB SUBTÍTULOS */}
          <TabsContent value="transcript" className="flex-1 overflow-hidden px-6 pb-2 pt-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Edita las palabras o bórralas. Los timestamps se conservan tal cual.
              </p>
              {dirty.transcript && (
                <Badge variant="outline" className="text-[10px]">
                  cambios sin guardar
                </Badge>
              )}
            </div>
            <ScrollArea className="h-[calc(100vh-280px)] rounded-lg border border-border">
              <div className="flex flex-col">
                {words.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No hay transcripción todavía.
                  </div>
                ) : (
                  words.map((w, i) => (
                    <div
                      key={`${i}-${w.start}`}
                      className="flex items-center gap-3 border-b border-border/50 px-3 py-1.5 last:border-b-0 hover:bg-muted/30"
                    >
                      <span className="w-24 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                        {w.start.toFixed(2)}–{w.end.toFixed(2)}
                      </span>
                      <Input
                        value={w.word}
                        onChange={(e) => updateWord(i, e.target.value)}
                        className="h-7 flex-1 border-0 bg-transparent px-1 text-sm focus-visible:bg-card focus-visible:ring-1"
                      />
                      <button
                        onClick={() => deleteWord(i)}
                        className="rounded p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Borrar palabra"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB CORTES */}
          <TabsContent value="cuts" className="flex-1 overflow-hidden px-6 pb-2 pt-3">
            <ScrollArea className="h-[calc(100vh-280px)] pr-3">
              <div className="flex flex-col gap-4">
                {/* Cortes detectados por la IA */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-foreground">
                      Detectados por la IA ({approvedLlmCount}/{llmCuts.length})
                    </h4>
                    {dirty.cuts && (
                      <Badge variant="outline" className="text-[10px]">
                        cambios sin guardar
                      </Badge>
                    )}
                  </div>
                  {llmCuts.length === 0 ? (
                    <p className="rounded-lg border border-border/50 p-3 text-xs text-muted-foreground">
                      La IA no detectó cortes en este video.
                    </p>
                  ) : (
                    <div className="flex flex-col rounded-lg border border-border">
                      {llmCuts.map((cut, i) => {
                        const isRejected = rejectedIdx.has(i)
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-b-0 ${
                              isRejected ? 'opacity-50' : ''
                            }`}
                          >
                            <button
                              onClick={() => toggleRejected(i)}
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition ${
                                isRejected
                                  ? 'border-border bg-transparent text-muted-foreground'
                                  : 'border-foreground bg-foreground text-background'
                              }`}
                              title={isRejected ? 'Aprobar este corte' : 'Rechazar este corte'}
                            >
                              {isRejected ? (
                                <X className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                            <span className="w-24 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                              {cut.start.toFixed(2)}–{cut.end.toFixed(2)}
                            </span>
                            <span className="flex-1 text-xs text-foreground">
                              {cut.reason}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {(cut.end - cut.start).toFixed(1)}s
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Cortes manuales */}
                <div>
                  <h4 className="mb-2 text-xs font-medium text-foreground">
                    Cortes manuales ({manualCuts.length})
                  </h4>
                  {manualCuts.length > 0 && (
                    <div className="mb-3 flex flex-col rounded-lg border border-border">
                      {manualCuts.map((cut, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-b-0"
                        >
                          <span className="w-24 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                            {cut.start.toFixed(2)}–{cut.end.toFixed(2)}
                          </span>
                          <span className="flex-1 text-xs text-foreground">
                            {cut.reason}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {(cut.end - cut.start).toFixed(1)}s
                          </span>
                          <button
                            onClick={() => removeManualCut(i)}
                            className="rounded p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Form añadir manual */}
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-card/50 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Añadir corte manual (timestamps en segundos del video original)
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Start"
                        value={draft.start}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, start: e.target.value }))
                        }
                        className="h-8 w-20 text-xs"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="End"
                        value={draft.end}
                        onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
                        className="h-8 w-20 text-xs"
                      />
                      <Input
                        placeholder="Razón (opcional)"
                        value={draft.reason}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, reason: e.target.value }))
                        }
                        className="h-8 flex-1 text-xs"
                      />
                      <Button
                        onClick={addManualCut}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Añadir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* FOOTER */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card/50 px-6 py-3">
          <div className="flex flex-col text-xs text-muted-foreground">
            <span>
              {words.length} palabras · {(approvedLlmCount + manualCuts.length)} cortes activos
            </span>
            {totalDuration > 0 && (
              <span className="text-[10px]">
                Duración fuente: {totalDuration.toFixed(1)}s
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
              className="text-xs"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleRerender}
              disabled={isProcessing}
              size="sm"
              className="gap-1.5 text-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Guardando…
                </>
              ) : rendering ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Renderizando…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Renderizar con mis cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
