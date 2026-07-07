import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Embudo "Del reel a la venta": mide la cohorte que entró por ManyChat
 * (comentario del reel → DM) dentro del pipeline Webinar, paso a paso hasta
 * la venta (stage 'alumno').
 *
 * Cohorte = contactos del pipeline 'webinar' con manychat_subscriber_id (todos
 * los que tocaron ManyChat: el router lo pone en el comentario y el opt-in lo
 * vincula vía mc_id). Ver SOP producto/20 + marketing/08.
 */
export type WebinarReelFunnel = {
  comentaron: number // entraron por el reel (ManyChat)
  reservaron: number // rellenaron el formulario del webinar (tienen email)
  agendaron: number // reservaron llamada (agendado/seguimiento/no_show/alumno)
  alumnos: number // compraron (venta)
  ingresos: number // total facturado por esos alumnos
  configured: boolean // si el pipeline webinar existe
}

const EMPTY: WebinarReelFunnel = {
  comentaron: 0,
  reservaron: 0,
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

  // Cohorte base: pipeline webinar + vino de ManyChat.
  const base = () =>
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_id', pid)
      .not('manychat_subscriber_id', 'is', null)

  const [comentaronRes, reservaronRes, agendaronRes, alumnosRes, ingresosRes] = await Promise.all([
    base(),
    base().not('email', 'is', null),
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
    comentaron: comentaronRes.count ?? 0,
    reservaron: reservaronRes.count ?? 0,
    agendaron: agendaronRes.count ?? 0,
    alumnos: alumnosRes.count ?? 0,
    ingresos,
    configured: true,
  }
}
