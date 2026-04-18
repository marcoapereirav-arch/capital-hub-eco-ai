import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/features/shell/components/app-sidebar"
import { PushNotificationPrompt } from "@/features/notifications/components/PushNotificationPrompt"
import { createClient } from "@/lib/supabase/server"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
      <PushNotificationPrompt userId={user?.id} />
    </SidebarProvider>
  )
}
