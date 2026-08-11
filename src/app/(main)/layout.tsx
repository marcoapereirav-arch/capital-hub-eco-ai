import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/features/shell/components/app-sidebar"
import { MobileHeader } from "@/features/shell/components/mobile-header"
import { MobileBottomNav } from "@/features/shell/components/mobile-bottom-nav"
import { PushNotificationPrompt } from "@/features/notifications/components/PushNotificationPrompt"
import { UpdateNotifier } from "@/components/UpdateNotifier"
import { RegistrarVentaWidget } from "@/features/sales/components/registrar-venta-widget"
import { DiagMovil } from "@/features/shell/components/diag-movil"
import { TopBar } from "@/features/shell/components/top-bar"
import { ViewAsRoleBanner } from "@/features/shell/components/view-as-role-banner"
import { createClient } from "@/lib/supabase/server"
import { getEffectiveRole, VIEW_AS_COOKIE_NAME, loadRolePermsFromDb, setCachedRolePerms } from "@/lib/auth/role-access"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  /* LAS DOS COMPROBACIONES QUE QUEDAN, A LA VEZ.
     ==========================================================================
     Medido el 2026-08-08: este marco hacia TRES viajes a Supabase uno detras de
     otro (quien eres, que permisos hay, tu perfil) y ninguna peticion de datos
     de la pagina arrancaba hasta que terminaban los tres: 373 ms de espera fija
     en TODAS las pantallas del OS. La prueba mas limpia: /login, que esta fuera
     de este marco, responde en 83 ms; /perfil, que esta dentro y casi no tiene
     contenido, tardaba 586 ms.
     Estas dos no dependen una de otra, asi que van juntas. Y la matriz de
     permisos ademas se guarda en memoria un minuto (ver role-access.ts), que era
     la mas absurda: releia 29 filas que casi nunca cambian, en cada navegacion.
     ========================================================================== */
  const [rolePermsSnapshot, perfilRes] = await Promise.all([
    loadRolePermsFromDb(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ),
    supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
  ])
  if (rolePermsSnapshot) setCachedRolePerms(rolePermsSnapshot)
  const profile = perfilRes.data

  const userEmail = user.email ?? ""
  const userName = profile?.full_name ?? null
  const realRole = profile?.role ?? null
  const cookieStore = await cookies()
  const viewAs = cookieStore.get(VIEW_AS_COOKIE_NAME)?.value ?? null
  const userRole = getEffectiveRole(realRole, viewAs)
  const isImpersonating = realRole !== userRole

  return (
    <SidebarProvider>
      {/* Desktop sidebar — invisible en movil (md:flex en su contenedor) */}
      <AppSidebar userEmail={userEmail} userName={userName} userRole={userRole} realRole={realRole} />

      {/* Contenedor principal: en movil renderiza chrome nativo, en desktop usa Sidebar */}
      <SidebarInset>
        <MobileHeader userEmail={userEmail} userName={userName} />
        {/* Barra superior única (desktop): trigger + título + campana, coherente
            en TODAS las secciones. Su línea se alinea con la del sidebar. */}
        <TopBar />
        {isImpersonating && typeof userRole === "string" && (
          <ViewAsRoleBanner viewingAs={userRole} />
        )}

        {/* Wrapper del contenido principal:
            - min-w-0: en flex children, el min-width por defecto es auto = ancho del contenido.
              Sin esto, paginas con kanbans hacen overflow del body horizontalmente.
            - min-h-0: mismo principio para vertical (necesario para que overflow-y-auto funcione
              en flex containers).
            - overflow-x-hidden: bloquea scroll horizontal de TODA la pagina (paginas con kanban
              tienen su propio overflow-x-auto interno).
            - overflow-y-auto: permite scroll vertical SOLO en esta area cuando el contenido excede.
              El sidebar y el header de movil quedan FIJOS, este wrapper es el unico que scrollea
              verticalmente. */}
        <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-x-hidden overflow-y-auto overscroll-none">
          {children}
        </div>

        <MobileBottomNav
          userEmail={userEmail}
          userName={userName}
          userRole={userRole}
        />
      </SidebarInset>

      <PushNotificationPrompt userId={user.id} />
      <UpdateNotifier />
      <RegistrarVentaWidget rol={realRole} />
      {/* TEMPORAL: manda las medidas del telefono para poder arreglar la franja. */}
      <DiagMovil />
    </SidebarProvider>
  )
}
