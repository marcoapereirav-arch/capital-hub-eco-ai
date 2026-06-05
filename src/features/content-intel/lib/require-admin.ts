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
 *
 * Para endpoints que dependen del user_id (queries por owner), el caller
 * interno puede pasar también `x-internal-user-id` con el UUID del usuario
 * a impersonar. Si no se pasa, intentamos resolver el admin owner por email
 * canónico (ADMIN_USER_EMAIL en env, fallback al primer admin).
 *
 * Uso: scripts orquestadores locales (cron, sync diario, etc.).
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
      const explicitUserId = h.get('x-internal-user-id')

      // Si el caller pasó un user_id válido, lo usamos directamente
      if (
        explicitUserId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          explicitUserId,
        )
      ) {
        return {
          session: {
            userId: explicitUserId,
            email: null,
            internal: true,
          },
        }
      }

      // Fallback: resolver el admin owner desde BD
      const supabase = await createClient()
      const adminEmail = process.env.ADMIN_USER_EMAIL
      if (adminEmail) {
        const { data: adminUser } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('email', adminEmail)
          .maybeSingle()
        if (adminUser?.id) {
          return {
            session: {
              userId: adminUser.id as string,
              email: adminEmail,
              internal: true,
            },
          }
        }
      }
      // Último recurso: primer admin que encuentre
      const { data: firstAdmin } = await supabase
        .from('profiles')
        .select('id, email')
        .in('role', ['super_admin', 'admin'])
        .limit(1)
        .maybeSingle()
      if (firstAdmin?.id) {
        return {
          session: {
            userId: firstAdmin.id as string,
            email: (firstAdmin.email as string | null) ?? null,
            internal: true,
          },
        }
      }
    }
  } catch {
    // headers() puede fallar en contextos no-request; seguimos con auth normal
  }

  // 2) Auth normal por cookies + role=admin (acepta 'super_admin' nuevo y 'admin' legacy)
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

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { error: { status: 403, body: { ok: false, error: 'forbidden' } } }
  }

  return {
    session: {
      userId: user.id,
      email: user.email ?? null,
    },
  }
}
