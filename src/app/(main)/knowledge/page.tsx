import { KnowledgePage } from "@/features/knowledge/components/knowledge-page"
import { listSops } from "@/features/knowledge/services/knowledge-service"

export const dynamic = "force-dynamic"

export default function KnowledgeRoute() {
  const sops = listSops()
  return <KnowledgePage sops={sops} />
}
