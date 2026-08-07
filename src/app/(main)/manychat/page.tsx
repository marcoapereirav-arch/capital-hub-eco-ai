import { PageContainer } from '@/components/ui/page-container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getOverview,
  listSubscribers,
  listTags,
  listCustomFields,
  listInbox,
} from '@/features/manychat/services/queries'
import { getWebinarReelFunnel } from '@/features/manychat/services/webinar-funnel'
import { ManychatOverviewView } from '@/features/manychat/components/manychat-overview'
import { ManychatPeriodKpis } from '@/features/manychat/components/manychat-period-kpis'
import { WebinarFunnelPanel } from '@/features/manychat/components/webinar-funnel-panel'
import { SubscribersList } from '@/features/manychat/components/subscribers-list'
import { InboxView } from '@/features/manychat/components/inbox-view'
import { TagsPanel } from '@/features/manychat/components/tags-panel'

export const dynamic = 'force-dynamic'

export default async function ManychatPage() {
  const [overview, subscribers, tags, customFields, inbox, webinarFunnel] = await Promise.all([
    getOverview(),
    listSubscribers({ limit: 100 }),
    listTags(),
    listCustomFields(),
    listInbox(50),
    getWebinarReelFunnel(),
  ])

  return (
    <>
      {/* PageContainer pone los margenes del shell y reserva el sitio de la
          barra de abajo del telefono. Antes esta pantalla usaba un p-6 suelto. */}
      <PageContainer className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-[15px] text-muted-foreground">
            DMs de Instagram, suscriptores, tags y eventos en tiempo real.
          </h2>
        </div>

        <Tabs defaultValue="overview" className="flex flex-col gap-6">
          {/* Tira deslizable a 44 puntos de alto: cuatro pestanas no caben en 375
              puntos, asi que la ultima asoma para que se vea que hay mas. */}
          <TabsList className="h-[50px]! w-full max-w-full justify-start gap-1 overflow-x-auto md:h-8! md:w-fit">
            <TabsTrigger value="overview" className="flex-none px-3 text-[15px] md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="subscribers" className="flex-none px-3 text-[15px] md:text-sm">
              Suscriptores ({overview.totalSubscribers})
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex-none px-3 text-[15px] md:text-sm">Inbox</TabsTrigger>
            <TabsTrigger value="tags" className="flex-none px-3 text-[15px] md:text-sm">Tags &amp; Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex flex-col gap-6">
              <WebinarFunnelPanel funnel={webinarFunnel} />
              <ManychatPeriodKpis />
              <ManychatOverviewView overview={overview} />
            </div>
          </TabsContent>

          <TabsContent value="subscribers">
            <SubscribersList subscribers={subscribers} />
          </TabsContent>

          <TabsContent value="inbox">
            <InboxView messages={inbox} />
          </TabsContent>

          <TabsContent value="tags">
            <TagsPanel tags={tags} customFields={customFields} />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  )
}
