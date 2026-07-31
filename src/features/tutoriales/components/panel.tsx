"use client"

import { useEffect, useState } from "react"
import { X, AlertTriangle, Folder, Home, ChevronRight } from "lucide-react"
import type { Carpeta } from "../types"

/** Marco propio para todos los paneles: mismo aspecto, hoja inferior en movil. */
function Marco({
  titulo, pie, onCerrar, children,
}: { titulo: string; pie?: string; onCerrar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && onCerrar()
    window.addEventListener("keydown", alPulsar)
    const previo = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", alPulsar)
      document.body.style.overflow = previo
    }
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F0F12]/90 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onCerrar}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-lg border border-[#2A2D34] bg-[#15161A] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2A2D34] p-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">{titulo}</h2>
            {pie ? <p className="mt-0.5 truncate text-xs text-white/50">{pie}</p> : null}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg border border-white/10 p-1.5 text-white/60 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">{children}</div>
      </div>
    </div>
  )
}

const INPUT =
  "w-full rounded-lg border border-[#2A2D34] bg-[#0F0F12] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#22C55E]/60 focus:outline-none"
const VERDE =
  "flex-1 rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-[#0F0F12] transition hover:bg-[#4ADE80] disabled:cursor-not-allowed disabled:opacity-35"
const GRIS =
  "flex-1 rounded-lg border border-[#2A2D34] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:text-white"

/** Crear una carpeta, o renombrar una que ya existe. */
export function PanelNombre({
  titulo, pie, valorInicial = "", etiqueta, accion, onGuardar, onCerrar,
}: {
  titulo: string
  pie?: string
  valorInicial?: string
  etiqueta: string
  accion: string
  onGuardar: (nombre: string) => Promise<string | null>
  onCerrar: () => void
}) {
  const [valor, setValor] = useState(valorInicial)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    if (!valor.trim()) return
    setGuardando(true)
    setError(null)
    const fallo = await onGuardar(valor.trim())
    setGuardando(false)
    if (fallo) setError(fallo)
    else onCerrar()
  }

  return (
    <Marco titulo={titulo} pie={pie} onCerrar={onCerrar}>
      <div>
        <label htmlFor="nombre-panel" className="mb-1.5 block text-xs font-medium text-white/70">{etiqueta}</label>
        <input
          id="nombre-panel"
          autoFocus
          value={valor}
          onChange={(e) => { setValor(e.target.value); setError(null) }}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
          placeholder="Closers"
          className={INPUT}
        />
      </div>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      <div className="flex gap-2">
        <button type="button" onClick={onCerrar} className={GRIS}>Cancelar</button>
        <button type="button" onClick={guardar} disabled={!valor.trim() || guardando} className={VERDE}>
          {guardando ? "Guardando…" : accion}
        </button>
      </div>
    </Marco>
  )
}

/** Elegir a que carpeta se mueve algo. Lista con sangria, como un arbol. */
export function PanelMover({
  titulo, carpetas, actual, prohibidas, onMover, onCerrar,
}: {
  titulo: string
  carpetas: Carpeta[]
  /** Donde esta ahora, para marcarlo y no dejar moverlo al mismo sitio. */
  actual: string | null
  /** Ids a los que NO se puede mover (ella misma y sus descendientes). */
  prohibidas: Set<string>
  onMover: (destino: string | null) => Promise<string | null>
  onCerrar: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [moviendo, setMoviendo] = useState(false)

  // El arbol aplanado, con su profundidad, para pintarlo con sangria.
  const filas: { carpeta: Carpeta; nivel: number }[] = []
  const bajar = (padre: string | null, nivel: number) => {
    for (const c of carpetas.filter((x) => x.parent_id === padre)) {
      filas.push({ carpeta: c, nivel })
      if (nivel < 20) bajar(c.id, nivel + 1)
    }
  }
  bajar(null, 0)

  async function mover(destino: string | null) {
    setMoviendo(true)
    setError(null)
    const fallo = await onMover(destino)
    setMoviendo(false)
    if (fallo) setError(fallo)
    else onCerrar()
  }

  return (
    <Marco titulo={titulo} pie="Elige dónde quieres ponerlo" onCerrar={onCerrar}>
      <div className="max-h-72 space-y-1 overflow-y-auto">
        <button
          type="button"
          disabled={actual === null || moviendo}
          onClick={() => mover(null)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/5 disabled:opacity-35 disabled:hover:bg-transparent"
        >
          <Home className="h-4 w-4 shrink-0 text-[#4ADE80]" />
          Tutoriales (principal)
          {actual === null ? <span className="ml-auto text-xs text-white/40">Está aquí</span> : null}
        </button>

        {filas.map(({ carpeta, nivel }) => {
          const vetada = prohibidas.has(carpeta.id)
          const esActual = actual === carpeta.id
          return (
            <button
              key={carpeta.id}
              type="button"
              disabled={vetada || esActual || moviendo}
              onClick={() => mover(carpeta.id)}
              style={{ paddingLeft: `${12 + nivel * 18}px` }}
              className="flex w-full items-center gap-2 rounded-lg py-2.5 pr-3 text-left text-sm text-white transition hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              {nivel > 0 ? <ChevronRight className="h-3 w-3 shrink-0 text-white/25" /> : null}
              <Folder className="h-4 w-4 shrink-0 text-[#4ADE80]" />
              <span className="truncate">{carpeta.nombre}</span>
              {esActual ? <span className="ml-auto shrink-0 text-xs text-white/40">Está aquí</span> : null}
              {vetada && !esActual ? <span className="ml-auto shrink-0 text-xs text-white/40">No se puede</span> : null}
            </button>
          )
        })}
      </div>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      <button type="button" onClick={onCerrar} className={`${GRIS} w-full`}>Cancelar</button>
    </Marco>
  )
}

/**
 * Borrar. Si dentro hay algo, obliga a escribir el nombre.
 *
 * Un `confirm` del navegador es UN toque en el movil, y un borrado se lleva por
 * delante todas las subcarpetas y todos sus videos, tambien los de Bunny. No
 * hay papelera: escribir el nombre es lo que separa un descuido de una perdida.
 */
export function PanelBorrar({
  nombre, dentro, onBorrar, onCerrar,
}: {
  nombre: string
  dentro: { carpetas: number; videos: number } | null
  onBorrar: () => Promise<string | null>
  onCerrar: () => void
}) {
  const [escrito, setEscrito] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [borrando, setBorrando] = useState(false)

  const tieneCosas = Boolean(dentro && (dentro.carpetas > 0 || dentro.videos > 0))
  const listas = dentro
    ? [
        dentro.carpetas > 0 ? `${dentro.carpetas} ${dentro.carpetas === 1 ? "carpeta" : "carpetas"}` : null,
        dentro.videos > 0 ? `${dentro.videos} ${dentro.videos === 1 ? "vídeo" : "vídeos"}` : null,
      ].filter(Boolean).join(" y ")
    : ""

  const puede = !borrando && (!tieneCosas || escrito.trim().toLowerCase() === nombre.trim().toLowerCase())

  async function borrar() {
    setBorrando(true)
    setError(null)
    const fallo = await onBorrar()
    setBorrando(false)
    if (fallo) setError(fallo)
    else onCerrar()
  }

  return (
    <Marco titulo={tieneCosas ? "Borrar la carpeta y todo lo de dentro" : "Borrar"} onCerrar={onCerrar}>
      <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.06] p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        <p className="text-xs leading-relaxed text-red-200">
          {tieneCosas
            ? `Dentro de "${nombre}" hay ${listas}. Se borra todo, incluidos los vídeos subidos. No se puede recuperar.`
            : `Vas a borrar "${nombre}". No se puede recuperar.`}
        </p>
      </div>

      {tieneCosas ? (
        <div>
          <label htmlFor="confirmar" className="mb-1.5 block text-xs font-medium text-white/70">
            Escribe el nombre de la carpeta para confirmar
          </label>
          <input
            id="confirmar"
            autoFocus
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            placeholder={nombre}
            className={INPUT}
          />
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      <div className="flex gap-2">
        <button type="button" onClick={onCerrar} className={GRIS}>Cancelar</button>
        <button
          type="button"
          onClick={borrar}
          disabled={!puede}
          className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {borrando ? "Borrando…" : tieneCosas ? "Borrar todo" : "Borrar"}
        </button>
      </div>
    </Marco>
  )
}
