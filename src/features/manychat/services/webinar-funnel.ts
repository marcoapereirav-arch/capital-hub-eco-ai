import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Embudo "Del reel a la venta".
 *
 * Modelo (importante):
 *  - COMENTARON = interacción en el reel (evento manychat_events 'webinar_comment').
 *    NO son leads todavía: comentar no deja datos.
 *  - LEAD = dejaron sus datos en el opt-in del webinar → contacto en el pipeline
 *    'webinar' con manychat_subscriber_id (vinculado por mc_id desde el DM).
 *  - AGENDADO / ALUMNO = stages reales del pipeline (la venta = 'alumno').
 *
 * Ver SOP producto/20 + marketing/08.
 */
export type WebinarReelFunnel = {
  comentaron: number // interacciones en el reel (aún no son lead)
  leads: number // rellenaron el opt-in (stage Lead o superior)
  agendaron: number // stage Agendado o superior
  alumnos: number // compraron (stage Alumno)
  ingresos: number // facturado por esos alumnos
  configured: boolean
}

const EMPTY: WebinarReelFunnel = {
  comentaron: 0,
  leads: 0,
  agendaron: 0,
  alumnos: 0,
  ingresos: 0,
  configured: false,
}

export async function getWebinarReelFunnel(): Promise<WebinarReelFunnel> {
  const supabase = await createClient()

  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id')
    .eq('slug', 'webinar')
    .maybeSingle()

  const pid = pipeline?.id as string | undefined
  if (!pid) return EMPTY

  // Comentaron: suscriptores únicos con un evento 'webinar_comment'.
  const { data: commentRows } = await supabase
    .from('manychat_events')
    .select('subscriber_id')
    .eq('event_type', 'webinar_comment')
    .limit(5000)
  const comentaron = new Set(
    (commentRows ?? []).map((r) => (r as { subscriber_id: string | null }).subscriber_id).filter(Boolean),
  ).size

  // Cohorte de leads: contactos del pipeline webinar que vinieron de ManyChat
  // (tienen manychat_subscriber_id → se crearon al rellenar el opt-in del DM).
  const base = () =>
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_id', pid)
      .not('manychat_subscriber_id', 'is', null)

  const [leadsRes, agendaronRes, alumnosRes, ingresosRes] = await Promise.all([
    base(),
    base().in('stage', ['agendado', 'seguimiento', 'no_show', 'alumno']),
    base().eq('stage', 'alumno'),
    supabase
      .from('contacts')
      .select('total_revenue')
      .eq('pipeline_id', pid)
      .not('manychat_subscriber_id', 'is', null)
      .eq('stage', 'alumno'),
  ])

  const ingresos = (ingresosRes.data ?? []).reduce(
    (sum, r) => sum + (Number((r as { total_revenue: number | null }).total_revenue) || 0),
    0,
  )

  return {
    comentaron,
    leads: leadsRes.count ?? 0,
    agendaron: agendaronRes.count ?? 0,
    alumnos: alumnosRes.count ?? 0,
    ingresos,
    configured: true,
  }
}
