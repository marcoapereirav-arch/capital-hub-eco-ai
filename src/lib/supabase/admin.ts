import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client con service_role_key. Bypasa RLS.
 * Solo usarse en server-side (webhooks, cron jobs, actions privilegiadas).
 * NUNCA exponer a cliente.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
  if (!key) throw new Error('SUPABASE_SERVICE_KEY not set')

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
