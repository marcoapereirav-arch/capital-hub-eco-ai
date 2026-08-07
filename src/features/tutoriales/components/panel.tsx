"use client"

import { useState } from "react"
import { AlertTriangle, Folder, Home, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Carpeta } from "../types"

/**
 * Marco propio para todos los paneles: hoja inferior en telefono, cajon por la
 * derecha en escritorio. El lado va FIJO (`side="bottom"`) y el escritorio se
 * resuelve con clases `md:`, nunca con JavaScript: `useIsMobile()` devuelve
 * false hasta que monta, asi que decidirlo en JS pinta primero el diseno
 * equivocado y luego salta.
 *
 * Antes era una ventana a mano con `fixed inset-0`: al escribir, el teclado del
 * telefono tapaba el campo y el boton de guardar.
 */
function Marco({
  titulo, pie, onCerrar, children,
}: { titulo: string; pie?: string; onCerrar: () => void; children: React.ReactNode }) {
  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar()
      }}
    >
      <SheetContent
        side="bottom"
        // Sin pie no hay descripcion que pintar, y hay que decirselo a la ventana:
        // si no, avisa por consola de que le falta. No se inventa texto nuevo.
        {...(pie ? {} : { "aria-describedby": undefined })}
        className={cn(
          "rounded-t-xl",
          // Se repite la condicion del lado porque las clases del kit (`data-[side=bottom]:...`)
          // pesan mas que un `md:` suelto; sin repetirla el cajon sale por la izquierda.
          "md:data-[side=bottom]:inset-y-0 md:right-0 md:data-[side=bottom]:left-auto md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none md:w-full md:max-w-md md:border-l md:pb-0",
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold">{titulo}</SheetTitle>
          {pie ? <SheetDescription className="truncate">{pie}</SheetDescription> : null}
        </SheetHeader>
        <div className="space-y-4 px-4 pb-safe-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

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
        <label htmlFor="nombre-panel" className="mb-1.5 block text-[15px] font-medium text-muted-foreground">
          {etiqueta}
        </label>
        <Input
          id="nombre-panel"
          autoFocus
          value={valor}
          onChange={(e) => { setValor(e.target.value); setError(null) }}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
          enterKeyHint="done"
          placeholder="Closers"
          className="bg-background"
        />
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCerrar} className="flex-1">Cancelar</Button>
        <Button onClick={guardar} disabled={!valor.trim() || guardando} className="flex-1">
          {guardando ? "Guardando…" : accion}
        </Button>
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
      <div className="max-h-72 space-y-1 overflow-y-auto no-overscroll">
        <button
          type="button"
          disabled={actual === null || moviendo}
          onClick={() => mover(null)}
          className="flex min-h-12 w-full items-center gap-2 rounded-lg px-3 text-left text-[15px] text-foreground transition-colors active:bg-muted disabled:opacity-40"
        >
          <Home className="h-4 w-4 shrink-0 text-primary" />
          Tutoriales (principal)
          {actual === null ? <span className="ml-auto text-sm text-muted-foreground">Está aquí</span> : null}
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
              className="flex min-h-12 w-full items-center gap-2 rounded-lg pr-3 text-left text-[15px] text-foreground transition-colors active:bg-muted disabled:opacity-40"
            >
              {nivel > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
              <Folder className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{carpeta.nombre}</span>
              {esActual ? <span className="ml-auto shrink-0 text-sm text-muted-foreground">Está aquí</span> : null}
              {vetada && !esActual ? <span className="ml-auto shrink-0 text-sm text-muted-foreground">No se puede</span> : null}
            </button>
          )
        })}
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button variant="secondary" onClick={onCerrar} className="w-full">Cancelar</Button>
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
      <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <p className="text-sm leading-relaxed text-destructive">
          {tieneCosas
            ? `Dentro de "${nombre}" hay ${listas}. Se borra todo, incluidos los vídeos subidos. No se puede recuperar.`
            : `Vas a borrar "${nombre}". No se puede recuperar.`}
        </p>
      </div>

      {tieneCosas ? (
        <div>
          <label htmlFor="confirmar" className="mb-1.5 block text-[15px] font-medium text-muted-foreground">
            Escribe el nombre de la carpeta para confirmar
          </label>
          <Input
            id="confirmar"
            autoFocus
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            enterKeyHint="done"
            placeholder={nombre}
            className="bg-background"
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCerrar} className="flex-1">Cancelar</Button>
        <Button variant="destructive" onClick={borrar} disabled={!puede} className="flex-1">
          {borrando ? "Borrando…" : tieneCosas ? "Borrar todo" : "Borrar"}
        </Button>
      </div>
    </Marco>
  )
}
