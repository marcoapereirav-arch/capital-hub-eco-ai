import { ShellHeader } from '@/features/shell/components/shell-header'
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
      <ShellHeader title="Integraciones" />
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">
            Conecta las APIs de las plataformas que alimentan el dashboard.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {platformList.map(platform => (
            <PlatformCard
              key={platform}
              definition={platformDefinitions[platform]}
              connection={byPlatform[platform] ?? null}
            />
          ))}
        </div>
      </div>
    </>
  )
}
