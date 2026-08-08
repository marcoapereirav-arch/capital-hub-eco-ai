import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { FUNNEL_CATALOG } from "@/lib/meta/funnel-catalog"
import {
  COLOR_ETIQUETA_FUENTE,
  COLOR_ETIQUETA_ORIGEN,
} from "@/features/tags/constants/colores-de-etiqueta"

/**
 * LA PIEZA UNICA DE ATRIBUCION.
 *
 * De donde vino un contacto y quien lo trajo se decide AQUI, en un solo sitio, y todos
 * los funnels la usan.
 *
 * POR QUE EXISTE (2026-08-07)
 * Estaba copiada dentro de cada opt-in, y solo dos de los cinco funnels la tenian: Test
 * de Personalidad y Clase en directo. Un lead que entraba por Reserva de sesion con el
 * link de Paolo se guardaba SIN fuente, en silencio, y ese lead no aparecia en ningun
 * numero de Afiliados. El candado `npm run check:afiliados` obliga a que cualquier
 * funnel nuevo pase por aqui.
 *
 * LAS DOS REGLAS QUE NO CAMBIAN
 * 1. First touch: la primera fuente que trajo al contacto manda. Si vuelve por otro link,
 *    la fuente original NO se pisa.
 * 2. La etiqueta acompana al dato: si el contacto tiene fuente, tiene su etiqueta
 *    `fuente:<afiliado>`, y si vino por un funnel, tiene su `origen:<funnel>`.
 */

// El color de una etiqueta es un dato que se guarda en su fila, no diseno de pantalla.
// Vive con los demas datos de etiquetas.
const COLOR_ORIGEN = COLOR_ETIQUETA_ORIGEN
const COLOR_FUENTE = COLOR_ETIQUETA_FUENTE

export type DatosAtribucion = {
  /** utm_source del link: el identificador del afiliado o canal. Ya normalizado. */
  source: string | null
  /** Slug del funnel del catalogo (webinar, test-personalidad, reservar...). */
  funnelSlug: string
}

/** Normaliza un utm_source a un identificador seguro y comparable. */
export function normalizarFuente(valor?: string | null): string | null {
  if (!valor) return null
  const limpio = valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 50)
  return limpio || null
}

/** El funnel tiene que existir en el catalogo unico. Si no, no es un funnel. */
export function esFunnelConocido(slug: string): boolean {
  return FUNNEL_CATALOG.some((f) => f.slug === slug)
}

/**
 * Crea la etiqueta si no existe y devuelve su id.
 * Tolera la carrera de dos leads a la vez (23505): reintenta la lectura.
 */
export async function asegurarEtiqueta(
  admin: SupabaseClient,
  name: string,
  color: string,
  description: string,
): Promise<string | null> {
  const { data: existente } = await admin.from("tags").select("id").eq("name", name).maybeSingle()
  if (existente?.id) return existente.id as string

  const { data: creada, error } = await admin
    .from("tags")
    .insert({ name, color, description })
    .select("id")
    .single()
  if (creada?.id) return creada.id as string

  if ((error as { code?: string } | null)?.code === "23505") {
    const { data: otraVez } = await admin.from("tags").select("id").eq("name", name).maybeSingle()
    return (otraVez?.id as string) ?? null
  }
  return null
}

/** La etiqueta de quien trajo al lead. Se crea tambien al crear el afiliado. */
export async function asegurarEtiquetaDeFuente(
  admin: SupabaseClient,
  slug: string,
  nombreAfiliado?: string,
): Promise<string | null> {
  return asegurarEtiqueta(
    admin,
    `fuente:${slug}`,
    COLOR_FUENTE,
    `Lead traido por ${nombreAfiliado ?? slug}`,
  )
}

/**
 * Campos de atribucion para un contacto NUEVO.
 * `origin` se mantiene por compatibilidad con lo que ya habia guardado.
 */
export function camposAtribucionNuevo({ source, funnelSlug }: DatosAtribucion): {
  affiliate_slug: string | null
  funnel_slug: string
  source: string
} {
  return {
    affiliate_slug: source,
    funnel_slug: funnelSlug,
    source: source ?? `landing_${funnelSlug.replace(/-/g, "_")}`,
  }
}

/**
 * Campos de atribucion para un contacto QUE YA EXISTE.
 * First touch: solo se rellena lo que estaba vacio. Nunca se pisa la fuente original.
 */
export function camposAtribucionExistente(
  existente: { affiliate_slug?: string | null; funnel_slug?: string | null },
  { source, funnelSlug }: DatosAtribucion,
): Record<string, unknown> {
  const cambios: Record<string, unknown> = {}
  if (!existente.affiliate_slug && source) cambios.affiliate_slug = source
  if (!existente.funnel_slug) cambios.funnel_slug = funnelSlug
  return cambios
}

/**
 * Pone las etiquetas de origen y de fuente en el contacto.
 * Ignora el duplicado (23505): que ya la tuviera no es un fallo.
 */
export async function etiquetarAtribucion(
  admin: SupabaseClient,
  contactId: string,
  { source, funnelSlug }: DatosAtribucion,
): Promise<void> {
  const funnel = FUNNEL_CATALOG.find((f) => f.slug === funnelSlug)
  const nombreOrigen = `origen:${funnelSlug.replace(/-/g, "_")}`

  const ids = await Promise.all([
    asegurarEtiqueta(
      admin,
      nombreOrigen,
      COLOR_ORIGEN,
      `Lead que entro por ${funnel?.label ?? funnelSlug}`,
    ),
    source ? asegurarEtiquetaDeFuente(admin, source) : Promise.resolve(null),
  ])

  const filas = ids
    .filter((id): id is string => !!id)
    .map((tag_id) => ({ contact_id: contactId, tag_id }))
  if (filas.length) await admin.from("contact_tags").insert(filas)
}

/**
 * Registra la visita de un link de afiliado.
 *
 * Un lead solo existe si la persona rellena un formulario. La visita se registra siempre,
 * aunque el funnel no capture nada. Es lo que permite ver "este link se uso 40 veces y no
 * trajo ni un lead" en vez de no saber nada.
 *
 * No falla nunca hacia fuera: perder una visita no puede tumbar una landing.
 */
export async function registrarVisita(
  admin: SupabaseClient,
  datos: { source: string; funnelSlug: string | null; path: string | null; visitorKey: string | null },
): Promise<void> {
  try {
    await admin.from("affiliate_visits").insert({
      affiliate_slug: datos.source,
      funnel_slug: datos.funnelSlug,
      path: datos.path,
      visitor_key: datos.visitorKey,
    })
  } catch {
    /* una visita perdida no rompe nada */
  }
}
