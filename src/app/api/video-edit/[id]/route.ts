import { NextRequest } from 'next/server'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteFile } from '@/features/video-edit/services/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ci_video_edits')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 })
  if (!data) return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
  return Response.json({ ok: true, edit: data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  const { id } = await params
  const supabase = createAdminClient()

  // Cargar para conocer paths y borrarlos del bucket
  const { data: row } = await supabase
    .from('ci_video_edits')
    .select('source_path, edited_path')
    .eq('id', id)
    .maybeSingle()

  if (row?.source_path) await deleteFile(row.source_path)
  if (row?.edited_path) await deleteFile(row.edited_path)

  const { error } = await supabase.from('ci_video_edits').delete().eq('id', id)
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
