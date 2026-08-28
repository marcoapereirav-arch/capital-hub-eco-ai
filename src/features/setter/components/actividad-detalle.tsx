"use client"

import { Pencil, Plus } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { CAMPOS_PARTE, type DiaHistorial, type LineaHistorial } from "../types"
import { fechaLarga, fechaYHora, plural } from "../formato"

/**
 * La ficha de UN dia: los cuatro numeros y, debajo, la linea de tiempo completa de todo
 * lo que se guardo ese dia. Es la respuesta a "quien registro, quien edito y a que hora".
 *
 * En telefono entra desde abajo y en ordenador es un cajon por la derecha. El lado se
 * decide con CLASES, nunca con JavaScript: `useIsMobile` miente en el primer pintado y la
 * hoja saltaria de sitio a la vista del usuario.
 */

const NOMBRE_CAMPO: Record<string, string> = Object.fromEntries(
  CAMPOS_PARTE.map((c) => [c.clave, c.corto]),
)

function tituloLinea(linea: LineaHistorial): string {
  if (linea.accion === "creado") return `${linea.actor ?? "Alguien del equipo"} lo registró`
  if (linea.accion === "editado") return `${linea.actor ?? "Alguien del equipo"} lo corrigió`
  return `${linea.actor ?? "Alguien del equipo"} lo registró`
}

export function ActividadDetalle({
  dia,
  puedeEditar,
  onCerrar,
  onEditar,
}: {
  dia: DiaHistorial | null
  puedeEditar: boolean
  onCerrar: () => void
  onEditar: (dia: DiaHistorial) => void
}) {
  return (
    <Sheet open={Boolean(dia)} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <SheetContent
        side="bottom"
        className={cn(
          "w-full rounded-t-xl",
          /* En ordenador es un cajon por la DERECHA. El `!` no es capricho: las clases
             base de la hoja van con el selector `data-[side=bottom]:`, que pesa mas que
             un `md:`, asi que sin el la hoja se pegaba a la IZQUIERDA de la pantalla.
             Medido en el navegador el 2026-08-29. Tailwind 4 pone el `!` al final. */
          "md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-[460px] md:max-w-[460px] md:rounded-l-xl md:rounded-tr-none md:border-l",
        )}
      >
        {/* La agarradera es lo que hace que se lea como hoja y no como un fallo. */}
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />

        {dia && (
          <>
            <SheetHeader className="px-4 md:px-5">
              <SheetTitle className="text-[17px] font-bold text-foreground first-letter:uppercase">
                {fechaLarga(dia.fecha)}
              </SheetTitle>
              <SheetDescription className="text-[15px] text-muted-foreground">
                Parte de {dia.persona}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-4 md:px-5">
              {/* Los cuatro numeros. Siempre los cuatro, aunque el dia no tenga parte. */}
              <div className="grid grid-cols-2 gap-2">
                {CAMPOS_PARTE.map((c) => (
                  <div key={c.clave} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-sm text-muted-foreground">{c.corto}</p>
                    <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
                      {dia.registrado ? dia[c.clave] : "-"}
                    </p>
                  </div>
                ))}
              </div>

              {dia.registrado ? (
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">Todo lo que pasó ese día</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {plural(dia.lineas.length, "guardado", "guardados")}
                    {dia.correcciones > 0 ? `, ${plural(dia.correcciones, "corrección", "correcciones")}` : ", sin correcciones"}
                  </p>

                  <ol className="mt-3 space-y-3">
                    {dia.lineas.map((linea, i) => (
                      <li key={`${linea.cuando}-${i}`} className="flex gap-3">
                        {/* El hilo de la linea de tiempo. */}
                        <div className="flex flex-col items-center pt-1.5">
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              linea.accion === "editado" ? "bg-primary" : "bg-muted-foreground",
                            )}
                          />
                          {i < dia.lineas.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                        </div>

                        <div className="min-w-0 flex-1 pb-1">
                          <p className="flex flex-wrap items-baseline gap-x-2 text-[15px] text-foreground">
                            <span className="font-semibold">{tituloLinea(linea)}</span>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {fechaYHora(linea.cuando)}
                            </span>
                          </p>

                          {linea.accion === "creado" || linea.accion === "reconstruido" ? (
                            <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                              {CAMPOS_PARTE.map((c) => `${linea.valores[c.clave]} ${c.corto.toLowerCase()}`).join(" · ")}
                            </p>
                          ) : null}

                          {linea.cambios.length > 0 && linea.accion === "editado" && (
                            <ul className="mt-1 space-y-0.5">
                              {linea.cambios.map((c) => (
                                <li key={c.campo} className="text-sm text-muted-foreground">
                                  <span className="text-foreground">{NOMBRE_CAMPO[c.campo] ?? c.campo}</span>: de{" "}
                                  <span className="tabular-nums">{c.antes ?? 0}</span> a{" "}
                                  <span className="font-semibold tabular-nums text-foreground">{c.despues ?? 0}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {linea.accion === "reconstruido" && linea.cambios.length === 0 && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Se corrigió, pero esto pasó antes de que existiera el historial: los valores de
                              antes no quedaron guardados en ningún sitio.
                            </p>
                          )}

                          {linea.accion === "reconstruido" && linea.cambios.length > 0 && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Línea rellenada hacia atrás: el parte es anterior al historial.
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="text-[15px] font-semibold text-foreground">Nadie registró actividad ese día</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No es un cero: es que no se rellenó el parte. Se puede rellenar ahora mismo.
                  </p>
                </div>
              )}

              {puedeEditar && (
                <button
                  type="button"
                  onClick={() => onEditar(dia)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-transform active:translate-y-px md:h-10"
                >
                  {dia.registrado ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                  {dia.registrado ? "Corregir este día" : "Registrar este día"}
                </button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
