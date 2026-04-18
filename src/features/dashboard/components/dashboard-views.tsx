'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KpiGrid } from './kpi-grid'
import { PlatformTable } from './platform-table'
import { RevenueChart } from './revenue-chart'
import { LeadSources } from './lead-sources'
import { ActivityFeed } from './activity-feed'
import type { MetricCard, PlatformStat, RevenuePoint, LeadSource } from '../types/metrics'

interface DashboardViewsProps {
  kpis: MetricCard[]
  platforms: PlatformStat[]
  revenue: RevenuePoint[]
  leads: LeadSource[]
  activity: Array<{ action: string; detail: string; time: string }>
}

const SOURCE_GROUPS: Record<string, string[]> = {
  social: ['Instagram', 'YouTube', 'TikTok', 'Redes Sociales'],
  ads: ['Meta Ads'],
  crm: ['GHL Pipeline'],
}

function filterBySource(cards: MetricCard[], group: keyof typeof SOURCE_GROUPS): MetricCard[] {
  const sources = SOURCE_GROUPS[group]
  return cards.filter(c => sources.includes(c.source))
}

function filterPlatforms(platforms: PlatformStat[], names: string[]): PlatformStat[] {
  return platforms.filter(p => names.includes(p.platform))
}

export function DashboardViews({ kpis, platforms, revenue, leads, activity }: DashboardViewsProps) {
  const socialKpis = filterBySource(kpis, 'social')
  const adsKpis = filterBySource(kpis, 'ads')
  const crmKpis = filterBySource(kpis, 'crm')

  return (
    <Tabs defaultValue="all" className="space-y-6">
      <TabsList>
        <TabsTrigger value="all">Todo</TabsTrigger>
        <TabsTrigger value="social">Redes</TabsTrigger>
        <TabsTrigger value="ads">Ads</TabsTrigger>
        <TabsTrigger value="crm">CRM</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-6">
        {kpis.length > 0 && <KpiGrid cards={kpis} />}
        {(revenue.length > 0 || leads.length > 0) && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {revenue.length > 0 && (
              <div className="lg:col-span-3">
                <RevenueChart data={revenue} />
              </div>
            )}
            {leads.length > 0 && (
              <div className="lg:col-span-2">
                <LeadSources sources={leads} />
              </div>
            )}
          </div>
        )}
        {(platforms.length > 0 || activity.length > 0) && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {platforms.length > 0 && (
              <div className="lg:col-span-2">
                <PlatformTable stats={platforms} />
              </div>
            )}
            {activity.length > 0 && (
              <div className="lg:col-span-3">
                <ActivityFeed items={activity} />
              </div>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="social" className="space-y-6">
        {socialKpis.length > 0 ? (
          <KpiGrid cards={socialKpis} />
        ) : (
          <EmptyState title="Sin datos de redes" href="/integrations" />
        )}
        {filterPlatforms(platforms, ['Instagram', 'YouTube', 'TikTok']).length > 0 && (
          <PlatformTable stats={filterPlatforms(platforms, ['Instagram', 'YouTube', 'TikTok'])} />
        )}
      </TabsContent>

      <TabsContent value="ads" className="space-y-6">
        {adsKpis.length > 0 ? (
          <KpiGrid cards={adsKpis} />
        ) : (
          <EmptyState title="Sin datos de Meta Ads" href="/integrations" />
        )}
        {revenue.length > 0 && <RevenueChart data={revenue} />}
      </TabsContent>

      <TabsContent value="crm" className="space-y-6">
        {crmKpis.length > 0 ? (
          <KpiGrid cards={crmKpis} />
        ) : (
          <EmptyState title="Sin datos de GHL" href="/integrations" />
        )}
        {leads.length > 0 && <LeadSources sources={leads} />}
      </TabsContent>
    </Tabs>
  )
}

function EmptyState({ title, href }: { title: string; href: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        <a href={href} className="underline underline-offset-4">Conecta la plataforma</a> para ver métricas reales.
      </p>
    </div>
  )
}
