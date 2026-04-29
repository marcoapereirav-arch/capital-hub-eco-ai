import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/video-edit/presets
 * Lista las variantes/presets disponibles para que el UI pueble el selector.
 */
export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ci_video_presets')
    .select('slug, display_name, description, expected_inputs, recommended_piece_types, enabled, implementation_status')
    .eq('enabled', true)
    .order('display_name')

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, presets: data ?? [] })
}
