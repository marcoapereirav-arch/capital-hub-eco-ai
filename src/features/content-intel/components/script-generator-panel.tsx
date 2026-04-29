'use client'

import { useEffect, useMemo, useState } from 'react'
import { Video, Share2, Trash2, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { SCRIPT_STATUS_LABELS } from '../types/script'
import type { ScriptRow, ScriptStatus } from '../types/script'
import { ScriptChatPanel } from './script-chat-panel'

type HistoryFilter = 'pendientes' | 'grabados' | 'publicados' | 'todos'

function classifyScriptFilter(status: ScriptStatus): HistoryFilter | null {
  if (status === 'draft' || status === 'ready') return 'pendientes'
  if (status === 'recorded') return 'grabados'
  if (status === 'published') return 'publicados'
  return null
}

export function ScriptGeneratorPanel() {
  const [script, setScript] = useState<ScriptRow | null>(null)
  const [history, setHistory] = useState<ScriptRow[]>([])
  const [editable, setEditable] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('pendientes')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulking, setBulking] = useState(false)

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/content-intel/scripts', { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) setHistory(json.scripts ?? [])
    } catch {
      // silent
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const handleSaveEdit = async (status?: ScriptStatus) => {
    if (!script) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/content-intel/scripts/${script.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_edited_markdown: editable, status }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setScript(json.script)
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkMark = async (status: ScriptStatus) => {
    if (selectedIds.size === 0) return
    setBulking(true)
    setError(null)
    try {
      const res = await fetch('/api/content-intel/scripts/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_ids: Array.from(selectedIds), status }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setSelectedIds(new Set())
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setBulking(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este guion? No se puede deshacer.')) return
    setError(null)
    try {
      const res = await fetch(`/api/content-intel/scripts/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      if (script?.id === id) setScript(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`¿Eliminar ${selectedIds.size} guion(es)? No se puede deshacer.`)) return
    setBulking(true)
    setError(null)
    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/content-intel/scripts/${id}`, { method: 'DELETE' }).then((r) => r.ok),
        ),
      )
      const failed = results.filter((ok) => !ok).length
      if (failed > 0) throw new Error(`${failed} guion(es) no se pudieron eliminar`)
      if (script && ids.includes(script.id)) setScript(null)
      setSelectedIds(new Set())
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setBulking(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openScript = (s: ScriptRow) => {
    setScript(s)
    setEditable(s.user_edited_markdown ?? s.llm_output_markdown ?? '')
  }

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'todos') return history
    return history.filter((s) => classifyScriptFilter(s.status) === historyFilter)
  }, [history, historyFilter])

  const counts = useMemo(() => {
    const c = { pendientes: 0, grabados: 0, publicados: 0, todos: history.length }
    for (const s of history) {
      const f = classifyScriptFilter(s.status)
      if (f && f !== 'todos') c[f] += 1
    }
    return c
  }, [history])

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* SIDEBAR - lista de drafts */}
      <aside className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <h3 className="font-heading text-2xl font-medium tracking-tight text-foreground">
            Mis guiones
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Almacén de drafts. Genera nuevos desde Studio.
          </p>
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(['pendientes', 'grabados', 'publicados', 'todos'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setHistoryFilter(f)
                setSelectedIds(new Set())
              }}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
                historyFilter === f
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
              <span className="ml-1 opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="default"
                className="flex-1 text-xs"
                onClick={() => handleBulkMark('recorded')}
                disabled={bulking}
              >
                <Video className="mr-1 h-3 w-3" />
                Grabados
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 text-xs"
                onClick={() => handleBulkMark('published')}
                disabled={bulking}
              >
                <Share2 className="mr-1 h-3 w-3" />
                Publicados
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleBulkDelete}
              disabled={bulking}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Eliminar {selectedIds.size}
            </Button>
          </div>
        )}

        <div className="flex flex-col rounded-lg border border-border bg-card">
          {loadingList ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {historyFilter === 'pendientes'
                  ? 'Sin pendientes. Genera tu primer guion desde Studio.'
                  : `Sin ${historyFilter}.`}
              </p>
            </div>
          ) : (
            filteredHistory.slice(0, 50).map((s) => {
              const isSelected = selectedIds.has(s.id)
              const isActive = script?.id === s.id
              const dt = new Date(s.created_at)
              const dateStr = dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
              const timeStr = dt.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <div
                  key={s.id}
                  className={`flex items-start gap-2 border-b border-border p-3 transition-colors last:border-b-0 ${
                    isActive ? 'bg-muted/30' : 'hover:bg-muted/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(s.id)}
                    className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer accent-foreground"
                    aria-label="Seleccionar"
                  />
                  <button
                    onClick={() => openScript(s)}
                    className="flex flex-1 flex-col gap-0.5 text-left"
                  >
                    <span className="line-clamp-1 text-sm text-foreground">{s.brief}</span>
                    <span className="text-xs text-muted-foreground">
                      {dateStr} {timeStr} · {SCRIPT_STATUS_LABELS[s.status as ScriptStatus]} ·{' '}
                      {s.platform}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Eliminar guion"
                    title="Eliminar guion"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* MAIN - editor del guion seleccionado */}
      <main className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!script && !loadingList && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
            <h4 className="font-heading text-lg font-medium text-foreground">
              Selecciona un guion para editarlo
            </h4>
            <p className="max-w-sm text-sm text-muted-foreground">
              Aquí gestionas todos tus drafts. Para crear nuevos, ve a <span className="text-foreground/80">Studio</span> y pídeselo al chat.
            </p>
          </div>
        )}

        {script && (
          <>
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">
                    {script.brief}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {SCRIPT_STATUS_LABELS[script.status as ScriptStatus]}
                    </Badge>
                    <span>{script.platform}</span>
                    <span>·</span>
                    <span>{script.duration_target_s ?? '—'}s</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSaveEdit()}
                    disabled={saving}
                  >
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleSaveEdit('recorded')}
                    disabled={saving}
                  >
                    <Video className="mr-1 h-3.5 w-3.5" />
                    Grabado
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSaveEdit('published')}
                    disabled={saving}
                  >
                    <Share2 className="mr-1 h-3.5 w-3.5" />
                    Publicado
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(script.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </div>
              </div>

              <Textarea
                rows={18}
                className="font-mono text-sm leading-relaxed"
                value={editable}
                onChange={(e) => setEditable(e.target.value)}
              />

              <p className="text-xs text-muted-foreground">
                Tokens: {script.tokens_used ?? '—'} · Coste: $
                {script.cost_usd?.toFixed(4) ?? '0.0000'} · Modelo: {script.model ?? '—'}
              </p>
            </div>

            <ScriptChatPanel
              scriptId={script.id}
              currentScript={editable}
              onScriptUpdate={(newMarkdown) => setEditable(newMarkdown)}
            />
          </>
        )}
      </main>
    </div>
  )
}
