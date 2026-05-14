'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShellHeader } from '@/features/shell/components/shell-header'
import { AccountsTab } from './accounts-tab'
import { VideosTab } from './videos-tab'
import { QueriesScriptsTab } from './queries-scripts-tab'
import { CorpusChatPanel } from './corpus-chat-panel'
import { IdeasTab } from './ideas-tab'
import { VideoEditPanel } from '@/features/video-edit/components/video-edit-panel'

type Tab = 'ideas' | 'chat' | 'accounts' | 'videos' | 'queries' | 'edit'

export function ContentIntelPage() {
  const [tab, setTab] = useState<Tab>('ideas')
  const [pendingChatId, setPendingChatId] = useState<string | null>(null)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)

  const jumpToChat = (chatId: string, ideaContent?: string) => {
    setPendingChatId(chatId)
    setPendingPrompt(ideaContent ?? null)
    setTab('chat')
  }

  return (
    <>
      <ShellHeader title="Content Intel" />
      <div className="flex flex-col gap-4 p-4 pb-mobile-nav md:p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="-mx-4 w-auto justify-start overflow-x-auto px-4 md:mx-0 md:px-0">
            <TabsTrigger value="ideas">Ideas</TabsTrigger>
            <TabsTrigger value="chat">Chat con Corpus</TabsTrigger>
            <TabsTrigger value="accounts">Cuentas</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="queries">Consultas & Guiones</TabsTrigger>
            <TabsTrigger value="edit">Edición</TabsTrigger>
          </TabsList>

          <TabsContent value="ideas" className="mt-6">
            <IdeasTab onChatGenerated={jumpToChat} />
          </TabsContent>
          <TabsContent value="chat" className="mt-6">
            <CorpusChatPanel
              initialChatId={pendingChatId}
              initialPrompt={pendingPrompt}
            />
          </TabsContent>
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
