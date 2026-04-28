import { NextRequest } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/features/content-intel/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { rawPath, VIDEO_EDIT_BUCKET } from '@/features/video-edit/services/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Schema = z.object({
  filename: z.string().min(1).max(255),
  size_bytes: z.number().min(1).max(5_368_709_120), // 5 GB (cubre raw 4K hasta ~90s)
  content_type: z.string().optional(),
  preset_slug: z.string().min(1).max(64).optional(),
  headline_text: z.string().max(200).nullable().optional(),
  funnel_stage: z.enum(['tofu', 'mofu', 'bofu']).nullable().optional(),
  cta_type: z.enum(['follow', 'freebie', 'paid_offer']).nullable().optional(),
  cta_word: z.string().max(40).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return Response.json(auth.error.body, { status: auth.error.status })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: 'invalid_input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const editId = randomUUID()
    const path = rawPath(editId)

    // Crear registro en BD con estado 'uploading'
    const supabase = createAdminClient()
    const { error: insertErr } = await supabase.from('ci_video_edits').insert({
      id: editId,
      user_id: auth.session.userId,
      source_path: path,
      source_filename: parsed.data.filename,
      size_bytes: parsed.data.size_bytes,
      status: 'uploading',
      preset_slug: parsed.data.preset_slug ?? 'vertical-clean',
      headline_text: parsed.data.headline_text ?? null,
      funnel_stage: parsed.data.funnel_stage ?? null,
      cta_type: parsed.data.cta_type ?? null,
      cta_word: parsed.data.cta_word ?? null,
    })
    if (insertErr) throw new Error(`insert failed: ${insertErr.message}`)

    // Devolvemos los datos que necesita el cliente TUS (resumable upload).
    // El navegador autentica directo contra Supabase Storage usando su JWT
    // de sesion (RLS sobre storage.objects permite escribir a admins).
    return Response.json({
      ok: true,
      edit_id: editId,
      bucket: VIDEO_EDIT_BUCKET,
      path,
      tus_endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
    })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
