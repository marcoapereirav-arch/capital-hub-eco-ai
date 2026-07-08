import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WebinarReelFunnel } from '../services/webinar-funnel'

const GREEN = '#22C55E'

function fmt(n: number): string {
  return new Intl.NumberFormat('es-ES').format(n)
}
function eur(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function reelLabel(tag: string): string {
  return tag.replace(/^reel:/, '') || tag
}

export function WebinarFunnelPanel({ funnel }: { funnel: WebinarReelFunnel }) {
  const { overall, perReel } = funnel
  const steps = [
    { label: 'Comentaron', hint: 'stage DM', value: overall.comentaron },
    { label: 'Se apuntaron', hint: 'stage Lead', value: overall.leads },
    { label: 'Agendaron', hint: 'stage Agendado', value: overall.agendaron },
    { label: 'Alumnos', hint: 'la venta', value: overall.alumnos, accent: true },
  ]

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
          Del reel a la venta
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Recorrido de quien llega por tus reels: comentó (DM) → se apuntó (Lead) → agendó → compró.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Resumen global */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((s) => (
            <div key={s.label} className="border border-border p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div
                className="font-heading text-2xl font-semibold text-foreground"
                style={{ color: s.accent ? GREEN : undefined }}
              >
                {fmt(s.value)}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">{s.hint}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Facturado por reels</span>
          <span className="font-heading text-lg font-semibold" style={{ color: GREEN }}>
            {eur(overall.ingresos)}
          </span>
        </div>

        {/* Desglose por reel */}
        <div className="flex flex-col gap-2">
          <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-foreground">
            Por reel
          </h4>
          {perReel.length === 0 ? (
            <div className="border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Aún no hay comentarios atribuidos a un reel. En cuanto ManyChat avise de los comentarios,
              cada reel aparecerá aquí como una fila con su propio embudo.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    {['Reel', 'Comentaron', 'Se apuntaron', 'Agendaron', 'Alumnos', 'Facturado'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground ${i === 0 ? '' : 'text-right'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perReel.map((r) => (
                    <tr key={r.reel} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                      <td className="px-3 py-2.5 font-medium text-foreground">{reelLabel(r.reel)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-foreground">{fmt(r.comentaron)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-foreground">{fmt(r.leads)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-foreground">{fmt(r.agendaron)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold" style={{ color: GREEN }}>
                        {fmt(r.alumnos)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold" style={{ color: GREEN }}>
                        {eur(r.ingresos)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
