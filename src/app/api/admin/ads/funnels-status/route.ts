import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { FUNNEL_CATALOG } from "@/lib/meta/funnel-catalog"
import { funnelFromUrl } from "@/lib/meta/funnel-tracking"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/admin/ads/funnels-status
 *
 * La foto de la medición: un funnel por fila y, dentro, cada evento que DEBERÍA estar
 * disparando, con la última vez que llegó a Meta.
 *
 * Cruza tres cosas:
 *   - el catálogo de funnels (qué eventos se esperan de cada uno),
 *   - la tabla `webs` (publicado o no, y el interruptor de medición),
 *   - `meta_events_log` (qué llegó de verdad, y cuándo).
 *
 * Un evento que se espera y nunca ha llegado sale en rojo. Eso es exactamente lo que
 * no se veía antes de esta pantalla.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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

  // Último evento por (funnel, nombre de evento) y conteo de los que llegaron.
  type Seen = { lastAt: string; lastStatus: string; sent: number; failed: number }
  const seen = new Map<string, Seen>()
  const key = (funnel: string | null, name: string) => `${funnel ?? "?"}::${name}`

  for (const row of logRows ?? []) {
    const funnel = funnelFromUrl(row.url as string | null)
    const k = key(funnel, row.event_name as string)
    const prev = seen.get(k)
    const status = row.status as string
    if (!prev) {
      seen.set(k, {
        lastAt: row.created_at as string,
        lastStatus: status,
        sent: status === "sent" ? 1 : 0,
        failed: status === "failed" ? 1 : 0,
      })
    } else {
      // Vienen ordenados de más nuevo a más viejo, así que lastAt ya es el bueno.
      if (status === "sent") prev.sent += 1
      if (status === "failed") prev.failed += 1
    }
  }

  const capiMode = (settingRow?.value as { mode?: string } | null)?.mode === "test" ? "test" : "live"

  const funnels = FUNNEL_CATALOG.map((spec) => {
    const web = websBySlug.get(spec.slug)
    const events = spec.events.map((e) => {
      const hit = seen.get(key(spec.slug, e.name))
      return {
        name: e.name,
        when: e.when,
        kind: e.kind,
        lastAt: hit?.lastAt ?? null,
        lastStatus: hit?.lastStatus ?? null,
        sent: hit?.sent ?? 0,
        failed: hit?.failed ?? 0,
        // Nunca ha llegado ni uno: o está roto o nadie ha pasado por ahí todavía.
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
      // Verde solo si mide Y todos los eventos que espera han llegado alguna vez.
      healthy:
        (web?.trackingEnabled ?? false) &&
        events.length > 0 &&
        events.every((e) => !e.neverSeen && e.failed === 0),
    }
  })

  return NextResponse.json({ capiMode, funnels })
}
