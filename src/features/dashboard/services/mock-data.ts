import type { MetricCard, PlatformStat, RevenuePoint, LeadSource } from "../types/metrics"

export const kpiCards: MetricCard[] = [
  {
    id: "followers",
    title: "Seguidores Totales",
    value: "142.8K",
    change: "+12.3%",
    trend: "up",
    source: "Redes Sociales",
  },
  {
    id: "leads",
    title: "Leads Activos",
    value: "1,284",
    change: "+8.1%",
    trend: "up",
    source: "GHL Pipeline",
  },
  {
    id: "adspend",
    title: "Ad Spend (Mes)",
    value: "€4,320",
    change: "-3.2%",
    trend: "down",
    source: "Meta Ads",
  },
  {
    id: "roas",
    title: "ROAS",
    value: "4.2x",
    change: "+0.3x",
    trend: "up",
    source: "Meta Ads",
  },
  {
    id: "revenue",
    title: "Revenue (Mes)",
    value: "€18,140",
    change: "+22.4%",
    trend: "up",
    source: "Polar",
  },
  {
    id: "churn",
    title: "Churn Rate",
    value: "2.1%",
    change: "-0.4%",
    trend: "up",
    source: "Interno",
  },
]

export const platformStats: PlatformStat[] = [
  {
    platform: "Instagram",
    followers: "89.2K",
    engagement: "4.8%",
    posts: 24,
  },
  {
    platform: "YouTube",
    followers: "32.1K",
    engagement: "6.2%",
    posts: 8,
  },
  {
    platform: "TikTok",
    followers: "21.5K",
    engagement: "8.1%",
    posts: 31,
  },
]

export const revenueData: RevenuePoint[] = [
  { month: "Oct", revenue: 8200, adSpend: 2100 },
  { month: "Nov", revenue: 10400, adSpend: 2800 },
  { month: "Dec", revenue: 12100, adSpend: 3200 },
  { month: "Ene", revenue: 11800, adSpend: 3500 },
  { month: "Feb", revenue: 14200, adSpend: 3900 },
  { month: "Mar", revenue: 18140, adSpend: 4320 },
]

export const leadSources: LeadSource[] = [
  { source: "Organico", count: 412, percentage: 32 },
  { source: "Meta Ads", count: 386, percentage: 30 },
  { source: "Referidos", count: 257, percentage: 20 },
  { source: "YouTube", count: 142, percentage: 11 },
  { source: "Directo", count: 87, percentage: 7 },
]

export const recentActivity = [
  { action: "Nuevo lead", detail: "Carlos M. via Meta Ads", time: "Hace 3 min" },
  { action: "Pago recibido", detail: "€44 — Plan Mensual", time: "Hace 12 min" },
  { action: "Post publicado", detail: "Instagram Reel #142", time: "Hace 1h" },
  { action: "Nuevo lead", detail: "Laura S. via Organico", time: "Hace 1h" },
  { action: "Campana actualizada", detail: "Meta Ads — Lookalike v3", time: "Hace 2h" },
  { action: "Pago recibido", detail: "€440 — Plan Anual", time: "Hace 3h" },
  { action: "Nuevo lead", detail: "David R. via Referido", time: "Hace 4h" },
]
