import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface AdminSession {
  userId: string
  email: string | null
  internal?: boolean
}

export interface AdminError {
  status: 401 | 403
  body: { ok: false; error: string }
}

/**
 * Verifica que el caller está autenticado y su rol es admin.
 * Usa el server client de Supabase (cookies) — respeta RLS.
 *
 * Bypass interno: si viene el header `x-internal-key` con valor igual a
 * process.env.INTERNAL_TRIGGER_KEY, se acepta como admin.
 * Uso: scripts orquestadores locales (cron, auto-continue, etc.).
 */
export async function requireAdmin(): Promise<
  { session: AdminSession } | { error: AdminError }
> {
  // 1) Bypass por header interno (server-to-server, scripts de dev)
  try {
    const h = await headers()
    const internalKey = h.get('x-internal-key')
    const expected = process.env.INTERNAL_TRIGGER_KEY
    if (expected && internalKey && internalKey === expected) {
      return {
        session: {
          userId: 'internal',
          email: null,
          internal: true,
        },
      }
    }
  } catch {
    // headers() puede fallar en contextos no-request; seguimos con auth normal
  }

  // 2) Auth normal por cookies + role=admin
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: { status: 401, body: { ok: false, error: 'unauthenticated' } } }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { error: { status: 403, body: { ok: false, error: 'profile_lookup_failed' } } }
  }

  if (profile?.role !== 'admin') {
    return { error: { status: 403, body: { ok: false, error: 'forbidden' } } }
  }

  return {
    session: {
      userId: user.id,
      email: user.email ?? null,
    },
  }
}
