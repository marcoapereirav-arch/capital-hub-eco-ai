// Datos de la misión + KPIs usados en el MissionNode del board.
// FUENTE CANÓNICA: docs/sops/06-estrategia-kpis-mifge.md (knowledge).
// Si cambian los valores, actualizar PRIMERO el knowledge y reflejar aquí.

export type Kpi = {
  step: string
  fromStage: string
  toStage: string
  proyeccion: number
  objetivo: number
}

export const FUNNEL_KPIS: Kpi[] = [
  { step: "1", fromStage: "Visita landing", toStage: "Free Trial activado", proyeccion: 15, objetivo: 30 },
  { step: "2", fromStage: "Free Trial", toStage: "Order Bump comprado", proyeccion: 15, objetivo: 30 },
  { step: "3", fromStage: "Free Trial", toStage: "Plan Anual 970€", proyeccion: 2, objetivo: 5 },
  { step: "4", fromStage: "Free Trial", toStage: "Llamada agendada", proyeccion: 50, objetivo: 70 },
  { step: "5", fromStage: "Free Trial", toStage: "Conversión a mensual", proyeccion: 40, objetivo: 60 },
]

export const FUNNEL_GOAL = {
  daily_ad_spend_eur: 1000,
}
