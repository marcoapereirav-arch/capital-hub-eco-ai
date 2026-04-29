import { ShellHeader } from "@/features/shell/components/shell-header"
import { FUNNEL_KPIS, FUNNEL_GOAL, PRICING } from "@/features/board/services/strategy-data"

export default function StrategyPage() {
  const visits = 1000
  const trials = (visits * FUNNEL_KPIS[0].objetivo) / 100
  const orderBumps = (trials * FUNNEL_KPIS[1].objetivo) / 100
  const annuals = (trials * FUNNEL_KPIS[2].objetivo) / 100
  const calls = (trials * FUNNEL_KPIS[3].objetivo) / 100
  const oneYear = (trials * FUNNEL_KPIS[4].objetivo) / 100

  return (
    <>
      <ShellHeader title="Estrategia" />
      <div className="mx-auto max-w-3xl space-y-8 p-6">
        {/* GOAL */}
        <section className="rounded-lg border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300 mb-2">
            Misión transversal del negocio
          </p>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {FUNNEL_GOAL.daily_ad_spend_eur.toLocaleString()}€/día en publi
          </h1>
          <p className="mt-1 text-amber-200/80">alcanzando los 5 KPIs aterrizados con el equipo</p>
        </section>

        {/* RESUMEN */}
        <section>
          <p className="text-muted-foreground leading-relaxed">
            Esta página es la <strong className="text-foreground">fuente única de verdad</strong> de la
            estrategia del funnel. Las cifras NO se modifican sin acuerdo explícito. Fueron aterradas
            en el daily del <strong className="text-foreground">27 de abril 2026</strong> entre Marco, Adrián y JP.
          </p>
        </section>

        {/* PRICING */}
        <section>
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">💰 Pricing del funnel</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Free Trial</p>
              <p className="font-heading text-lg font-semibold text-foreground">{PRICING.free_trial_days} días · 0€</p>
            </div>
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Order Bump (checkout)</p>
              <p className="font-heading text-lg font-semibold text-foreground">{PRICING.order_bump_eur}€</p>
            </div>
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Plan mensual</p>
              <p className="font-heading text-lg font-semibold text-foreground">{PRICING.monthly_eur}€/mes</p>
            </div>
            <div className="rounded-md border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Plan anual (Upsell 1)</p>
              <p className="font-heading text-lg font-semibold text-foreground">{PRICING.annual_eur}€/año</p>
            </div>
            <div className="rounded-md border border-border bg-card p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">Llamada con Adrián (Upsell 2)</p>
              <p className="font-heading text-lg font-semibold text-foreground">{PRICING.call_minutes} min · gratis</p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section>
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
            🎯 Los 5 KPIs (proyección · objetivo)
          </h2>
          <ul className="space-y-3">
            {FUNNEL_KPIS.map((k) => (
              <li key={k.step} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-heading text-sm font-semibold text-foreground">
                    {k.step}. {k.fromStage} → {k.toStage}
                  </span>
                  <span className="font-mono shrink-0 text-sm">
                    <span className="text-zinc-400">{k.proyeccion}%</span>
                    <span className="text-zinc-500 mx-1">·</span>
                    <span className="text-amber-300 font-semibold">{k.objetivo}%</span>
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{k.notes}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* EJEMPLO */}
        <section>
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
            🔢 Ejemplo aplicado al objetivo
          </h2>
          <div className="rounded-md border border-border bg-card p-4 font-mono text-sm space-y-2 text-foreground">
            <p>📥 <strong>{visits.toLocaleString()}</strong> visitas a la landing</p>
            <p className="text-muted-foreground text-xs">↓ {FUNNEL_KPIS[0].objetivo}% objetivo</p>
            <p>🟢 <strong>{trials.toLocaleString()}</strong> activan free trial</p>
            <p className="ml-4 text-muted-foreground text-xs">↓ {FUNNEL_KPIS[1].objetivo}%</p>
            <p className="ml-4">🎁 <strong>{orderBumps.toLocaleString()}</strong> compran Order Bump → <span className="text-amber-300">+{(orderBumps * PRICING.order_bump_eur).toLocaleString()}€</span></p>
            <p className="ml-4 text-muted-foreground text-xs">↓ {FUNNEL_KPIS[2].objetivo}%</p>
            <p className="ml-4">💰 <strong>{annuals.toLocaleString()}</strong> compran Plan Anual → <span className="text-amber-300">+{(annuals * PRICING.annual_eur).toLocaleString()}€</span></p>
            <p className="ml-4 text-muted-foreground text-xs">↓ {FUNNEL_KPIS[3].objetivo}%</p>
            <p className="ml-4">📞 <strong>{calls.toLocaleString()}</strong> agendan llamada con Adrián</p>
            <p className="ml-4 text-muted-foreground text-xs">↓ {FUNNEL_KPIS[4].objetivo}%</p>
            <p className="ml-4">🔁 <strong>{oneYear.toLocaleString()}</strong> NO cancelan → <span className="text-amber-300">+{(oneYear * PRICING.monthly_eur).toLocaleString()}€/mes recurrente</span></p>
          </div>
        </section>

        <p className="text-[10px] text-muted-foreground/70 text-center pt-6 border-t border-border">
          Fuente de los datos: <code className="font-mono">src/features/board/services/strategy-data.ts</code><br />
          Transcript meeting: <code className="font-mono">docs/meetings/daily/2026-04-27-estrategia-funnel-nuevo.md</code>
        </p>
      </div>
    </>
  )
}
