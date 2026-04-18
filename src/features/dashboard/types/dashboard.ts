export type DatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'this_year'
  | 'last_7'
  | 'last_15'
  | 'last_30'
  | 'all_time'
  | 'custom'

export interface DateRange {
  preset: DatePreset
  start: string | null
  end: string | null
}

export interface KpiOverview {
  clientsTotal: number
  revenueTotal: number
  leadsTotal: number
  newLeadsInPeriod: number
  avgTicket: number
  pipelineValue: number
  conversionRate: number
  pipelinesCount: number
}

export interface FunnelMetrics {
  pipelineId: string
  name: string
  stages: Array<{ id: string; name: string; position?: number; count: number }>
  clientsWon: number
  revenueWon: number
  openOppsCount: number
  pipelineValue: number
  avgTicket: number
  conversionRate: number
  revenueShare: number
}

export interface PendingMetrics {
  cac: { label: string; note: string }
  ltv: { label: string; note: string }
  mrr: { label: string; note: string }
}

export interface DashboardData {
  hasConnection: boolean
  range: DateRange
  kpis: KpiOverview
  funnels: FunnelMetrics[]
  pending: PendingMetrics
  lastSyncAt: string | null
}
