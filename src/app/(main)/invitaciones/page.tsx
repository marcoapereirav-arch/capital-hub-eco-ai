import { PageContainer } from "@/components/ui/page-container"
import { InvitacionesPage } from "@/features/invitaciones/components/invitaciones-page"

export const dynamic = "force-dynamic"

/**
 * El div con desplazamiento propio sobraba: el marco de (main) ya es el unico
 * que se desplaza. <PageContainer> pone el relleno, el ancho maximo y el hueco
 * de la barra de abajo del telefono.
 */
export default function InvitacionesRoute() {
  return (
    <>
      <PageContainer>
        <InvitacionesPage />
      </PageContainer>
    </>
  )
}
