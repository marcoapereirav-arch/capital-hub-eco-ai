'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { PageContainer } from '@/components/ui/page-container'
import { cn } from '@/lib/utils'
import { AccountsTab } from './accounts-tab'
import { VideosTab } from './videos-tab'
import { QueriesScriptsTab } from './queries-scripts-tab'
import { CorpusChatPanel } from './corpus-chat-panel'
import { IdeasTab } from './ideas-tab'
import { VideoEditPanel } from '@/features/video-edit/components/video-edit-panel'

type Tab = 'ideas' | 'chat' | 'accounts' | 'videos' | 'queries' | 'edit'

const TABS: { id: Tab; label: string }[] = [
  { id: 'ideas', label: 'Ideas' },
  { id: 'chat', label: 'Chat con Corpus' },
  { id: 'accounts', label: 'Cuentas' },
  { id: 'videos', label: 'Videos' },
  { id: 'queries', label: 'Consultas & Guiones' },
  { id: 'edit', label: 'Edición' },
]

export function ContentIntelPage() {
  const [tab, setTab] = useState<Tab>('ideas')
  const [pendingChatId, setPendingChatId] = useState<string | null>(null)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  const jumpToChat = (chatId: string, ideaContent?: string) => {
    setPendingChatId(chatId)
    setPendingPrompt(ideaContent ?? null)
    setTab('chat')
  }

  const activa = TABS.find((t) => t.id === tab) ?? TABS[0]

  return (
    <>
      {/* PageContainer pone los margenes del shell y reserva el hueco de la barra
          de abajo del telefono. Antes esta pantalla llevaba su propio p-4. */}
      <PageContainer>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          {/* TELEFONO: seis pestanas no caben en una tira. Un boton con el nombre
              de la actual abre la lista completa en una hoja inferior. */}
          <button
            type="button"
            onClick={() => setSelectorAbierto(true)}
            className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-[15px] active:bg-muted md:hidden"
          >
            <span className="min-w-0 truncate font-semibold text-foreground">{activa.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

          <Sheet open={selectorAbierto} onOpenChange={setSelectorAbierto}>
            <SheetContent side="bottom" className="rounded-t-xl">
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />
              <SheetTitle className="px-4 pt-2 text-[17px] font-semibold">Secciones</SheetTitle>
              <div className="pb-2">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setSelectorAbierto(false) }}
                    className={cn(
                      'flex h-12 w-full items-center px-4 text-[15px] active:bg-muted',
                      t.id === tab ? 'font-semibold text-primary' : 'text-foreground'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* MONITOR: la tira de pestanas de siempre */}
          <TabsList className="hidden w-auto max-w-full justify-start overflow-x-auto md:inline-flex">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="flex-none px-3">
                {t.label}
              </TabsTrigger>
            ))}
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
      </PageContainer>
    </>
  )
}
