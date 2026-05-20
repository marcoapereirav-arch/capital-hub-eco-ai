import { ShellHeader } from '@/features/shell/components/shell-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getOverview,
  listSubscribers,
  listTags,
  listCustomFields,
  listInbox,
} from '@/features/manychat/services/queries'
import { ManychatOverviewView } from '@/features/manychat/components/manychat-overview'
import { SubscribersList } from '@/features/manychat/components/subscribers-list'
import { InboxView } from '@/features/manychat/components/inbox-view'
import { TagsPanel } from '@/features/manychat/components/tags-panel'

export const dynamic = 'force-dynamic'

export default async function ManychatPage() {
  const [overview, subscribers, tags, customFields, inbox] = await Promise.all([
    getOverview(),
    listSubscribers({ limit: 100 }),
    listTags(),
    listCustomFields(),
    listInbox(50),
  ])

  return (
    <>
      <ShellHeader title="ManyChat" />
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-1">
          <h2 className="text-sm text-muted-foreground">
            DMs de Instagram, suscriptores, tags y eventos en tiempo real.
          </h2>
        </div>

        <Tabs defaultValue="overview" className="flex flex-col gap-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscribers">
              Suscriptores ({overview.totalSubscribers})
            </TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="tags">Tags & Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ManychatOverviewView overview={overview} />
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
      </div>
    </>
  )
}
