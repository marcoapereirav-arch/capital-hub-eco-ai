import { ShellHeader } from "@/features/shell/components/shell-header"
import { BusinessStatus } from "@/features/dashboard/components/business-status"
import { FunnelPerformance } from "@/features/dashboard/components/funnel-performance"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <>
      <ShellHeader title="Dashboard" />
      <div className="flex flex-col gap-6 p-4 pb-mobile-nav md:gap-8 md:p-6">
        {/* SECCIÓN 1 — Estado actual */}
        <BusinessStatus />

        <Separator />

        {/* SECCIÓN 2 — Performance del funnel */}
        <FunnelPerformance />
      </div>
    </>
  )
}
