import { redirect } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/features/shell/components/app-sidebar"
import { MobileHeader } from "@/features/shell/components/mobile-header"
import { MobileBottomNav } from "@/features/shell/components/mobile-bottom-nav"
import { PushNotificationPrompt } from "@/features/notifications/components/PushNotificationPrompt"
import { UpdateNotifier } from "@/components/UpdateNotifier"
import { RegistrarVentaWidget } from "@/features/sales/components/registrar-venta-widget"
import { OsTopBar } from "@/features/shell/components/os-top-bar"
import { createClient } from "@/lib/supabase/server"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  const userEmail = user.email ?? ""
  const userName = profile?.full_name ?? null
  const userRole = profile?.role ?? null

  return (
    <SidebarProvider>
      {/* Desktop sidebar — invisible en movil (md:flex en su contenedor) */}
      <AppSidebar userEmail={userEmail} userName={userName} userRole={userRole} />

      {/* Contenedor principal: en movil renderiza chrome nativo, en desktop usa Sidebar */}
      <SidebarInset>
        <MobileHeader userEmail={userEmail} userName={userName} />

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
      <RegistrarVentaWidget />
      {/* OsTopBar global: la campana de notif vive aquí SIEMPRE, no en cada page header.
          Visible en todas las rutas del OS. */}
      <OsTopBar />
    </SidebarProvider>
  )
}
