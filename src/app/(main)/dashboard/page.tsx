import { ShellHeader } from "@/features/shell/components/shell-header"
import { KpiGrid } from "@/features/dashboard/components/kpi-grid"
import { PlatformTable } from "@/features/dashboard/components/platform-table"
import { RevenueChart } from "@/features/dashboard/components/revenue-chart"
import { LeadSources } from "@/features/dashboard/components/lead-sources"
import { ActivityFeed } from "@/features/dashboard/components/activity-feed"
import {
  kpiCards,
  platformStats,
  revenueData,
  leadSources,
  recentActivity,
} from "@/features/dashboard/services/mock-data"

export default function DashboardPage() {
  return (
    <>
      <ShellHeader title="Dashboard" />
      <div className="flex flex-col gap-6 p-6">
        {/* KPI Cards */}
        <KpiGrid cards={kpiCards} />

        {/* Row: Revenue Chart + Lead Sources */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <RevenueChart data={revenueData} />
          </div>
          <div className="lg:col-span-2">
            <LeadSources sources={leadSources} />
          </div>
        </div>

        {/* Row: Platforms + Activity */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <PlatformTable stats={platformStats} />
          </div>
          <div className="lg:col-span-3">
            <ActivityFeed items={recentActivity} />
          </div>
        </div>
      </div>
    </>
  )
}
