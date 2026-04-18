'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { syncPlatform } from './services/orchestrator'
import type { Platform } from './types'
import { platformList } from './adapters'

function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && (platformList as string[]).includes(value)
}

export async function saveConnection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const platform = formData.get('platform')
  if (!isPlatform(platform)) {
    return { error: 'Invalid platform' }
  }

  const credentials: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('cred_') && typeof value === 'string') {
      credentials[key.replace('cred_', '')] = value
    }
  }

  const { error } = await supabase
    .from('api_connections')
    .upsert(
      {
        user_id: user.id,
        platform,
        credentials,
        status: 'connected',
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'platform' }
    )

  if (error) {
    return { error: error.message }
  }

  // Primer sync inmediato tras conectar
  await syncPlatform(platform)

  revalidatePath('/integrations')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function disconnectPlatform(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const platform = formData.get('platform')
  if (!isPlatform(platform)) {
    return { error: 'Invalid platform' }
  }

  const { error } = await supabase
    .from('api_connections')
    .update({
      status: 'disconnected',
      credentials: null,
      updated_at: new Date().toISOString(),
    })
    .eq('platform', platform)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/integrations')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function syncNow(formData: FormData) {
  const platform = formData.get('platform')
  if (!isPlatform(platform)) {
    return { error: 'Invalid platform' }
  }

  const result = await syncPlatform(platform)

  revalidatePath('/integrations')
  revalidatePath('/dashboard')

  if (result.error) {
    return { error: result.error }
  }
  return { success: true, count: result.metrics.length }
}
