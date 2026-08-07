import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { WebinarReelFunnel } from '../services/webinar-funnel'

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
        <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
          Del reel a la venta
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Recorrido de quien llega por tus reels: comentó (DM) → se apuntó (Lead) → agendó → compró.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Resumen global */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.label} className="rounded-lg border border-border p-3">
              <div className="text-sm font-semibold text-muted-foreground">{s.label}</div>
              {/* El verde de la venta sale del token, no de un color grabado */}
              <div
                className={cn(
                  'font-heading text-2xl font-semibold tabular-nums',
                  s.accent ? 'text-primary' : 'text-foreground'
                )}
              >
                {fmt(s.value)}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">{s.hint}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-[15px] text-muted-foreground">Facturado por reels</span>
          <span className="font-heading text-lg font-semibold tabular-nums text-primary">
            {eur(overall.ingresos)}
          </span>
        </div>

        {/* Desglose por reel */}
        <div className="flex flex-col gap-2">
          <h4 className="font-heading text-[15px] font-semibold text-foreground">
            Por reel
          </h4>
          {perReel.length === 0 ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
              <h5 className="text-[17px] font-semibold text-foreground">Todavía no hay reels atribuidos</h5>
              <p className="max-w-[42ch] text-[15px] text-muted-foreground">
                Aún no hay comentarios atribuidos a un reel. En cuanto ManyChat avise de los comentarios,
                cada reel aparecerá aquí como una fila con su propio embudo.
              </p>
            </div>
          ) : (
            <>
              {/* TELEFONO: una ficha por reel. Una tabla de seis columnas no se
                  encoge a 375 puntos, se rehace. */}
              <ul className="flex flex-col gap-2 md:hidden">
                {perReel.map((r) => (
                  <li key={r.reel} className="rounded-lg border border-border p-3">
                    <div className="truncate text-[15px] font-medium text-foreground">{reelLabel(r.reel)}</div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Comentaron</dt>
                        <dd className="tabular-nums text-foreground">{fmt(r.comentaron)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Se apuntaron</dt>
                        <dd className="tabular-nums text-foreground">{fmt(r.leads)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Agendaron</dt>
                        <dd className="tabular-nums text-foreground">{fmt(r.agendaron)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Alumnos</dt>
                        <dd className="font-semibold tabular-nums text-primary">{fmt(r.alumnos)}</dd>
                      </div>
                      <div className="col-span-2 flex items-center justify-between gap-2 border-t border-border pt-1.5">
                        <dt className="text-muted-foreground">Facturado</dt>
                        <dd className="font-semibold tabular-nums text-primary">{eur(r.ingresos)}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>

              {/* MONITOR: la tabla de columnas, con su propio desplazamiento */}
              <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left">
                      {['Reel', 'Comentaron', 'Se apuntaron', 'Agendaron', 'Alumnos', 'Facturado'].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            'px-3 py-2 text-sm font-semibold text-muted-foreground',
                            i === 0 ? '' : 'text-right'
                          )}
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
                        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmt(r.comentaron)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmt(r.leads)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{fmt(r.agendaron)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-primary">
                          {fmt(r.alumnos)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-primary">
                          {eur(r.ingresos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
