import "server-only"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { FUNNEL_CATALOG } from "./funnel-catalog"
import { funnelFromUrl } from "./funnel-tracking"

/**
 * La foto de la medición: qué DEBERÍA disparar cada funnel y qué ha llegado de verdad.
 *
 * Vive aquí y no dentro de una ruta porque la usan dos sitios: la pantalla de Eventos de
 * Ads (por API, se refresca sola) y el board del sistema visual (en el servidor). Un solo
 * cálculo, dos vistas, cero riesgo de que digan cosas distintas.
 */

export type EstadoEvento = {
  name: string
  when: string
  kind: "estandar" | "nuestro"
  lastAt: string | null
  lastStatus: string | null
  sent: number
  failed: number
  neverSeen: boolean
}

export type EstadoFunnel = {
  slug: string
  label: string
  path: string
  name: string
  optimizeFor: string | null
  published: boolean
  status: string
  trackingEnabled: boolean
  healthy: boolean
  events: EstadoEvento[]
}

export async function getFunnelsStatus(): Promise<{
  capiMode: "test" | "live"
  funnels: EstadoFunnel[]
}> {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: websRows }, { data: logRows }, { data: settingRow }] = await Promise.all([
    admin.from("webs").select("slug, name, status, tracking_enabled"),
    admin
      .from("meta_events_log")
      .select("event_name, status, url, created_at")
      .order("created_at", { ascending: false })
      .limit(3000),
    admin.from("app_settings").select("value").eq("key", "meta_capi_mode").maybeSingle(),
  ])

  const websBySlug = new Map(
    (websRows ?? []).map((w) => [
      w.slug as string,
      {
        name: w.name as string,
        status: w.status as string,
        trackingEnabled: w.tracking_enabled === true,
      },
    ])
  )

  type Seen = { lastAt: string; lastStatus: string; sent: number; failed: number }
  const seen = new Map<string, Seen>()
  const key = (funnel: string | null, name: string) => `${funnel ?? "?"}::${name}`

  for (const row of logRows ?? []) {
    const funnel = funnelFromUrl(row.url as string | null)
    const k = key(funnel, row.event_name as string)
    const status = row.status as string
    const prev = seen.get(k)
    if (!prev) {
      // Vienen del más nuevo al más viejo, así que el primero que se ve es el último.
      seen.set(k, {
        lastAt: row.created_at as string,
        lastStatus: status,
        sent: status === "sent" ? 1 : 0,
        failed: status === "failed" ? 1 : 0,
      })
    } else {
      if (status === "sent") prev.sent += 1
      if (status === "failed") prev.failed += 1
    }
  }

  const capiMode: "test" | "live" =
    (settingRow?.value as { mode?: string } | null)?.mode === "test" ? "test" : "live"

  const funnels = FUNNEL_CATALOG.map((spec) => {
    const web = websBySlug.get(spec.slug)
    const events: EstadoEvento[] = spec.events.map((e) => {
      const hit = seen.get(key(spec.slug, e.name))
      return {
        name: e.name,
        when: e.when,
        kind: e.kind,
        lastAt: hit?.lastAt ?? null,
        lastStatus: hit?.lastStatus ?? null,
        sent: hit?.sent ?? 0,
        failed: hit?.failed ?? 0,
        neverSeen: !hit,
      }
    })

    return {
      slug: spec.slug,
      label: spec.label,
      path: spec.path,
      optimizeFor: spec.optimizeFor,
      name: web?.name ?? spec.label,
      published: web?.status === "published",
      status: web?.status ?? "sin registrar",
      trackingEnabled: web?.trackingEnabled ?? false,
      events,
      // Verde = mide y Meta no ha rechazado nada. Un evento sin estrenar NO es un fallo:
      // significa que nadie ha hecho esa acción todavía.
      healthy: (web?.trackingEnabled ?? false) && events.every((e) => e.failed === 0),
    }
  })

  return { capiMode, funnels }
}
