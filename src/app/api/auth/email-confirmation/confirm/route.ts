import { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: string }
  const token = (body.token ?? '').trim()
  if (!token) return Response.json({ error: 'Token invalido' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data: row } = await supabase.from('auth_tokens').select('id, user_id, expires_at, used_at').eq('token', token).eq('type', 'email_confirmation').maybeSingle()
  if (!row) return Response.json({ error: 'Token invalido o caducado' }, { status: 400 })
  const r = row as { id: string; user_id: string | null; expires_at: string; used_at: string | null }
  if (r.used_at) return Response.json({ error: 'Este enlace ya fue usado.' }, { status: 400 })
  if (new Date(r.expires_at) < new Date()) return Response.json({ error: 'El enlace ha caducado.' }, { status: 400 })
  if (!r.user_id) return Response.json({ error: 'Usuario no encontrado' }, { status: 400 })

  const { error: updErr } = await supabase.auth.admin.updateUserById(r.user_id, { email_confirm: true })
  if (updErr) return Response.json({ error: updErr.message }, { status: 500 })
  await supabase.from('auth_tokens').update({ used_at: new Date().toISOString() }).eq('id', r.id)
  return Response.json({ ok: true })
}
