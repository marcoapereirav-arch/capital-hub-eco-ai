import { createClient as createServiceClient } from "@supabase/supabase-js"

/**
 * Devuelve el status de una web por slug (funnel / lead_magnet).
 * Si la web no existe o esta en 'draft'/'archived', el caller debe llamar notFound()
 * para que el visitante vea 404 (no debe acceder a contenido no publicado).
 */
export async function getWebStatusBySlug(slug: string): Promise<"draft" | "published" | "archived" | null> {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await admin.from("webs").select("status").eq("slug", slug).maybeSingle()
  return (data?.status as "draft" | "published" | "archived" | undefined) ?? null
}

/** True si la web esta publicada. Si no existe o es draft/archived → false. */
export async function isWebPublished(slug: string): Promise<boolean> {
  const status = await getWebStatusBySlug(slug)
  return status === "published"
}
