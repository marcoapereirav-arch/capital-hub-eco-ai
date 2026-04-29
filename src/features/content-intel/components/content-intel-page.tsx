'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShellHeader } from '@/features/shell/components/shell-header'
import { AccountsTab } from './accounts-tab'
import { VideosTab } from './videos-tab'
import { QueriesScriptsTab } from './queries-scripts-tab'
import { VideoEditPanel } from '@/features/video-edit/components/video-edit-panel'

type Tab = 'accounts' | 'videos' | 'queries' | 'edit'

export function ContentIntelPage() {
  const [tab, setTab] = useState<Tab>('accounts')

  return (
    <>
      <ShellHeader title="Content Intel" />
      <div className="flex flex-col gap-4 p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="accounts">Cuentas</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="queries">Consultas & Guiones</TabsTrigger>
            <TabsTrigger value="edit">Edición</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-6">
            <AccountsTab />
          </TabsContent>
          <TabsContent value="videos" className="mt-6">
            <VideosTab />
          </TabsContent>
          <TabsContent value="queries" className="mt-6">
            <QueriesScriptsTab />
          </TabsContent>
          <TabsContent value="edit" className="mt-6">
            <VideoEditPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
