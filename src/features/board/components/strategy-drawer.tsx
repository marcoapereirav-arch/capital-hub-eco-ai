"use client"

import { X, ExternalLink } from "lucide-react"
import { FUNNEL_KPIS, FUNNEL_GOAL, PRICING } from "../services/strategy-data"

interface StrategyDrawerProps {
  open: boolean
  onClose: () => void
}

export function StrategyDrawer({ open, onClose }: StrategyDrawerProps) {
  if (!open) return null

  // Ejemplo numérico para visualizar el flow con números reales
  const visits = 1000
  const trials = (visits * FUNNEL_KPIS[0].objetivo) / 100
  const orderBumps = (trials * FUNNEL_KPIS[1].objetivo) / 100
  const annuals = (trials * FUNNEL_KPIS[2].objetivo) / 100
  const calls = (trials * FUNNEL_KPIS[3].objetivo) / 100
  const oneYear = (trials * FUNNEL_KPIS[4].objetivo) / 100

  return (
    <div className="fixed inset-y-0 right-0 z-[90] w-full max-w-xl border-l border-border bg-card shadow-2xl overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="font-heading text-base font-semibold">📖 Estrategia KPIs</span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-wide">
            fuente única de verdad
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/strategy"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="Abrir página completa"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="space-y-6 p-5 text-sm">
        {/* GOAL */}
        <section className="rounded-md border-2 border-amber-400/50 bg-amber-500/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide text-amber-300 mb-1">Misión transversal</p>
          <p className="font-heading text-lg font-semibold text-foreground">
            {FUNNEL_GOAL.daily_ad_spend_eur.toLocaleString()}€/día en publicidad alcanzando los 5 KPIs
          </p>
        </section>

        {/* PRICING */}
        <section>
          <h3 className="mb-3 font-heading text-xs uppercase tracking-wide text-muted-foreground">
            💰 Pricing del funnel
          </h3>
          <ul className="space-y-1.5 text-foreground">
            <li className="flex justify-between"><span>Free Trial</span> <span className="font-mono text-amber-300">{PRICING.free_trial_days} días · 0€</span></li>
            <li className="flex justify-between"><span>Order Bump (en checkout)</span> <span className="font-mono text-amber-300">{PRICING.order_bump_eur}€</span></li>
            <li className="flex justify-between"><span>Plan mensual</span> <span className="font-mono text-amber-300">{PRICING.monthly_eur}€/mes</span></li>
            <li className="flex justify-between"><span>Plan anual (Upsell 1)</span> <span className="font-mono text-amber-300">{PRICING.annual_eur}€/año (2 meses gratis)</span></li>
            <li className="flex justify-between"><span>Llamada con Adrián (Upsell 2)</span> <span className="font-mono text-amber-300">{PRICING.call_minutes} min · gratis</span></li>
          </ul>
        </section>

        {/* KPIs */}
        <section>
          <h3 className="mb-3 font-heading text-xs uppercase tracking-wide text-muted-foreground">
            🎯 Los 5 KPIs (proyección · objetivo)
          </h3>
          <p className="mb-3 text-muted-foreground text-xs">
            Las cifras NO se modifican sin acuerdo explícito. Aterradas en daily 27-abr 2026 (Marco · Adrián · JP).
          </p>
          <ul className="space-y-3">
            {FUNNEL_KPIS.map((k) => (
              <li key={k.step} className="rounded-md border border-border bg-secondary/30 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-heading text-[13px] font-semibold text-foreground">
                    {k.step}. {k.fromStage} → {k.toStage}
                  </span>
                  <span className="font-mono shrink-0 text-xs">
                    <span className="text-zinc-400">{k.proyeccion}%</span>
                    <span className="text-zinc-500 mx-1">·</span>
                    <span className="text-amber-300 font-semibold">{k.objetivo}%</span>
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{k.notes}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* EJEMPLO NUMÉRICO */}
        <section>
          <h3 className="mb-3 font-heading text-xs uppercase tracking-wide text-muted-foreground">
            🔢 Ejemplo aplicado al objetivo
          </h3>
          <div className="rounded-md border border-border bg-secondary/30 p-3 font-mono text-xs space-y-1.5 text-foreground">
            <p>📥 <strong>{visits.toLocaleString()}</strong> visitas a la landing</p>
            <p>↓ ({FUNNEL_KPIS[0].objetivo}% objetivo)</p>
            <p>🟢 <strong>{trials.toLocaleString()}</strong> activan free trial</p>
            <p className="ml-4">↓ ({FUNNEL_KPIS[1].objetivo}% objetivo)</p>
            <p className="ml-4">🎁 <strong>{orderBumps.toLocaleString()}</strong> compran Order Bump → +{(orderBumps * PRICING.order_bump_eur).toLocaleString()}€</p>
            <p className="ml-4">↓ ({FUNNEL_KPIS[2].objetivo}% objetivo)</p>
            <p className="ml-4">💰 <strong>{annuals.toLocaleString()}</strong> compran Plan Anual → +{(annuals * PRICING.annual_eur).toLocaleString()}€</p>
            <p className="ml-4">↓ ({FUNNEL_KPIS[3].objetivo}% objetivo)</p>
            <p className="ml-4">📞 <strong>{calls.toLocaleString()}</strong> agendan llamada con Adrián</p>
            <p className="ml-4">↓ ({FUNNEL_KPIS[4].objetivo}% objetivo)</p>
            <p className="ml-4">🔁 <strong>{oneYear.toLocaleString()}</strong> NO cancelan en 14 días → +{(oneYear * PRICING.monthly_eur).toLocaleString()}€/mes recurrente</p>
          </div>
        </section>

        {/* CADENA */}
        <section>
          <h3 className="mb-3 font-heading text-xs uppercase tracking-wide text-muted-foreground">
            🔗 La cadena lógica
          </h3>
          <ol className="space-y-2 text-foreground list-decimal list-inside">
            <li>De cada <strong>100</strong> que ven la landing, queremos que <strong>30</strong> activen free trial.</li>
            <li>De cada 100 que activan free trial, <strong>30</strong> deberían añadir el Order Bump (20€).</li>
            <li>De cada 100 free trial, <strong>5</strong> compran el Plan Anual de 970€ (es el SLO grande).</li>
            <li>De cada 100 free trial, <strong>70</strong> agendan la llamada con Adrián (cualificación obligatoria).</li>
            <li>De cada 100 free trial, <strong>60</strong> NO cancelan en 14 días y se convierten en One Año (97€/mes).</li>
          </ol>
        </section>

        <p className="text-[10px] text-muted-foreground/70 text-center pt-4 border-t border-border">
          Source of truth: <code className="font-mono">src/features/board/services/strategy-data.ts</code><br />
          Derivado del transcript del meeting:{" "}
          <code className="font-mono">docs/meetings/daily/2026-04-27-estrategia-funnel-nuevo.md</code>
        </p>
      </div>
    </div>
  )
}
