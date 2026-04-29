import { NextRequest } from 'next/server'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ci_video_edits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, edits: data ?? [] })
}
