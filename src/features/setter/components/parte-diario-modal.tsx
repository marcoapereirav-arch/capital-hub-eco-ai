"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * El parte diario. Cuatro numeros, hecho para el pulgar.
 *
 * UN DIA, UNA LINEA. Al abrirlo se busca el parte de esa persona para esa fecha:
 * si ya existe, los cuatro numeros salen YA ESCRITOS en las casillas y al
 * guardar se actualiza esa misma linea. Nunca se crea una segunda ni se suman
 * sin querer, y la pantalla lo dice en voz alta cuando estas corrigiendo uno.
 *
 * Sin avisos al movil: Marco los quito expresamente el 2026-08-07.
 */

type Parte = {
  conversaciones: number
  followups: number
  ofertas: number
  agendadas: number
}

const VACIO: Parte = { conversaciones: 0, followups: 0, ofertas: 0, agendadas: 0 }

const CAMPOS: { clave: keyof Parte; etiqueta: string; ayuda: string }[] = [
  { clave: "conversaciones", etiqueta: "Conversaciones nuevas abiertas", ayuda: "Gente con la que hablaste por primera vez" },
  { clave: "followups", etiqueta: "Follow-ups nuevos", ayuda: "Seguimientos que retomaste" },
  { clave: "ofertas", etiqueta: "Ofertas de llamada tiradas", ayuda: "Veces que ofreciste la llamada" },
  { clave: "agendadas", etiqueta: "Llamadas agendadas", ayuda: "Las que quedaron puestas en la agenda" },
]

function enElBody(nodo: React.ReactNode) {
  if (typeof document === "undefined") return null
  return createPortal(nodo, document.body)
}

function fechaLarga(iso: string) {
  const [a, m, d] = iso.split("-").map(Number)
  return new Date(a, m - 1, d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
}

export function ParteDiarioModal({ onClose }: { onClose: () => void }) {
  const [fecha, setFecha] = useState("")
  const [hoy, setHoy] = useState("")
  const [valores, setValores] = useState<Parte>(VACIO)
  const [yaExistia, setYaExistia] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  /* Mientras el modal esta abierto, la pagina de detras NO se mueve.
     Sin esto, al llegar al final de la lista el dedo sigue empujando y lo que
     baja es el dashboard: parece que el modal se ha ido. */
  useEffect(() => {
    const body = document.body
    const antes = body.style.overflow
    body.style.overflow = "hidden"
    return () => {
      body.style.overflow = antes
    }
  }, [])

  // Carga inicial: el parte de hoy, si lo hay.
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      setCargando(true)
      try {
        const res = await fetch("/api/setter/report")
        const d = await res.json()
        if (cancelado) return
        if (!res.ok) {
          setError(d.error ?? "No se pudo abrir tu parte")
          return
        }
        setHoy(d.hoy)
        setFecha(d.fecha)
        setValores(d.parte ?? VACIO)
        setYaExistia(Boolean(d.parte))
      } catch {
        if (!cancelado) setError("No se pudo conectar")
      } finally {
        if (!cancelado) setCargando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [])

  // Al cambiar de dia se trae el parte de ESE dia.
  async function cambiarFecha(nueva: string) {
    setFecha(nueva)
    setError(null)
    setGuardado(false)
    setCargando(true)
    try {
      const res = await fetch(`/api/setter/report?date=${nueva}`)
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? "No se pudo abrir ese día")
        return
      }
      setValores(d.parte ?? VACIO)
      setYaExistia(Boolean(d.parte))
    } finally {
      setCargando(false)
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      const res = await fetch("/api/setter/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: fecha, ...valores }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? "No se pudo guardar")
        return
      }
      setGuardado(true)
      setTimeout(onClose, 1100)
    } catch {
      setError("No se pudo conectar")
    } finally {
      setGuardando(false)
    }
  }

  if (guardado) {
    return enElBody(
      <div className="fixed inset-0 z-50 flex items-end justify-center overscroll-none bg-black/70 p-0 md:items-center md:p-4">
        <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-background p-6 text-center">
          <Check className="mx-auto h-12 w-12 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Actividad registrada</h2>
          <p className="text-[15px] text-muted-foreground">{fechaLarga(fecha)}</p>
        </div>
      </div>,
    )
  }

  return enElBody(
    <div className="fixed inset-0 z-50 flex items-end justify-center overscroll-none bg-black/70 p-0 md:items-center md:p-4">
      <form
        onSubmit={guardar}
        className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-xl border border-border bg-background md:max-h-[85dvh] md:rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Registrar actividad</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground md:size-9"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="no-overscroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
          <label className="block">
            <span className="text-sm font-medium text-muted-foreground">Día</span>
            <input
              type="date"
              value={fecha}
              max={hoy || undefined}
              onChange={(e) => cambiarFecha(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
            />
          </label>

          {/* Que quede claro cuando se esta CORRIGIENDO uno que ya existia. */}
          {yaExistia && !cargando && (
            <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              Estás corrigiendo el parte del {fechaLarga(fecha)}. Se actualiza el mismo, no se crea otro.
            </p>
          )}

          {CAMPOS.map((c) => (
              <label key={c.clave} className="block">
                <span className="text-[15px] font-medium text-foreground">{c.etiqueta}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{c.ayuda}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={valores[c.clave]}
                  onChange={(e) =>
                    setValores((v) => ({ ...v, [c.clave]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))
                  }
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-3 text-base tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  disabled={cargando}
                />
              </label>
          ))}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* `sticky` y no `fixed`: el desplazamiento real lo hace el div de arriba,
            y con `fixed` el teclado del telefono tapa el boton de guardar. */}
        <div className="sticky bottom-0 border-t border-border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="submit"
            disabled={guardando || cargando}
            className="h-11 w-full rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>,
  )
}
