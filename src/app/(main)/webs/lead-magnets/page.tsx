import { listLeadMagnetsWithStats } from "@/features/lead-magnets/services/lead-magnets-service"
import { LeadMagnetsAdmin } from "@/features/lead-magnets/components/lead-magnets-admin"

export const dynamic = "force-dynamic"

export default async function LeadMagnetsAdminRoute() {
  const list = await listLeadMagnetsWithStats()
  return (
    <div className="flex h-full flex-col">
      <LeadMagnetsAdmin initialList={list} />
    </div>
  )
}
