import { ShellHeader } from "@/features/shell/components/shell-header"
import { MainDashboard } from "@/features/dashboard/components/main-dashboard"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-mobile-content flex-col md:min-h-0">
      <ShellHeader title="Dashboard" />
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-mobile-nav md:p-6">
        <MainDashboard />
      </div>
    </div>
  )
}
