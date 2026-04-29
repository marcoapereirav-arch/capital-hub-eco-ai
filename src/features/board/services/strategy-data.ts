// Fuente única de verdad de los KPIs del funnel.
// NO MODIFICAR los valores sin acuerdo explícito (proyección y objetivo
// fueron aterrados en daily 27-abr 2026 entre Marco, Adrián y JP).

export type Kpi = {
  step: string
  fromStage: string
  toStage: string
  proyeccion: number
  objetivo: number
  notes: string
}

export const FUNNEL_KPIS: Kpi[] = [
  {
    step: "1",
    fromStage: "Visita landing",
    toStage: "Free Trial activado",
    proyeccion: 15,
    objetivo: 30,
    notes: "Ratio de conversión de la landing. KPI clave de la calidad de la landing + tráfico.",
  },
  {
    step: "2",
    fromStage: "Free Trial",
    toStage: "Order Bump comprado",
    proyeccion: 15,
    objetivo: 30,
    notes: "Bonus 20€ añadido en el checkout. Liquida ad cost (SLO).",
  },
  {
    step: "3",
    fromStage: "Free Trial",
    toStage: "Plan Anual 970€",
    proyeccion: 2,
    objetivo: 5,
    notes: "Upsell 1. El SLO grande. Cada uno = 970€ inmediato.",
  },
  {
    step: "4",
    fromStage: "Free Trial",
    toStage: "Llamada agendada",
    proyeccion: 50,
    objetivo: 70,
    notes: "Upsell 2 (la llamada con Adrián). Pre-cualificación obligatoria.",
  },
  {
    step: "5",
    fromStage: "Free Trial",
    toStage: "Conversión a One Año (no cancela)",
    proyeccion: 40,
    objetivo: 60,
    notes: "% que NO cancela en los 14 días gratis y se convierte en cliente mensual.",
  },
]

export const FUNNEL_GOAL = {
  daily_ad_spend_eur: 1000,
  goal_summary: "1.000€/día invertido en publicidad alcanzando todos los KPIs",
}

export const PRICING = {
  free_trial_days: 14,
  monthly_eur: 97,
  annual_eur: 970,
  order_bump_eur: 20,
  call_minutes: 20,
}
