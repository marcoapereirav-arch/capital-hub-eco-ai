import { PageContainer } from "@/components/ui/page-container"
import { TagsPage } from "@/features/tags/components/tags-page"

export const dynamic = "force-dynamic"

/**
 * El scroll y el hueco de la barra inferior de movil los pone el layout del CRM,
 * en un solo sitio. Aqui solo van los margenes estandar del OS (<PageContainer>).
 * Antes esta pagina montaba su propio contenedor con `pb-mobile-nav` a mano y se
 * salia de los margenes del shell.
 */
export default function CrmTagsRoute() {
  // `pb-28 md:pb-28`: hueco para que el boton flotante de "Registrar venta" no tape la
  // ultima fila de etiquetas. La variante `md:` hace falta porque `PageContainer` trae
  // `md:py-6` y en escritorio gana al `pb-28` suelto. Mismo caso que en la lista.
  return (
    <PageContainer className="pb-28 md:pb-28">
      <TagsPage />
    </PageContainer>
  )
}
