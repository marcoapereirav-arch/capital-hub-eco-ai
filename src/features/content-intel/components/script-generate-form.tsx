'use client'

import { useEffect, useState } from 'react'
import {
  Wand2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Filter,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ScriptRow } from '../types/script'

// Desplegable nativo con los 44 puntos del dedo y los colores del tema: en el
// kit todavia no hay componente Select propio.
const SELECT_CLASS =
  'h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base text-foreground md:h-8 md:text-sm'

interface AccountRow {
  id: string
  handle: string
  role: string | null
  is_own: boolean
  is_active: boolean
  video_count: number | null
}

interface ScriptGenerateFormProps {
  /** Callback cuando se completa una generación exitosa. */
  onGenerated: (script: ScriptRow) => void
}

/**
 * Formulario de generación de guiones.
 *
 * Campos:
 *  - brief (idea del usuario)
 *  - duración objetivo
 *  - panel desplegable "Anclar al corpus": cuentas, min_views, top_n_per_account
 *
 * Cuando se aplican filtros, el endpoint hace una extracción rápida de patrones
 * del corpus filtrado y los inyecta al prompt de generación. El guion final
 * está calibrado a: brief + voz propia + brand + patrones del corpus.
 */
export function ScriptGenerateForm({ onGenerated }: ScriptGenerateFormProps) {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  // Form state
  const [brief, setBrief] = useState('')
  const [durationS, setDurationS] = useState<number>(60)
  const [contentPillar, setContentPillar] = useState('libre')

  // Grounding (filtros del corpus)
  const [groundingOpen, setGroundingOpen] = useState(false)
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set())
  const [minViews, setMinViews] = useState<string>('')
  const [topNPerAccount, setTopNPerAccount] = useState<string>('3')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar cuentas al montar (para el selector multi-select)
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/content-intel/accounts', { cache: 'no-store' })
        const json = await res.json()
        if (json.ok) {
          const list = (json.accounts ?? []) as AccountRow[]
          setAccounts(list.filter((a) => a.is_active))
        }
      } catch {
        // silent
      } finally {
        setLoadingAccounts(false)
      }
    })()
  }, [])

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllByRole = (role: string) => {
    const ids = accounts.filter((a) => a.role === role).map((a) => a.id)
    setSelectedAccountIds((prev) => {
      const next = new Set(prev)
      const allAlready = ids.every((id) => next.has(id))
      if (allAlready) {
        for (const id of ids) next.delete(id)
      } else {
        for (const id of ids) next.add(id)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (brief.trim().length < 3) {
      setError('Escribe al menos una frase con tu idea.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const groundingApplied =
        selectedAccountIds.size > 0 ||
        minViews.trim().length > 0 ||
        topNPerAccount.trim().length > 0

      const corpusFilters = groundingApplied
        ? {
            ...(selectedAccountIds.size > 0 && {
              account_ids: Array.from(selectedAccountIds),
            }),
            ...(minViews.trim().length > 0 && {
              min_views: parseInt(minViews, 10),
            }),
            ...(topNPerAccount.trim().length > 0 && {
              top_n_per_account: parseInt(topNPerAccount, 10),
            }),
            order_by: 'engagement_rate' as const,
          }
        : undefined

      const res = await fetch('/api/content-intel/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: brief.trim(),
          platform: 'instagram',
          duration_target_s: durationS,
          content_pillar: contentPillar,
          corpus_filters: corpusFilters,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      // Reset form
      setBrief('')
      // Notificar al panel padre
      onGenerated(json.script as ScriptRow)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  // Agrupar cuentas por role para el selector
  const accountsByRole = {
    own: accounts.filter((a) => a.is_own || a.role === 'own'),
    style: accounts.filter((a) => a.role === 'style' && !a.is_own),
    niche: accounts.filter((a) => a.role === 'niche' && !a.is_own),
    other: accounts.filter(
      (a) => !a.is_own && a.role !== 'style' && a.role !== 'niche' && a.role !== 'own',
    ),
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-xl font-medium tracking-tight text-foreground">
          Generar guion
        </h3>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Escribe tu idea. Si quieres anclar el guion a lo que funciona en cuentas
          específicas del corpus, abre los filtros.
        </p>
      </div>

      {/* IDEA / BRIEF */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[15px] font-semibold text-muted-foreground">
          Tu idea
        </label>
        <Textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Ej: guion de 60s sobre por qué la gente se queda atrapada en trabajos que odia, con anécdota personal y CTA al lead magnet."
          rows={4}
          className="leading-relaxed"
        />
      </div>

      {/* DURACIÓN + PILAR */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[15px] font-semibold text-muted-foreground">
            Duración (s)
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={10}
            max={600}
            value={durationS}
            onChange={(e) => setDurationS(parseInt(e.target.value, 10) || 60)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[15px] font-semibold text-muted-foreground">
            Pilar de contenido
          </label>
          <select
            value={contentPillar}
            onChange={(e) => setContentPillar(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="libre">Libre</option>
            <option value="mentalidad-disciplina">Mentalidad / disciplina</option>
            <option value="ser-humano-biologia">Ser humano / biología</option>
            <option value="founder-story">Founder story</option>
            <option value="tactico-negocio">Táctico / negocio</option>
          </select>
        </div>
      </div>

      {/* GROUNDING / FILTROS DEL CORPUS */}
      <div className="flex flex-col rounded-lg border border-dashed border-border">
        <button
          onClick={() => setGroundingOpen((v) => !v)}
          aria-expanded={groundingOpen}
          className="flex min-h-11 items-center justify-between gap-2 px-4 py-3 text-left transition active:bg-muted/30 md:hover:bg-muted/30"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-[15px] font-medium text-foreground">
              Anclar al corpus (opcional)
            </span>
            {selectedAccountIds.size > 0 && (
              <Badge variant="outline" className="h-auto py-0.5 text-sm">
                {selectedAccountIds.size} cuenta
                {selectedAccountIds.size !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {groundingOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {groundingOpen && (
          <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
            <p className="text-sm text-muted-foreground">
              Cuando seleccionas cuentas y filtros, la IA extrae los hooks y
              estructuras dominantes de esos videos y los usa como guía para
              escribir tu guion. Tu voz propia (@adrianvillanuevarios) siempre
              entra automáticamente — no hace falta seleccionarla aquí.
            </p>

            {/* Cuentas */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Cuentas de referencia
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => selectAllByRole('style')}
                    className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
                  >
                    todas style
                  </button>
                  <button
                    onClick={() => selectAllByRole('niche')}
                    className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
                  >
                    todas niche
                  </button>
                  <button
                    onClick={() => setSelectedAccountIds(new Set())}
                    className="h-11 rounded-lg border border-border px-3 text-sm text-muted-foreground active:bg-muted/50 md:h-8"
                  >
                    limpiar
                  </button>
                </div>
              </div>
              {loadingAccounts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando cuentas…
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'STYLE', items: accountsByRole.style },
                    { label: 'NICHE', items: accountsByRole.niche },
                    { label: 'OTHER', items: accountsByRole.other },
                  ].map(({ label, items }) =>
                    items.length === 0 ? null : (
                      <div key={label} className="flex w-full flex-col gap-1">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {label}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {items.map((a) => {
                            const selected = selectedAccountIds.has(a.id)
                            return (
                              <button
                                key={a.id}
                                onClick={() => toggleAccount(a.id)}
                                aria-pressed={selected}
                                className={cn(
                                  'h-11 rounded-lg border px-3 text-sm transition-colors md:h-8',
                                  selected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-transparent text-foreground active:bg-muted/50',
                                )}
                              >
                                @{a.handle}
                                <span className="ml-1 tabular-nums">
                                  ({a.video_count ?? 0})
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Filtros numéricos */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Views mínimos (opcional)
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  placeholder="ej: 50000"
                  value={minViews}
                  onChange={(e) => setMinViews(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-semibold text-muted-foreground">
                  Max videos por cuenta
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  value={topNPerAccount}
                  onChange={(e) => setTopNPerAccount(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">{error}</span>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting || brief.trim().length < 3}
        size="lg"
        className="w-full gap-2 md:w-auto md:self-start"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando guion…
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Generar guion
          </>
        )}
      </Button>

      {selectedAccountIds.size > 0 && !submitting && (
        <p className="text-center text-sm text-muted-foreground">
          Tarda ~30-60s extra cuando hay grounding (la IA hace 2 llamadas
          secuenciales: extracción de patrones + generación del guion).
        </p>
      )}
    </div>
  )
}
