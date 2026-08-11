/**
 * Lo que devuelve /api/admin/affiliates. Un solo sitio para los tipos, que usan las dos
 * pestanas (Dashboard y Configuracion).
 */

export type EstadisticaAfiliado = {
  /** Gente que abrio el link. Se cuenta una vez por navegador, funnel y dia. */
  visitas: number
  /** Personas que dejaron sus datos y quedaron en el CRM. */
  contactos: number
  leads: number
  agendados: number
  /** Sigue vivo pero ya no es nuevo: seguimiento y no show. */
  enJuego: number
  alumnos: number
  perdidos: number
  ingresos: number
  ventas: number
}

export type LinkDeAfiliado = {
  id: string
  funnelSlug: string
  funnelLabel: string
  activo: boolean
  url: string | null
  creadoEl: string
  stats: EstadisticaAfiliado
}

export type CruceFunnel = {
  funnelSlug: string
  funnelLabel: string
  stats: EstadisticaAfiliado
}

export type Afiliado = {
  slug: string
  name: string
  active: boolean
  creadoEl: string
  /** La etiqueta que se le pone al contacto que trae. */
  etiqueta: string
  links: LinkDeAfiliado[]
  stats: EstadisticaAfiliado
  porFunnel: CruceFunnel[]
}

export type FunnelDisponible = {
  slug: string
  label: string
  path: string
  url: string
  publicado: boolean
  midiendo: boolean
}

export type DiaDeLaSerie = {
  fecha: string
  contactos: number
  alumnos: number
  ingresos: number
}

export type RespuestaAfiliados = {
  afiliados: Afiliado[]
  funnels: FunnelDisponible[]
  totales: EstadisticaAfiliado
  serie: DiaDeLaSerie[]
}

export const ESTADISTICA_VACIA: EstadisticaAfiliado = {
  visitas: 0,
  contactos: 0,
  leads: 0,
  agendados: 0,
  enJuego: 0,
  alumnos: 0,
  perdidos: 0,
  ingresos: 0,
  ventas: 0,
}

/** Dinero, siempre igual en toda la seccion. */
export function euros(valor: number): string {
  return `${Math.round(valor).toLocaleString("es-ES")} €`
}
