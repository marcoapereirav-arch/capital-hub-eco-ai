import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Embudo "Del reel a la venta", desglosado POR reel.
 *
 * Modelo (SOP producto/20):
 *  - La ficha entra al pipeline WEBINAR en stage 'dm' cuando la persona COMENTA
 *    el reel (con su Instagram + tag del reel de origen: `reel:<post_id>`).
 *  - Al hacer opt-in, la MISMA ficha pasa a 'lead' y se completa.
 *  - Sigue el pipeline: agendado → alumno (la venta).
 *
 * Cohorte = contactos del pipeline webinar con manychat_subscriber_id (vinieron
 * del reel). El desglose por reel se hace con los tags `reel:*` (sistema propio).
 */
export type ReelFunnelRow = {
  reel: string // nombre del tag del reel (renombrable en el sistema de tags)
  comentaron: number
  leads: number
  agendaron: number
  alumnos: number
  ingresos: number
}

export type WebinarReelFunnel = {
  overall: { comentaron: number; leads: number; agendaron: number; alumnos: number; ingresos: number }
  perReel: ReelFunnelRow[]
  configured: boolean
}

const EMPTY: WebinarReelFunnel = {
  overall: { comentaron: 0, leads: 0, agendaron: 0, alumnos: 0, ingresos: 0 },
  perReel: [],
  configured: false,
}

const AGENDADO_STAGES = new Set(['agendado', 'seguimiento', 'no_show', 'alumno'])

type CohortContact = { id: string; stage: string | null; total_revenue: number | null }

function emptyRow(reel: string): ReelFunnelRow {
  return { reel, comentaron: 0, leads: 0, agendaron: 0, alumnos: 0, ingresos: 0 }
}

function tally(row: { comentaron: number; leads: number; agendaron: number; alumnos: number; ingresos: number }, c: CohortContact) {
  row.comentaron += 1
  if (c.stage !== 'dm') row.leads += 1 // pasó del comentario: hizo opt-in
  if (c.stage && AGENDADO_STAGES.has(c.stage)) row.agendaron += 1
  if (c.stage === 'alumno') {
    row.alumnos += 1
    row.ingresos += Number(c.total_revenue) || 0
  }
}

export async function getWebinarReelFunnel(): Promise<WebinarReelFunnel> {
  const supabase = await createClient()

  const { data: pipeline } = await supabase.from('pipelines').select('id').eq('slug', 'webinar').maybeSingle()
  const pid = pipeline?.id as string | undefined
  if (!pid) return EMPTY

  // 1. Cohorte: contactos del webinar que vinieron del reel (tienen mc_id).
  const { data: cohortData } = await supabase
    .from('contacts')
    .select('id, stage, total_revenue')
    .eq('pipeline_id', pid)
    .not('manychat_subscriber_id', 'is', null)
  const cohort = (cohortData ?? []) as CohortContact[]

  const overall = { comentaron: 0, leads: 0, agendaron: 0, alumnos: 0, ingresos: 0 }
  for (const c of cohort) tally(overall, c)

  // 2. Desglose por reel: tags `reel:*` + qué contactos los tienen.
  const perReel: ReelFunnelRow[] = []
  if (cohort.length > 0) {
    const { data: reelTags } = await supabase.from('tags').select('id, name').ilike('name', 'reel:%')
    const tagNameById = new Map<string, string>((reelTags ?? []).map((t) => [t.id as string, t.name as string]))

    if (tagNameById.size > 0) {
      const contactById = new Map(cohort.map((c) => [c.id, c]))
      const { data: links } = await supabase
        .from('contact_tags')
        .select('contact_id, tag_id')
        .in('contact_id', cohort.map((c) => c.id))
        .in('tag_id', Array.from(tagNameById.keys()))

      const rowsByReel = new Map<string, ReelFunnelRow>()
      for (const link of (links ?? []) as Array<{ contact_id: string; tag_id: string }>) {
        const reelName = tagNameById.get(link.tag_id)
        const c = contactById.get(link.contact_id)
        if (!reelName || !c) continue
        if (!rowsByReel.has(reelName)) rowsByReel.set(reelName, emptyRow(reelName))
        tally(rowsByReel.get(reelName)!, c)
      }
      perReel.push(...Array.from(rowsByReel.values()).sort((a, b) => b.comentaron - a.comentaron))
    }
  }

  return { overall, perReel, configured: true }
}
