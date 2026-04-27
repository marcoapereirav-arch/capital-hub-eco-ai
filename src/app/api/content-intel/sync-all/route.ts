import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { syncAccount } from '@/features/content-intel/services/sync-pipeline'
import { toErrorMessage } from '@/features/content-intel/lib/errors'
import type { SeedAccountRow } from '@/features/content-intel/types/account'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Tope amplio para permitir 20+ cuentas en paralelo limitado.
export const maxDuration = 800

const PARALLELISM = 4 // 4 cuentas a la vez para no saturar Apify

async function runLimited<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<unknown>,
): Promise<Array<{ item: T; ok: boolean; error?: string }>> {
  const results: Array<{ item: T; ok: boolean; error?: string }> = []
  let index = 0

  async function consume() {
    while (index < items.length) {
      const i = index++
      const item = items[i]
      try {
        await worker(item)
        results.push({ item, ok: true })
      } catch (err) {
        results.push({ item, ok: false, error: toErrorMessage(err) })
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => consume())
  await Promise.all(workers)
  return results
}

export async function POST() {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  try {
    const supabase = createAdminClient()
    // Resincroniza TODAS las cuentas activas (refresca métricas) excepto las
    // que ya están en curso ('running') para evitar carreras.
    const { data, error } = await supabase
      .from('ci_seed_accounts')
      .select('*')
      .eq('is_active', true)
      .neq('sync_status', 'running')

    if (error) throw new Error(error.message)

    const accounts = (data ?? []) as SeedAccountRow[]
    if (accounts.length === 0) {
      return Response.json({
        ok: true,
        message: 'No hay cuentas activas para sincronizar',
        results: [],
        summary: { total: 0, ok: 0, errors: 0, failures: [] },
      })
    }

    const results = await runLimited(accounts, PARALLELISM, async (a) => {
      return syncAccount(a.id)
    })

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.ok).length,
      errors: results.filter((r) => !r.ok).length,
      failures: results
        .filter((r) => !r.ok)
        .map((r) => ({ handle: r.item.handle, error: r.error })),
    }

    return Response.json({ ok: true, summary })
  } catch (err) {
    return Response.json({ ok: false, error: toErrorMessage(err) }, { status: 500 })
  }
}
