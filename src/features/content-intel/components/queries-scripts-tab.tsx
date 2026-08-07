'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudioPanel } from './studio-panel'
import { ScriptGeneratorPanel } from './script-generator-panel'

export function QueriesScriptsTab() {
  const [subTab, setSubTab] = useState<'studio' | 'drafts'>('studio')

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'studio' | 'drafts')}>
        {/* 44 puntos de alto en telefono, compacta en monitor */}
        <TabsList className="h-[50px]! w-full max-w-full justify-start md:h-8! md:w-fit">
          <TabsTrigger value="studio" className="px-3 text-[15px] md:text-sm">Studio</TabsTrigger>
          <TabsTrigger value="drafts" className="px-3 text-[15px] md:text-sm">Drafts</TabsTrigger>
        </TabsList>
        <TabsContent value="studio" className="mt-4">
          <StudioPanel onSwitchToDrafts={() => setSubTab('drafts')} />
        </TabsContent>
        <TabsContent value="drafts" className="mt-4">
          <ScriptGeneratorPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
