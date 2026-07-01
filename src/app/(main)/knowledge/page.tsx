import { KnowledgePage } from "@/features/knowledge/components/knowledge-page"
import { listKnowledgeFolders } from "@/features/knowledge/services/knowledge-service"

export const dynamic = "force-dynamic"

export default function KnowledgeRoute() {
  const folders = listKnowledgeFolders()
  return <KnowledgePage folders={folders} />
}
