import { listLeadMagnetsWithStats } from "@/features/lead-magnets/services/lead-magnets-service"
import { LeadMagnetsAdmin } from "@/features/lead-magnets/components/lead-magnets-admin"

export const dynamic = "force-dynamic"

export default async function LeadMagnetsAdminRoute() {
  const list = await listLeadMagnetsWithStats()
  // El envoltorio de altura fija se retiro a proposito: la pantalla vive dentro de
  // <PageContainer>, que es quien pone los margenes del shell y reserva el hueco de
  // la barra de abajo del telefono.
  return <LeadMagnetsAdmin initialList={list} />
}
