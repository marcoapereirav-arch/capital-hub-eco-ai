import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyLmToken } from "@/lib/lead-magnets/jwt"
import { LmInvalid } from "@/features/lead-magnets/components/lm-invalid"
import { LmDelivery } from "@/features/lead-magnets/components/lm-delivery"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type LmPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ t?: string }>
}

type LeadMagnetRow = {
  id: string
  slug: string
  name: string
  description: string | null
  delivery_kind: "static" | "dynamic"
  delivery_asset_url: string | null
  delivery_route: string | null
  active: boolean
}

export default async function LeadMagnetDeliveryPage({
  params,
  searchParams,
}: LmPageProps) {
  const { slug } = await params
  const { t: token } = await searchParams

  // 1. Sin token → no se sirve nada (anti-hotlink trivial)
  if (!token) {
    return <LmInvalid reason="missing_token" />
  }

  // 2. Validar JWT
  const payload = await verifyLmToken(token)
  if (!payload) {
    return <LmInvalid reason="invalid_token" />
  }

  // 3. Cargar lead_magnet por slug + verificar que coincide con el del JWT
  const supabase = createAdminClient()
  const { data: lm, error: lmError } = await supabase
    .from("lead_magnets")
    .select("id, slug, name, description, delivery_kind, delivery_asset_url, delivery_route, active")
    .eq("slug", slug)
    .maybeSingle<LeadMagnetRow>()

  if (lmError) {
    console.error("[lm/page] lead_magnet query failed:", lmError)
  }

  if (!lm) {
    notFound()
  }

  // El slug de la URL debe coincidir con el lead_magnet_id del JWT
  if (lm.id !== payload.lmid) {
    return <LmInvalid reason="slug_mismatch" />
  }

  // Si el LM se desactivó después de generar el token → no servirlo
  if (!lm.active) {
    return <LmInvalid reason="inactive" />
  }

  // 4. Marcar opened_at idempotente (solo si era null)
  await supabase
    .from("lead_magnet_deliveries")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", payload.did)
    .is("opened_at", null)

  // 5. Render según delivery_kind
  return (
    <LmDelivery
      lm={{
        slug: lm.slug,
        name: lm.name,
        description: lm.description,
        delivery_kind: lm.delivery_kind,
        delivery_asset_url: lm.delivery_asset_url,
        delivery_route: lm.delivery_route,
      }}
      tokenForDynamic={token}
    />
  )
}
