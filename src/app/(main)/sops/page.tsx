import { SopsPage } from "@/features/sops/components/sops-page"
import { listSops } from "@/features/sops/services/sops-service"

export const dynamic = "force-dynamic"

export default function SopsRoute() {
  const sops = listSops()
  return <SopsPage sops={sops} />
}
