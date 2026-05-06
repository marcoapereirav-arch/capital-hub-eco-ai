import { Magnet, ArrowRight } from "lucide-react"
import { getLeadMagnetsFunnelStats } from "@/features/lead-magnets/services/lead-magnets-funnel"

/**
 * KPI 0 del MIFGE — mini-funnel de lead magnets (5 pasos).
 *
 * Server component: lee stats agregadas en cada render. Volumen bajo, sin caché.
 *
 * Ver SOP marketing/04-estrategia-kpis-mifge v3 + marketing/06-lead-magnets.
 */
export async function LeadMagnetsMiniFunnel() {
  const stats = await getLeadMagnetsFunnelStats()

  // Pct se calculan respecto al paso anterior (no al primer paso) — más útil para detectar leaks
  const steps = [
    {
      label: "Comentarios captados",
      hint: "Comentarios IG con keyword de algún LM activo",
      value: stats.optins_captured,
      pctOfPrev: null,
    },
    {
      label: "Email capturado",
      hint: "Lead con email real (no placeholder ManyChat)",
      value: stats.email_captured,
      pctOfPrev: pct(stats.email_captured, stats.optins_captured),
    },
    {
      label: "Recurso abierto",
      hint: "Click en el link del DM y carga de /lm/<slug>",
      value: stats.resource_opened,
      pctOfPrev: pct(stats.resource_opened, stats.email_captured),
    },
    {
      label: "Trial activado",
      hint: "Lead atribuido a LM que pasa a free_trial o más allá",
      value: stats.trial_activated,
      pctOfPrev: pct(stats.trial_activated, stats.resource_opened),
    },
  ]

  const isEmpty = stats.optins_captured === 0

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-purple-500/30 bg-purple-500/10">
            <Magnet className="h-3.5 w-3.5 text-purple-300" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              KPI 0 · Lead Magnets
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Mini-funnel desde comentario IG hasta free trial activado
            </p>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay opt-ins registrados. Cuando publiquéis el primer Reel con keyword
            apuntando a un lead magnet activo, los datos aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {steps.map((step, idx) => (
            <div
              key={step.label}
              className="relative rounded-md border border-border bg-card p-4 transition-colors hover:border-foreground/30"
            >
              <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                {step.label}
              </p>
              <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
                {step.value.toLocaleString("es-ES")}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">{step.hint}</p>
              {step.pctOfPrev != null && (
                <p className="mt-2 font-mono text-[10px] text-purple-300">
                  {step.pctOfPrev}% del paso anterior
                </p>
              )}
              {/* Flecha entre pasos en desktop */}
              {idx < steps.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/30 md:block" />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return Math.round((numerator / denominator) * 100)
}
