import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { syncPlatform } from '@/features/integrations/services/orchestrator'
import type {
  DashboardData,
  DateRange,
  FunnelMetrics,
  KpiOverview,
  PendingMetrics,
} from '../types/dashboard'

// Auto-sync interval: si la ultima sync es mas vieja que esto, sincronizamos antes de renderizar.
const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos

type OppRow = {
  id: string
  pipeline_id: string | null
  pipeline_stage_id: string | null
  status: string | null
  monetary_value: number | null
  opp_created_at: string | null
}

type PipelineRow = {
  id: string
  name: string
  stages: Array<{ id: string; name: string; position?: number }> | null
  synced_at: string | null
}

type ConnectionRow = {
  platform: string
  status: string
  last_sync_at: string | null
}

async function getGhlConnection(): Promise<ConnectionRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('api_connections')
    .select('platform, status, last_sync_at')
    .eq('platform', 'ghl')
    .maybeSingle()
  return (data ?? null) as ConnectionRow | null
}

async function getOpps(range: DateRange): Promise<OppRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('ghl_opportunities_cache')
    .select('id, pipeline_id, pipeline_stage_id, status, monetary_value, opp_created_at')

  if (range.start) {
    query = query.gte('opp_created_at', range.start)
  }
  if (range.end) {
    query = query.lte('opp_created_at', range.end)
  }

  const { data } = await query
  return (data ?? []) as OppRow[]
}

async function getPipelines(): Promise<PipelineRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ghl_pipelines_cache')
    .select('id, name, stages, synced_at')
  return (data ?? []) as PipelineRow[]
}

async function getLeadsTotalAllTime(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('ghl_contacts_cache')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'lead')
  return count ?? 0
}

async function getNewLeadsInPeriod(range: DateRange): Promise<number> {
  const supabase = await createClient()
  let query = supabase
    .from('ghl_contacts_cache')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'lead')

  if (range.start) query = query.gte('contact_created_at', range.start)
  if (range.end) query = query.lte('contact_created_at', range.end)

  const { count } = await query
  return count ?? 0
}

function computeKpis(opps: OppRow[], pipelinesCount: number, leadsTotal: number, newLeads: number): KpiOverview {
  const won = opps.filter((o) => o.status === 'won')
  const open = opps.filter((o) => o.status === 'open')
  const lost = opps.filter((o) => o.status === 'lost')

  const clientsTotal = won.length
  const revenueTotal = won.reduce((s, o) => s + (Number(o.monetary_value) || 0), 0)
  const pipelineValue = open.reduce((s, o) => s + (Number(o.monetary_value) || 0), 0)

  const closedTotal = won.length + lost.length
  const conversionRate = closedTotal > 0 ? (won.length / closedTotal) * 100 : 0
  const avgTicket = clientsTotal > 0 ? revenueTotal / clientsTotal : 0

  return {
    clientsTotal,
    revenueTotal,
    leadsTotal,
    newLeadsInPeriod: newLeads,
    avgTicket,
    pipelineValue,
    conversionRate,
    pipelinesCount,
  }
}

function computeFunnels(
  opps: OppRow[],
  pipelines: PipelineRow[],
  totalRevenue: number
): FunnelMetrics[] {
  const byPipeline = new Map<string, OppRow[]>()
  for (const o of opps) {
    if (!o.pipeline_id) continue
    const list = byPipeline.get(o.pipeline_id) ?? []
    list.push(o)
    byPipeline.set(o.pipeline_id, list)
  }

  return pipelines
    .map((pipe) => {
      const pipelineOpps = byPipeline.get(pipe.id) ?? []
      const won = pipelineOpps.filter((o) => o.status === 'won')
      const open = pipelineOpps.filter((o) => o.status === 'open')
      const lost = pipelineOpps.filter((o) => o.status === 'lost')

      const clientsWon = won.length
      const revenueWon = won.reduce((s, o) => s + (Number(o.monetary_value) || 0), 0)
      const pipelineValue = open.reduce((s, o) => s + (Number(o.monetary_value) || 0), 0)

      const closedTotal = won.length + lost.length
      const conversionRate = closedTotal > 0 ? (won.length / closedTotal) * 100 : 0
      const avgTicket = clientsWon > 0 ? revenueWon / clientsWon : 0
      const revenueShare = totalRevenue > 0 ? (revenueWon / totalRevenue) * 100 : 0

      const stages = (pipe.stages ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        position: s.position,
        count: open.filter((o) => o.pipeline_stage_id === s.id).length,
      }))

      return {
        pipelineId: pipe.id,
        name: pipe.name,
        stages,
        clientsWon,
        revenueWon,
        openOppsCount: open.length,
        pipelineValue,
        avgTicket,
        conversionRate,
        revenueShare,
      }
    })
    .sort((a, b) => b.revenueWon - a.revenueWon)
}

function pendingMetrics(): PendingMetrics {
  const note = 'Requiere OAuth v2 (pagos + ad spend)'
  return {
    cac: { label: 'Sin datos', note },
    ltv: { label: 'Sin datos', note },
    mrr: { label: 'Sin datos', note },
  }
}

export async function getDashboardData(range: DateRange): Promise<DashboardData> {
  let connection = await getGhlConnection()
  const hasConnection = connection?.status === 'connected'

  if (!hasConnection) {
    return {
      hasConnection: false,
      range,
      kpis: {
        clientsTotal: 0,
        revenueTotal: 0,
        leadsTotal: 0,
        newLeadsInPeriod: 0,
        avgTicket: 0,
        pipelineValue: 0,
        conversionRate: 0,
        pipelinesCount: 0,
      },
      funnels: [],
      pending: pendingMetrics(),
      lastSyncAt: connection?.last_sync_at ?? null,
    }
  }

  // Auto-sync: si hace >5 min o nunca se sincronizo, refrescamos en background antes de leer.
  const lastSync = connection?.last_sync_at ? new Date(connection.last_sync_at).getTime() : 0
  const needsSync = Date.now() - lastSync > AUTO_SYNC_INTERVAL_MS
  if (needsSync) {
    try {
      await syncPlatform('ghl')
      connection = await getGhlConnection()
    } catch (e) {
      console.error('[dashboard] auto-sync failed:', e)
    }
  }

  const [opps, pipelines, leadsTotal, newLeads] = await Promise.all([
    getOpps(range),
    getPipelines(),
    getLeadsTotalAllTime(),
    getNewLeadsInPeriod(range),
  ])

  const kpis = computeKpis(opps, pipelines.length, leadsTotal, newLeads)
  const funnels = computeFunnels(opps, pipelines, kpis.revenueTotal)

  return {
    hasConnection: true,
    range,
    kpis,
    funnels,
    pending: pendingMetrics(),
    lastSyncAt: connection?.last_sync_at ?? null,
  }
}
