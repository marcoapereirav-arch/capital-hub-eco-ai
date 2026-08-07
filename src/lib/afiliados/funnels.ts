import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { FUNNEL_CATALOG } from "@/lib/meta/funnel-catalog"

/**
 * LOS FUNNELS A LOS QUE PUEDE APUNTAR UN LINK DE AFILIADO.
 *
 * Marco (2026-08-07): "el link no puede ir solo a test de personalidad... yo lo quiero
 * crear directamente con cualquier funnel que yo quiera".
 *
 * La lista NO se escribe a mano aqui: sale del catalogo unico de funnels del OS
 * (`FUNNEL_CATALOG`), el mismo que usa la pantalla de Eventos de Ads para saber que
 * deberia estar midiendo cada funnel. Dar de alta un funnel ahi ya es obligatorio para
 * que mida, asi que un funnel nuevo aparece SOLO en Afiliados, sin tocar una linea de
 * esta seccion. Eso es lo que hace que el sistema no se quede viejo.
 */

/**
 * Dominio publico de los funnels. NO es el del OS: los leads no entran por os.*.
 *
 * Los links de afiliado apuntaban a `os.capitalhubapp.com` porque esta ruta usaba
 * `NEXT_PUBLIC_SITE_URL`, que aqui ni siquiera esta definida. Corregido el 2026-08-07.
 */
export function baseDeFunnels(): string {
  return (
    process.env.NEXT_PUBLIC_FUNNEL_BASE_URL ||
    process.env.NEXT_PUBLIC_CH_URL ||
    "https://ch.capitalhubapp.com"
  )
}

export type FunnelParaLink = {
  slug: string
  label: string
  path: string
  /** Direccion completa sin el afiliado, para verla en pantalla. */
  url: string
  /** Publicado de verdad, segun la tabla `webs`. Un borrador se puede enlazar igual. */
  publicado: boolean
  /** Si esta mandando eventos a Meta. Informativo. */
  midiendo: boolean
}

/**
 * El link de un afiliado hacia un funnel. Una sola forma de construirlo, en todo el OS.
 *
 * `extra` es para los sitios que necesitan colgar algo mas del link (por ejemplo el
 * `mc_id` de ManyChat, que sirve para enganchar el opt-in con la persona que comento).
 */
export function construirLinkDeAfiliado(
  funnelPath: string,
  affiliateSlug: string,
  extra?: Record<string, string>,
): string {
  const url = new URL(funnelPath, baseDeFunnels())
  url.searchParams.set("utm_source", affiliateSlug)
  for (const [clave, valor] of Object.entries(extra ?? {})) {
    if (valor) url.searchParams.set(clave, valor)
  }
  return url.toString()
}

/**
 * Los funnels disponibles, con el estado real que tienen en la tabla `webs`.
 * Si la consulta a `webs` falla, se devuelve el catalogo igual: poder crear un link no
 * puede depender de que una consulta informativa responda.
 */
export async function funnelsParaLinks(admin: SupabaseClient): Promise<FunnelParaLink[]> {
  const { data: webs } = await admin.from("webs").select("slug, status, tracking_enabled")

  const porSlug = new Map(
    (webs ?? []).map((w) => [
      w.slug as string,
      { status: w.status as string, tracking: w.tracking_enabled === true },
    ]),
  )

  return FUNNEL_CATALOG.map((f) => {
    const web = porSlug.get(f.slug)
    return {
      slug: f.slug,
      label: f.label,
      path: f.path,
      url: new URL(f.path, baseDeFunnels()).toString(),
      publicado: web?.status === "published",
      midiendo: web?.tracking ?? false,
    }
  })
}
