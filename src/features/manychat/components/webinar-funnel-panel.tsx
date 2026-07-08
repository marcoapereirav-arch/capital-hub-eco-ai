import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WebinarReelFunnel } from '../services/webinar-funnel'

function fmt(n: number): string {
  return new Intl.NumberFormat('es-ES').format(n)
}

function eur(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function pct(part: number, whole: number): string {
  if (!whole) return '—'
  return `${Math.round((part / whole) * 100)}%`
}

type Step = {
  label: string
  hint: string
  value: number
  accent?: boolean
}

export function WebinarFunnelPanel({ funnel }: { funnel: WebinarReelFunnel }) {
  // Etiquetas = stages REALES del pipeline Funnel Webinar (lead → agendado → alumno).
  const steps: Step[] = [
    { label: 'Comentaron el reel', hint: 'entran como stage «Lead»', value: funnel.comentaron },
    { label: 'Agendaron', hint: 'stage «Agendado»', value: funnel.agendaron },
    { label: 'Alumnos', hint: 'stage «Alumno» · la venta', value: funnel.alumnos, accent: true },
  ]
  const max = Math.max(1, ...steps.map((s) => s.value))

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
          Del reel a la venta
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Recorrido de quien entró por el reel (comentario → DM) hasta comprar.
        </p>
      </CardHeader>
      <CardContent>
        {funnel.comentaron === 0 ? (
          <div className="border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Aún no hay nadie del reel. En cuanto ManyChat empiece a avisar de los comentarios, aparecerá el embudo aquí.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {steps.map((s, i) => {
              const prev = i === 0 ? null : steps[i - 1].value
              return (
                <li key={s.label} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-foreground">
                      {s.label}{' '}
                      <span className="text-xs text-muted-foreground">· {s.hint}</span>
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span
                        className="font-heading text-lg font-semibold"
                        style={{ color: s.accent ? '#22C55E' : undefined }}
                      >
                        {fmt(s.value)}
                      </span>
                      {prev !== null && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {pct(s.value, prev)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex h-2 items-center bg-border/60">
                    <div
                      className="h-full"
                      style={{
                        width: `${(s.value / max) * 100}%`,
                        backgroundColor: s.accent ? '#22C55E' : '#F5F6F7',
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">Facturado por este canal</span>
          <span className="font-heading text-xl font-semibold" style={{ color: '#22C55E' }}>
            {eur(funnel.ingresos)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
