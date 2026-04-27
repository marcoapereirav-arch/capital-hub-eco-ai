'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SeedAccountRow } from '../types/account'
import type { Platform } from '../types/platform'

interface UseAccountsResult {
  accounts: SeedAccountRow[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createAccount: (input: { platform: Platform; handle: string; display_name?: string; notes?: string }) => Promise<SeedAccountRow>
  updateAccount: (id: string, patch: { display_name?: string | null; notes?: string | null; is_active?: boolean }) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  syncAccount: (id: string) => Promise<{ inserted: number; updated: number; total_in_db: number }>
  syncAll: () => Promise<{ total: number; ok: number; errors: number; failures: { handle: string; error?: string }[] }>
}

export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<SeedAccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/content-intel/accounts', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setAccounts(json.accounts as SeedAccountRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createAccount = useCallback<UseAccountsResult['createAccount']>(async (input) => {
    const res = await fetch('/api/content-intel/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json = await res.json()
    if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
    await refresh()
    return json.account as SeedAccountRow
  }, [refresh])

  const updateAccount = useCallback<UseAccountsResult['updateAccount']>(async (id, patch) => {
    const res = await fetch(`/api/content-intel/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const json = await res.json()
    if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
    await refresh()
  }, [refresh])

  const deleteAccount = useCallback<UseAccountsResult['deleteAccount']>(async (id) => {
    const res = await fetch(`/api/content-intel/accounts/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
    await refresh()
  }, [refresh])

  const syncAccount = useCallback<UseAccountsResult['syncAccount']>(async (id) => {
    // Marcar running localmente (optimistic) para feedback inmediato.
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, sync_status: 'running' } : a)),
    )
    const res = await fetch('/api/content-intel/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: id }),
    })
    const json = await res.json()
    await refresh()
    if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
    return json.result
  }, [refresh])

  const syncAll = useCallback<UseAccountsResult['syncAll']>(async () => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.is_active && (a.sync_status === 'idle' || a.sync_status === 'error')
          ? { ...a, sync_status: 'running' }
          : a,
      ),
    )
    const res = await fetch('/api/content-intel/sync-all', { method: 'POST' })
    const json = await res.json()
    await refresh()
    if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
    return json.summary ?? { total: 0, ok: 0, errors: 0, failures: [] }
  }, [refresh])

  return { accounts, loading, error, refresh, createAccount, updateAccount, deleteAccount, syncAccount, syncAll }
}
