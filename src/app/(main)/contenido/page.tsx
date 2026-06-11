import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { loadAllContent } from "@/features/contenido/services/contenido-service"
import { ContenidoAdmin } from "@/features/contenido/components/contenido-admin"
import { ShellHeader } from "@/features/shell/components/shell-header"

export const dynamic = "force-dynamic"

export default async function ContenidoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const role = (user.user_metadata?.role as string | undefined) ?? (user.app_metadata?.role as string | undefined)
  if (role !== "ADMIN") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Solo administradores pueden gestionar el contenido.</p>
      </div>
    )
  }

  const data = await loadAllContent()

  return (
    <div className="flex h-full min-h-mobile-content flex-col md:min-h-0">
      <ShellHeader title="Contenido formaciones" />
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4">
            <h1 className="text-lg font-semibold mb-1">Gestor de contenido</h1>
            <p className="text-xs text-muted-foreground">
              Crea y edita módulos + lecciones de cada formación. Los cambios se aplican en vivo a la App alumno.
            </p>
          </div>
          <ContenidoAdmin
            routes={data.routes}
            formations={data.formations}
            modules={data.modules}
            lessons={data.lessons}
          />
        </div>
      </div>
    </div>
  )
}
