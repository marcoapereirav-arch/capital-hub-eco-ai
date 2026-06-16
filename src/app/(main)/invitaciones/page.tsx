import { ShellHeader } from "@/features/shell/components/shell-header"
import { InvitacionesPage } from "@/features/invitaciones/components/invitaciones-page"

export const dynamic = "force-dynamic"

export default function InvitacionesRoute() {
  return (
    <div className="flex h-full min-h-mobile-content flex-col md:min-h-0">
      <ShellHeader title="Invitaciones" />
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-mobile-nav md:p-6">
        <InvitacionesPage />
      </div>
    </div>
  )
}
