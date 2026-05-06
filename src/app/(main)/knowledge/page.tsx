import { KnowledgePage } from "@/features/knowledge/components/knowledge-page"
import { listQuadrants } from "@/features/knowledge/services/knowledge-service"

export const dynamic = "force-dynamic"

export default function KnowledgeRoute() {
  const quadrants = listQuadrants()
  return <KnowledgePage quadrants={quadrants} />
}
