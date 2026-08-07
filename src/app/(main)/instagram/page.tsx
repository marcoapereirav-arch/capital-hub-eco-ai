import { PageContainer } from '@/components/ui/page-container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getOverview } from '@/features/instagram/services/queries'
import { listScheduled } from '@/features/instagram/services/calendar'
import { IgOverviewView } from '@/features/instagram/components/ig-overview'
import { CalendarView } from '@/features/instagram/components/calendar-view'

export const dynamic = 'force-dynamic'

export default async function InstagramPage() {
  const [overview, scheduled] = await Promise.all([
    getOverview(),
    listScheduled(),
  ])

  return (
    <>
      {/* PageContainer pone los margenes del shell y reserva el sitio de la
          barra de abajo del telefono. Antes esta pantalla usaba un p-6 suelto. */}
      <PageContainer className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-[15px] text-muted-foreground">
            {overview.account
              ? `Cuenta: @${overview.account.handle} • ${overview.account.video_count} posts cacheados`
              : 'Sin cuenta IG configurada como propia.'}
          </h2>
        </div>

        <Tabs defaultValue="overview" className="flex flex-col gap-6">
          {/* 44 puntos de alto en telefono (el alto del dedo), compacta en monitor */}
          <TabsList className="h-[50px]! w-full max-w-full justify-start gap-1 overflow-x-auto md:h-8! md:w-fit">
            <TabsTrigger value="overview" className="flex-none px-3 text-[15px] md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="calendar" className="flex-none px-3 text-[15px] md:text-sm">
              Calendario ({scheduled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <IgOverviewView overview={overview} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView posts={scheduled} />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  )
}
