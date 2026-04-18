import Link from 'next/link'
import { ShellHeader } from "@/features/shell/components/shell-header"
import { DashboardViews } from "@/features/dashboard/components/dashboard-views"
import { getDashboardData } from "@/features/dashboard/services/metrics-service"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <>
      <ShellHeader title="Dashboard" />
      <div className="flex flex-col gap-6 p-6">
        {!data.hasRealData && (
          <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm">
            <p className="font-medium">Mostrando datos de ejemplo.</p>
            <p className="text-muted-foreground">
              Conecta tus plataformas en{' '}
              <Link href="/integrations" className="font-medium underline underline-offset-4">
                Integraciones
              </Link>{' '}
              para ver métricas reales.
            </p>
          </div>
        )}

        <DashboardViews
          kpis={data.kpis}
          platforms={data.platforms}
          revenue={data.revenue}
          leads={data.leads}
          activity={data.activity}
        />
      </div>
    </>
  )
}
