import { ShellHeader } from "@/features/shell/components/shell-header"
import { BusinessStatus } from "@/features/dashboard/components/business-status"
import { FunnelPerformance } from "@/features/dashboard/components/funnel-performance"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <>
      <ShellHeader title="Dashboard" />
      <div className="flex flex-col gap-8 p-6">
        {/* Tabs placeholder — futuro: Meta · Instagram · Negocio */}
        <div className="flex items-center gap-2 border-b border-border">
          <div className="flex items-center gap-2 border-b-2 border-foreground px-3 py-2 text-sm font-medium text-foreground">
            Negocio
          </div>
          <div className="flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground/60">
            Meta <span className="ml-1 rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px]">soon</span>
          </div>
          <div className="flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground/60">
            Instagram <span className="ml-1 rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px]">soon</span>
          </div>
        </div>

        {/* Aviso de placeholders */}
        <div className="rounded-sm border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <p className="text-amber-400">
            <span className="font-semibold">Modo placeholder.</span>{" "}
            <span className="text-muted-foreground">
              Los KPIs muestran &mdash; hasta que se conecten Stripe + Meta CAPI + tracking events del funnel.
              Las metas y objetivos sí están configurados según el daily 27-abr.
            </span>
          </p>
        </div>

        {/* SECCIÓN 1 — Estado actual */}
        <BusinessStatus />

        <Separator />

        {/* SECCIÓN 2 — Performance del funnel */}
        <FunnelPerformance />
      </div>
    </>
  )
}
