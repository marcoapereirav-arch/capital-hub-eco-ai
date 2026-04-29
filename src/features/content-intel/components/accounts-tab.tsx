'use client'

import { useState, type FormEvent } from 'react'
import {
  Plus,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCcwDot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccounts } from '../hooks/use-accounts'
import { formatHandle } from '../lib/normalize-handle'
import { ACCOUNT_ROLE_LABELS, type SeedAccountRow, type SyncStatus } from '../types/account'
import type { Platform } from '../types/platform'
import { IMPLEMENTED_PLATFORMS } from '../types/platform'

function StatusBadge({ status }: { status: SyncStatus }) {
  const config = {
    idle: { label: 'IDLE', className: 'border-muted-foreground/30 text-muted-foreground' },
    running: { label: 'SYNC…', className: 'border-foreground/60 text-foreground animate-pulse' },
    ok: { label: 'OK', className: 'border-foreground text-foreground' },
    error: { label: 'ERROR', className: 'border-destructive/60 text-destructive' },
  }[status]
  return (
    <Badge variant="outline" className={`font-mono text-[9px] px-1.5 py-0 ${config.className}`}>
      {config.label}
    </Badge>
  )
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'hace unos segundos'
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)} min`
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)} h`
  return `hace ${Math.floor(diff / 86_400_000)} d`
}

export function AccountsTab() {
  const {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    syncAccount,
    syncAll,
  } = useAccounts()

  const [showAdd, setShowAdd] = useState(false)
  const [newHandle, setNewHandle] = useState('')
  const [newPlatform, setNewPlatform] = useState<Platform>('instagram')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)

  const activeAccounts = accounts.filter((a) => a.is_active)
  const pendingSyncCount = activeAccounts.filter(
    (a) => a.sync_status === 'idle' || a.sync_status === 'error',
  ).length
  const totalActiveCount = activeAccounts.length

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!newHandle.trim()) return
    setCreating(true)
    setFormError(null)
    try {
      await createAccount({ platform: newPlatform, handle: newHandle.trim() })
      setNewHandle('')
      setShowAdd(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCreating(false)
    }
  }

  const handleSync = async (account: SeedAccountRow) => {
    try {
      await syncAccount(account.id)
    } catch (err) {
      console.error('[content-intel] sync failed', err)
    }
  }

  const togglePause = async (account: SeedAccountRow) => {
    await updateAccount(account.id, { is_active: !account.is_active })
  }

  const handleDelete = async (account: SeedAccountRow) => {
    const ok = window.confirm(`¿Eliminar @${account.handle}? Esto borra también los videos guardados.`)
    if (!ok) return
    await deleteAccount(account.id)
  }

  const handleSyncAll = async () => {
    const target = pendingSyncCount > 0 ? pendingSyncCount : totalActiveCount
    if (target === 0) return
    const confirmed = window.confirm(
      `Sincronizar ${target} cuenta(s) en batch. Tarda ~1-2 min por cuenta. ¿Continuar?`,
    )
    if (!confirmed) return
    setSyncingAll(true)
    try {
      const summary = await syncAll()
      const failureDetail = summary.failures.length > 0
        ? `\n\nFallos:\n${summary.failures.map((f) => `@${f.handle}: ${f.error ?? 'unknown'}`).join('\n')}`
        : ''
      alert(
        `Sync completado · ${summary.ok} OK, ${summary.errors} errores (${summary.total} total).${failureDetail}`,
      )
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      setSyncingAll(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-2xl font-medium tracking-tight text-foreground">
            Cuentas semilla
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pool de cuentas que el sistema analiza. Sincroniza al empezar cada sesión para tener métricas frescas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totalActiveCount > 0 && (
            <Button
              size="default"
              variant="outline"
              onClick={handleSyncAll}
              disabled={syncingAll}
              title={
                pendingSyncCount > 0
                  ? `Sincronizar ${pendingSyncCount} cuentas pendientes`
                  : `Resincronizar las ${totalActiveCount} cuentas activas`
              }
            >
              {syncingAll ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcwDot className="mr-1.5 h-4 w-4" />
              )}
              Sync todas
              <span className="ml-1.5 text-muted-foreground">
                ({pendingSyncCount > 0 ? pendingSyncCount : totalActiveCount})
              </span>
            </Button>
          )}
          <Button
            size="default"
            variant={showAdd ? 'secondary' : 'default'}
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {showAdd ? 'Cancelar' : 'Añadir cuenta'}
          </Button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-md border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1 sm:w-40">
              <label className="text-xs text-muted-foreground">Plataforma</label>
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as Platform)}
              >
                {IMPLEMENTED_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-muted-foreground">Handle</label>
              <Input
                placeholder="@usuario o url completa"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Crear'}
            </Button>
          </div>
          {formError && (
            <p className="mt-2 font-mono text-[11px] text-destructive">{formError}</p>
          )}
        </form>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-md border border-border bg-card">
        {loading ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Sin cuentas todavía. Añade la primera arriba.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/20"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {formatHandle(account.handle, account.platform)}
                    </span>
                    <StatusBadge status={account.sync_status} />
                    <Badge
                      variant="outline"
                      className={`font-mono text-[9px] px-1.5 py-0 ${
                        account.role === 'own'
                          ? 'border-foreground text-foreground'
                          : account.role === 'style'
                            ? 'border-muted-foreground/60 text-muted-foreground'
                            : 'border-muted-foreground/30 text-muted-foreground'
                      }`}
                      title={
                        account.role === 'niche'
                          ? 'Competencia directa'
                          : account.role === 'style'
                            ? 'Referencia de tono/formato'
                            : 'Cuenta propia'
                      }
                    >
                      {ACCOUNT_ROLE_LABELS[account.role].toUpperCase()}
                    </Badge>
                    {!account.is_active && (
                      <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
                        PAUSADA
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                    <span>{account.platform.toUpperCase()}</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>{account.video_count} videos</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>last sync: {formatRelativeTime(account.last_synced_at)}</span>
                  </div>
                  {account.sync_error && (
                    <p className="mt-1 font-mono text-[10px] text-destructive line-clamp-1">
                      {account.sync_error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={account.sync_status === 'running' || !account.is_active}
                    onClick={() => handleSync(account)}
                    title="Sincronizar metadata"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${account.sync_status === 'running' ? 'animate-spin' : ''}`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePause(account)}
                    title={account.is_active ? 'Pausar' : 'Activar'}
                  >
                    {account.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(account)}
                    title="Eliminar"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
