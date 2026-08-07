"use client"

import { useMemo, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * Lo que va pasando dentro del sistema, en orden.
 *
 * Marco, 2026-08-07: *"quiero que se siga quedando todo lo que va sucediendo dentro
 * de nuestro sistema. Los leads que van entrando los podemos ver aqui registrados a
 * la hora exacta y por donde entraron"*.
 *
 * Por eso, frente a la version anterior:
 *  - se escribe la HORA EXACTA (14:32), no solo "hace 3 h"
 *  - se escribe POR DONDE entro (el origen), y si no lo hay se dice "origen sin
 *    registrar" en vez de callarlo, que es informacion util: alguien entro sin
 *    que sepamos de donde
 *  - se agrupa por dia con su cabecera pegajosa, para que se pueda recorrer hacia
 *    atras sin perder de vista en que dia estas
 *  - se ve la lista entera del periodo, no solo los siete ultimos
 */

export type ActividadContacto = {
  id: string
  full_name: string | null
  stage: string
  origin: string | null
  created_at: string
}

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function hora(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function claveDia(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** "Hoy", "Ayer", o "lunes 4 de agosto". Nunca una fecha en formato tecnico. */
function tituloDia(iso: string): string {
  const d = new Date(iso)
  const hoy = new Date()
  const ayer = new Date(hoy.getTime() - 86400000)
  if (claveDia(iso) === claveDia(hoy.toISOString())) return "Hoy"
  if (claveDia(iso) === claveDia(ayer.toISOString())) return "Ayer"
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

/** Cuanto hace, en palabras. Acompana a la hora exacta, no la sustituye. */
function haceCuanto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return "ahora mismo"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? "hace 1 dia" : `hace ${d} dias`
}

const CUANTOS_DE_ENTRADA = 12

export function DashboardActivity({
  contactos,
  etiquetaDeStage,
  cargando,
}: {
  contactos: ActividadContacto[]
  etiquetaDeStage: (stage: string) => string
  cargando: boolean
}) {
  const [verTodo, setVerTodo] = useState(false)

  // Se agrupa por dia una sola vez, no en cada pintado.
  const porDia = useMemo(() => {
    const visibles = verTodo ? contactos : contactos.slice(0, CUANTOS_DE_ENTRADA)
    const grupos: { dia: string; titulo: string; items: ActividadContacto[] }[] = []
    for (const c of visibles) {
      const k = claveDia(c.created_at)
      const ultimo = grupos[grupos.length - 1]
      if (ultimo && ultimo.dia === k) ultimo.items.push(c)
      else grupos.push({ dia: k, titulo: tituloDia(c.created_at), items: [c] })
    }
    return grupos
  }, [contactos, verTodo])

  if (cargando) {
    return (
      <div className="min-h-[180px] rounded-xl border border-border bg-card">
        <Cabecera total={null} />
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      </div>
    )
  }

  if (contactos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <Cabecera total={0} />
        <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <p className="text-base text-muted-foreground">
            En este periodo no ha entrado nadie todavia.
          </p>
          <Link
            href="/webs"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Ver por donde entran los leads
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    )
  }

  const quedan = contactos.length - CUANTOS_DE_ENTRADA

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Cabecera total={contactos.length} />

      <div>
        {porDia.map((grupo) => (
          <div key={grupo.dia}>
            <div className="sticky top-0 z-10 border-y border-border bg-popover px-4 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur md:px-5">
              {grupo.titulo}
            </div>
            <ul>
              {grupo.items.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 md:px-5"
                >
                  {/* La hora exacta es lo primero: es lo que Marco pidio ver. */}
                  <span className="w-11 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-foreground">
                    {hora(c.created_at)}
                  </span>
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base text-foreground">
                      {c.full_name?.trim() || "Contacto sin nombre"}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      <span className="rounded-lg border border-border px-1.5 py-0.5">
                        {etiquetaDeStage(c.stage)}
                      </span>
                      <span
                        className={cn(
                          "truncate",
                          !c.origin && "italic"
                        )}
                      >
                        {c.origin ? `entro por ${c.origin}` : "origen sin registrar"}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 pt-0.5 text-sm tabular-nums text-muted-foreground">
                    {haceCuanto(c.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!verTodo && quedan > 0 && (
        <button
          type="button"
          onClick={() => setVerTodo(true)}
          className="min-h-11 w-full border-t border-border text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Ver los {quedan} restantes
        </button>
      )}
    </div>
  )
}

function Cabecera({ total }: { total: number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 md:px-5">
      <h2 className="font-heading text-base font-extrabold text-foreground">
        Lo que va pasando
      </h2>
      {total !== null && (
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {total === 1 ? "1 entrada" : `${total} entradas`}
        </span>
      )}
    </div>
  )
}
