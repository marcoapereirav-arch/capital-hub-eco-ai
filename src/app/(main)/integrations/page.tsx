import { PageContainer } from '@/components/ui/page-container'
import { PlatformCard } from '@/features/integrations/components/platform-card'
import { platformList, platformDefinitions } from '@/features/integrations/adapters'
import { getConnections } from '@/features/integrations/services/orchestrator'
import type { ApiConnection, Platform } from '@/features/integrations/types'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const connections = await getConnections()
  const byPlatform: Partial<Record<Platform, ApiConnection>> = {}
  for (const c of connections) byPlatform[c.platform] = c

  return (
    <>
      {/* El relleno, el ancho y el hueco de la barra de abajo los pone
          <PageContainer>: antes esta pantalla los escribia a mano y se
          desalineaba con el resto del OS. */}
      <PageContainer>
        <h2 className="text-[15px] font-medium text-muted-foreground">
          Conecta las APIs de las plataformas que alimentan el dashboard.
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {platformList.map(platform => (
            <PlatformCard
              key={platform}
              definition={platformDefinitions[platform]}
              connection={byPlatform[platform] ?? null}
            />
          ))}
        </div>
      </PageContainer>
    </>
  )
}
