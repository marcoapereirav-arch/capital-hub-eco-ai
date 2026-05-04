import { ShellHeader } from '@/features/shell/components/shell-header'
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
      <ShellHeader title="Instagram" />
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-1">
          <h2 className="text-sm text-muted-foreground">
            {overview.account
              ? `Cuenta: @${overview.account.handle} • ${overview.account.video_count} posts cacheados`
              : 'Sin cuenta IG configurada como propia.'}
          </h2>
        </div>

        <Tabs defaultValue="overview" className="flex flex-col gap-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendario ({scheduled.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <IgOverviewView overview={overview} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView posts={scheduled} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
