import { redirect } from "next/navigation"
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

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <SidebarProvider>
      <AppSidebar
        userEmail={user.email ?? ""}
        userName={profile?.full_name ?? null}
        userRole={profile?.role ?? null}
      />
      <SidebarInset>
        {children}
      </SidebarInset>
      <PushNotificationPrompt userId={user.id} />
    </SidebarProvider>
  )
}
