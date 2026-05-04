import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ScheduledPost } from '../types'

export async function listScheduled(
  options: { from?: string; to?: string } = {}
): Promise<ScheduledPost[]> {
  const supabase = await createClient()
  let query = supabase
    .from('ig_scheduled_posts')
    .select('*')
    .order('scheduled_for', { ascending: true })

  if (options.from) query = query.gte('scheduled_for', options.from)
  if (options.to) query = query.lte('scheduled_for', options.to)

  const { data } = await query
  return (data ?? []) as ScheduledPost[]
}
