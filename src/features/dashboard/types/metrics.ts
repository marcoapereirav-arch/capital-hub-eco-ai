export type MetricTrend = "up" | "down" | "neutral"

export type MetricCard = {
  id: string
  title: string
  value: string
  change: string
  trend: MetricTrend
  source: string
}

export type PlatformStat = {
  platform: string
  followers: string
  engagement: string
  posts: number
}

export type RevenuePoint = {
  month: string
  revenue: number
  adSpend: number
}

export type LeadSource = {
  source: string
  count: number
  percentage: number
}
