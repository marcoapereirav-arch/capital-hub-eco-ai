import { PageContainer } from "@/components/ui/page-container"
import { MainDashboard } from "@/features/dashboard/components/main-dashboard"

export const dynamic = "force-dynamic"

/**
 * Se quitaron dos cosas que sobraban:
 *  - el div con desplazamiento propio: el marco de (main) ya es el unico que
 *    se desplaza, y anidar otro dejaba dos barras de scroll peleandose en el
 *    telefono.
 *  - el velo de degradado verde del fondo: el brandkit prohibe los degradados
 *    de color, y ademas iba escrito a mano en vez de por el tema.
 * El relleno, el ancho maximo y el hueco de la barra de abajo los pone
 * <PageContainer>, igual que en el resto del OS.
 */
export default function DashboardPage() {
  return (
    <>
      <PageContainer wide>
        <MainDashboard />
      </PageContainer>
    </>
  )
}
