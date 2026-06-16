import { createClient } from "@supabase/supabase-js"

/**
 * Devuelve el status de una web por slug.
 *
 * Estrategia:
 *   La tabla `webs` ya tiene RLS con policy "Public read published webs"
 *   que permite SELECT solo si status='published'. Usamos el cliente ANON:
 *   - Si encuentra fila → la web esta publicada
 *   - Si no encuentra → draft / archived / no existe
 *
 * Esto evita falsos positivos de cache y es mas simple que service_role.
 */
export async function getWebStatusBySlug(slug: string): Promise<"draft" | "published" | "archived" | null> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data } = await client.from("webs").select("status").eq("slug", slug).maybeSingle()
  return (data?.status as "draft" | "published" | "archived" | undefined) ?? null
}

/** True si la web esta publicada. Si no existe o es draft/archived → false. */
export async function isWebPublished(slug: string): Promise<boolean> {
  const status = await getWebStatusBySlug(slug)
  return status === "published"
}
