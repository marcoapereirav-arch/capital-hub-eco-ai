export type WebType = "funnel" | "lead_magnet" | "presentation" | "other"
export type WebStatus = "draft" | "published" | "archived"
/**
 * Subdominio publico donde se sirve la web.
 *   ch = ch.capitalhubapp.com (publico, para funnels/lead magnets)
 *   os = os.capitalhubapp.com (interno; visible solo bajo el OS)
 * Default en BD: 'ch'.
 */
export type WebHostname = "ch" | "os"

export type Web = {
  id: string
  type: WebType
  slug: string
  name: string
  description: string
  status: WebStatus
  hostname: WebHostname
  /**
   * Interruptor de medición Meta (píxel + API) de este funnel.
   * Independiente de `status`: publicado NO obliga a medir (el acceso al OS está
   * publicado y no debe mandar nada). Los funnels nuevos nacen apagados.
   * Ver SOP marketing/09-eventos-meta-catalogo.
   */
  trackingEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type WebStep = {
  id: string
  webId: string
  slug: string
  name: string
  position: number
  isEntry: boolean
  description: string
}

export type WebWithSteps = Web & {
  steps: WebStep[]
}
