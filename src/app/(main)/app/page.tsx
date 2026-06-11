import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppEmbedClient } from "./app-embed-client"

/**
 * Ruta /app dentro del OS — embebe la App de alumno con auto-login.
 *
 * Flow:
 * 1. Verifica que hay sesion OS valida (si no, redirect a login)
 * 2. Genera magic-link via Supabase Admin para el email del user actual
 *    (apuntando a app.capitalhubapp.com/training/routes)
 * 3. Renderiza un iframe con esa URL → la App auto-loguea y muestra el panel
 *
 * El user ve su panel de alumno SIN cambiar de pestaña, sin re-login.
 */
export const dynamic = "force-dynamic"

export default async function AppEmbedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_ALUMNO_URL ?? "https://app.capitalhubapp.com"

  // Genera magic-link admin para auto-login en la App
  const { createClient: createAdminClient } = await import("@supabase/supabase-js")
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email!,
    options: {
      redirectTo: `${appBaseUrl}/training/routes`,
    },
  })

  // El SDK puede ignorar redirectTo y usar el Site URL del proyecto Supabase
  // (que es el OS). Por eso reescribimos manualmente el query param redirect_to
  // del action_link para forzar que el verify de Supabase termine en la App.
  let embedUrl = linkData?.properties?.action_link ?? `${appBaseUrl}/training/routes`
  if (linkData?.properties?.action_link) {
    try {
      const u = new URL(linkData.properties.action_link)
      u.searchParams.set("redirect_to", `${appBaseUrl}/training/routes`)
      embedUrl = u.toString()
    } catch {
      // si no se puede parsear, dejamos el action_link original
    }
  }

  if (error) {
    console.error("[app-embed] generateLink error:", error)
  }

  return <AppEmbedClient embedUrl={embedUrl} fallbackUrl={appBaseUrl} />
}
