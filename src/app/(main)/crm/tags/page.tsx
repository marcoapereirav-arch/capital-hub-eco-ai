import { PageContainer } from "@/components/ui/page-container"
import { TagsPage } from "@/features/tags/components/tags-page"

export const dynamic = "force-dynamic"

/**
 * El desplazamiento y el hueco de la barra de abajo los pone el layout del CRM y
 * el propio PageContainer. Antes esta pagina montaba su propio contenedor con
 * `pb-mobile-nav` a mano y se salia de los margenes del shell.
 */
export default function CrmTagsRoute() {
  return (
    <>
      <PageContainer>
        <TagsPage />
      </PageContainer>
    </>
  )
}
