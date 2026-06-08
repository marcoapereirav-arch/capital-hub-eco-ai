import { redirect } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/features/shell/components/app-sidebar"
import { MobileHeader } from "@/features/shell/components/mobile-header"
import { MobileBottomNav } from "@/features/shell/components/mobile-bottom-nav"
import { PushNotificationPrompt } from "@/features/notifications/components/PushNotificationPrompt"
import { UpdateNotifier } from "@/components/UpdateNotifier"
import { RegistrarVentaWidget } from "@/features/sales/components/registrar-venta-widget"
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

        <div className="flex flex-1 flex-col">
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
    </SidebarProvider>
  )
}
