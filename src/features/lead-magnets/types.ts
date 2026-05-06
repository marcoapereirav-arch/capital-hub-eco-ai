export type LeadMagnetDeliveryKind = "static" | "dynamic"

export type LeadMagnet = {
  id: string
  slug: string
  name: string
  description: string | null
  delivery_kind: LeadMagnetDeliveryKind
  delivery_asset_url: string | null
  delivery_route: string | null
  manychat_keywords: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export type LeadMagnetWithStats = LeadMagnet & {
  /** Total de deliveries (opt-ins) — puede ser 0 si nadie ha comentado todavía. */
  optins_total: number
  /** Total de deliveries con opened_at != null (recurso abierto). */
  opens_total: number
  /** Total de leads cuyo first_touch_lead_magnet_id apunta a este LM. */
  leads_total: number
  /** Cuántos de esos leads progresaron a Free Trial (cualquier stage post-lead). */
  converted_to_trial_total: number
}
