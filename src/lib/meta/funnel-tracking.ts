import "server-only"
import { createClient } from "@supabase/supabase-js"
import { FUNNEL_CATALOG } from "./funnel-catalog"

/**
 * Interruptor de medición por funnel.
 *
 * Publicar y medir son cosas distintas: "Acceso al OS" está publicado y NO debe mandar
 * nada a Meta. Cada funnel lleva su propio interruptor (`webs.tracking_enabled`), y los
 * nuevos nacen apagados. Ver SOP marketing/09-eventos-meta-catalogo.
 */

/**
 * Saca el funnel de la URL desde la que se disparó el evento.
 * Devuelve null si la página no pertenece a ningún funnel del catálogo.
 *
 * Se ordena de ruta más larga a más corta para que un prefijo corto no se coma a otro
 * más específico si algún día se solapan.
 */
export function funnelFromUrl(url?: string | null): string | null {
  if (!url) return null
  let path: string
  try {
    path = new URL(url).pathname
  } catch {
    return null
  }
  const hit = [...FUNNEL_CATALOG]
    .sort((a, b) => b.path.length - a.path.length)
    .find((f) => path === f.path || path.startsWith(`${f.path}/`))
  return hit?.slug ?? null
}

type Cache = { at: number; map: Map<string, boolean> }
let _cache: Cache | null = null
const TTL_MS = 30_000

/**
 * ¿Está encendida la medición de este funnel?
 *
 * Un funnel que NO reconocemos (una página que no es de ningún funnel) devuelve `true`:
 * no hay interruptor que respetar, así que no se bloquea nada.
 *
 * Si la consulta falla, devuelve `true` a propósito. Misma decisión que en
 * `getCapiMode()`: ante una caída de la base, perder conversiones reales es peor que
 * mandar alguna de más. El motivo queda registrado en el log del evento.
 */
export async function isFunnelTrackingEnabled(
  slug: string | null
): Promise<{ enabled: boolean; reason?: string }> {
  if (!slug) return { enabled: true }

  try {
    if (!_cache || Date.now() - _cache.at > TTL_MS) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data, error } = await supabase.from("webs").select("slug, tracking_enabled")
      if (error) throw error
      _cache = {
        at: Date.now(),
        map: new Map((data ?? []).map((r) => [r.slug as string, Boolean(r.tracking_enabled)])),
      }
    }

    if (!_cache.map.has(slug)) return { enabled: true }
    const enabled = _cache.map.get(slug) === true
    return enabled ? { enabled: true } : { enabled: false, reason: `medición apagada en "${slug}"` }
  } catch {
    return { enabled: true, reason: "no se pudo leer el interruptor, se manda igual" }
  }
}

/** Invalida el cache tras cambiar un interruptor desde /webs. */
export function invalidateFunnelTrackingCache(): void {
  _cache = null
}

/**
 * Deja constancia de un evento que NO se mandó a Meta, y por qué.
 *
 * Sin esto, un funnel con la medición apagada quedaría en silencio total y en la pantalla
 * de Eventos sería imposible distinguirlo de "no ha entrado nadie". Un hueco silencioso
 * es peor que un fallo visible.
 */
export async function logSkippedEvent(input: {
  eventId: string
  eventName: string
  url?: string | null
  email?: string | null
  funnel?: string | null
  reason: string
}): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from("meta_events_log").insert({
      event_id: input.eventId,
      event_name: input.eventName,
      source: "server",
      status: "skipped",
      url: input.url ?? null,
      email: input.email ?? null,
      error: input.reason,
      triggered_by: input.funnel ? `funnel:${input.funnel}` : null,
    })
  } catch {
    // Registrar el descarte nunca puede tumbar la petición.
  }
}
