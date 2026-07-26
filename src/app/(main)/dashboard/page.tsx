import { ShellHeader } from "@/features/shell/components/shell-header"
import { MainDashboard } from "@/features/dashboard/components/main-dashboard"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-mobile-content flex-col md:min-h-0">
      <ShellHeader title="Dashboard" />
      <div className="relative flex-1 min-h-0 overflow-y-auto pb-mobile-nav">
        {/* Fondo verde a sangre completa: cubre TODA el area principal, sin margen negro. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 62% at 50% -4%, rgb(var(--brand)/0.15) 0%, rgb(var(--brand)/0.05) 32%, transparent 62%)",
          }}
        />
        <div className="relative p-4 md:p-6">
          <MainDashboard />
        </div>
      </div>
    </div>
  )
}
