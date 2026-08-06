import { PageContainer } from "@/components/ui/page-container"
import { TagsPage } from "@/features/tags/components/tags-page"

export const dynamic = "force-dynamic"

/**
 * El scroll y el hueco de la barra inferior de movil los pone el layout del CRM,
 * en un solo sitio. Aqui solo van los margenes estandar del OS (<PageContainer>).
 */
export default function CrmTagsRoute() {
  return (
    <PageContainer>
      <TagsPage />
    </PageContainer>
  )
}
