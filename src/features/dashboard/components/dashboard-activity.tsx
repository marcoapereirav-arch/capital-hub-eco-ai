"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowUpRight, X } from "lucide-react"
import Link from "next/link"
import { ListaPaginada } from "@/components/ui/lista-paginada"
import { cn } from "@/lib/utils"

/**
 * Lo que va pasando dentro del sistema, en orden.
 *
 * Marco, 2026-08-07: *"quiero que se siga quedando todo lo que va sucediendo dentro
 * de nuestro sistema. Los leads que van entrando los podemos ver aqui registrados a
 * la hora exacta y por donde entraron"*. Y despues: *"no quiero una lista enorme...
 * tienen que estar los ultimos diez. Despues, si quiero ver mas, le puedo clicar y
 * veo una ventana con todos, de 20 en 20"*.
 *
 * Por eso:
 *  - en el panel se ven los DIEZ ultimos y punto
 *  - "Ver todo" abre una ventana con el historial entero, de 20 en 20, usando
 *    <ListaPaginada>, que es donde vive el limite de 20 de todo el OS
 *  - se escribe la HORA EXACTA (14:32), no solo "hace 3 h"
 *  - se escribe POR DONDE entro, y si no consta se dice "origen sin registrar" en
 *    vez de callarlo: que alguien entre sin saber de donde es informacion util
 */

export type ActividadContacto = {
  id: string
  full_name: string | null
  stage: string
  origin: string | null
  created_at: string
}

/** Lo que se ve en el panel sin abrir nada. */
const EN_EL_PANEL = 10

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

/** "Hoy", "Ayer", o "lunes 4 de ago". Nunca una fecha en formato tecnico. */
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

type Grupo = { dia: string; titulo: string; items: ActividadContacto[] }

function agrupaPorDia(items: ActividadContacto[]): Grupo[] {
  const grupos: Grupo[] = []
  for (const c of items) {
    const k = claveDia(c.created_at)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.dia === k) ultimo.items.push(c)
    else grupos.push({ dia: k, titulo: tituloDia(c.created_at), items: [c] })
  }
  return grupos
}

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

  const ultimos = useMemo(() => contactos.slice(0, EN_EL_PANEL), [contactos])
  const gruposPanel = useMemo(() => agrupaPorDia(ultimos), [ultimos])

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

  const quedan = contactos.length - EN_EL_PANEL

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Cabecera total={contactos.length} />
        <Grupos grupos={gruposPanel} etiquetaDeStage={etiquetaDeStage} />

        {quedan > 0 && (
          <button
            type="button"
            onClick={() => setVerTodo(true)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 border-t border-border text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Ver el historial completo
            <span className="tabular-nums text-muted-foreground">({quedan} mas)</span>
          </button>
        )}
      </div>

      {verTodo && (
        <VentanaHistorial
          contactos={contactos}
          etiquetaDeStage={etiquetaDeStage}
          onClose={() => setVerTodo(false)}
        />
      )}
    </>
  )
}

/**
 * El historial entero, de 20 en 20. Se pinta con un portal al body: si un padre
 * tuviera desenfoque o transform, una ventana `fixed` se encogeria en una esquina
 * en vez de cubrir la pantalla (SOP 47, causa raiz 3).
 */
function VentanaHistorial({
  contactos,
  etiquetaDeStage,
  onClose,
}: {
  contactos: ActividadContacto[]
  etiquetaDeStage: (stage: string) => string
  onClose: () => void
}) {
  const contenido = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Historial completo"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex w-full min-h-0 flex-col overflow-hidden rounded-t-xl border border-border bg-card",
          "max-h-[88dvh] md:max-h-[80dvh] md:max-w-2xl md:rounded-xl"
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-extrabold text-foreground">
              Lo que va pasando
            </h2>
            <p className="text-sm tabular-nums text-muted-foreground">
              {contactos.length} {contactos.length === 1 ? "entrada" : "entradas"} en el periodo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* El limite de 20 por pagina vive dentro de <ListaPaginada>, no aqui. */}
        <ListaPaginada
          items={contactos}
          nombreSingular="entrada"
          nombrePlural="entradas"
          className="min-h-0 flex-1"
          // Ventana de alto fijo: aqui la lista SI se desplaza por dentro.
          propioScroll
        >
          {(pagina) => (
            <Grupos grupos={agrupaPorDia(pagina)} etiquetaDeStage={etiquetaDeStage} />
          )}
        </ListaPaginada>
      </div>
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(contenido, document.body)
}

function Grupos({
  grupos,
  etiquetaDeStage,
}: {
  grupos: Grupo[]
  etiquetaDeStage: (stage: string) => string
}) {
  return (
    <div>
      {grupos.map((grupo) => (
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
                {/* La hora exacta va primero: es lo que Marco pidio ver. */}
                <span className="w-11 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-foreground">
                  {hora(c.created_at)}
                </span>
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base text-foreground">
                    {c.full_name?.trim() || "Contacto sin nombre"}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="rounded-lg border border-border px-1.5 py-0.5">
                      {etiquetaDeStage(c.stage)}
                    </span>
                    <span className={cn("truncate", !c.origin && "italic")}>
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
