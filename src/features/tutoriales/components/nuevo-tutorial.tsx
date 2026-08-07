"use client"

import { useEffect, useRef, useState } from "react"
import * as tus from "tus-js-client"
import { Upload, Link2, AlertCircle, Check } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { duracionLegible, esLoomValido, type DatosLoom } from "../types"

type Props = {
  carpetaId: string
  carpetaNombre: string
  onListo: () => void
  onCerrar: () => void
}

type Modo = "archivo" | "loom"

/**
 * Añadir un tutorial: subiendo el archivo, o pegando un link de Loom.
 *
 * Con archivo, el navegador manda el vídeo DIRECTO a Bunny (protocolo TUS), sin
 * pasar por el OS: por eso no hay limite de tamaño y una subida cortada se
 * reanuda sola. El OS solo da el permiso y guarda la ficha.
 *
 * Hoja inferior en telefono, cajon por la derecha en escritorio: el lado va FIJO
 * y la accion principal queda pegada abajo DENTRO de la hoja, para que el
 * teclado no la tape.
 */
export function NuevoTutorial({ carpetaId, carpetaNombre, onListo, onCerrar }: Props) {
  const [modo, setModo] = useState<Modo>("archivo")
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [loomUrl, setLoomUrl] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [progreso, setProgreso] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [loomDatos, setLoomDatos] = useState<DatosLoom | null>(null)
  const [consultandoLoom, setConsultandoLoom] = useState(false)
  const inputArchivo = useRef<HTMLInputElement>(null)

  /* Al pegar un Loom valido, se le pregunta a Loom por el video y se rellena
   * solo: titulo, duracion y portada. Marco pega y ya esta.
   *
   * Si Loom no contesta no pasa nada: se guarda igual y el titulo se escribe a
   * mano. Un adorno no puede impedir guardar. */
  useEffect(() => {
    if (modo !== "loom" || !esLoomValido(loomUrl)) {
      setLoomDatos(null)
      return
    }
    let vigente = true
    setConsultandoLoom(true)
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/tutoriales/loom?url=${encodeURIComponent(loomUrl.trim())}`).then((x) => x.json())
        if (!vigente) return
        setLoomDatos(r.datos ?? null)
        if (r.datos?.titulo) setTitulo((actual) => actual.trim() || r.datos.titulo)
      } finally {
        if (vigente) setConsultandoLoom(false)
      }
    }, 500)
    return () => {
      vigente = false
      window.clearTimeout(t)
    }
  }, [modo, loomUrl])

  const tituloEfectivo = titulo.trim() || archivo?.name.replace(/\.[^.]+$/, "") || ""
  const puedeGuardar =
    !guardando &&
    tituloEfectivo.length > 0 &&
    (modo === "archivo" ? Boolean(archivo) : esLoomValido(loomUrl))

  async function guardar() {
    setError(null)
    setGuardando(true)

    try {
      if (modo === "loom") {
        await crearFicha({
          fuente: "loom",
          loom_url: loomUrl.trim(),
          ...(loomDatos?.duracion_seg ? { duracion_seg: loomDatos.duracion_seg } : {}),
          ...(loomDatos?.miniatura ? { miniatura: loomDatos.miniatura } : {}),
        })
        onListo()
        return
      }

      if (!archivo) return

      // 1. Pedimos el hueco en Bunny, dentro de "Tutoriales OS".
      const permiso = await fetch("/api/tutoriales/subida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: tituloEfectivo }),
      }).then((r) => r.json())

      if (permiso.error) throw new Error(permiso.error)

      // 2. El archivo va directo a Bunny.
      setProgreso(0)
      await subirABunny(archivo, permiso, setProgreso)

      // 3. Y se guarda la ficha, en borrador hasta que Marco la publique.
      await crearFicha({ fuente: "bunny", bunny_video_id: permiso.videoId })
      onListo()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.")
      setProgreso(null)
    } finally {
      setGuardando(false)
    }
  }

  async function crearFicha(extra: Record<string, string | number>) {
    const res = await fetch("/api/tutoriales/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder_id: carpetaId,
        titulo: tituloEfectivo,
        descripcion: descripcion.trim() || undefined,
        ...extra,
      }),
    }).then((r) => r.json())
    if (res.error) throw new Error(res.error)
  }

  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto && !guardando) onCerrar()
      }}
    >
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-xl",
          // Se repite la condicion del lado porque las clases del kit (`data-[side=bottom]:...`)
          // pesan mas que un `md:` suelto; sin repetirla el cajon sale por la izquierda.
          "md:data-[side=bottom]:inset-y-0 md:right-0 md:data-[side=bottom]:left-auto md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none md:w-full md:max-w-lg md:border-l md:pb-0",
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold">Añadir un tutorial</SheetTitle>
          <SheetDescription>En la carpeta {carpetaNombre}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-4">
          {/* Las dos formas de meter el vídeo. */}
          <div className="grid grid-cols-2 gap-2">
            <BotonModo activo={modo === "archivo"} onClick={() => setModo("archivo")} icon={Upload} titulo="Subir vídeo" pie="Se guarda en Bunny" />
            <BotonModo activo={modo === "loom"} onClick={() => setModo("loom")} icon={Link2} titulo="Link de Loom" pie="Sin subir nada" />
          </div>

          {modo === "archivo" ? (
            <div>
              <input
                ref={inputArchivo}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  setArchivo(e.target.files?.[0] ?? null)
                  setError(null)
                }}
              />
              <button
                type="button"
                onClick={() => inputArchivo.current?.click()}
                disabled={guardando}
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors active:bg-muted disabled:opacity-50 md:hover:border-primary/50"
              >
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-[15px] font-medium text-foreground">
                  {archivo ? archivo.name : "Elige el archivo de vídeo"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {archivo ? `${(archivo.size / 1024 / 1024).toFixed(0)} MB` : "Sin límite de tamaño"}
                </span>
              </button>
            </div>
          ) : (
            <div>
              <label htmlFor="loom" className="mb-1.5 block text-[15px] font-medium text-muted-foreground">
                Pega aquí el link de Loom
              </label>
              <Input
                id="loom"
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={loomUrl}
                onChange={(e) => {
                  setLoomUrl(e.target.value)
                  setError(null)
                }}
                placeholder="https://www.loom.com/share/..."
                className="bg-background"
              />
              {loomUrl && !esLoomValido(loomUrl) ? (
                <p className="mt-1.5 text-sm text-warn">
                  Ese link no parece de Loom. Copia el de compartir, el que empieza por loom.com/share.
                </p>
              ) : null}

              {consultandoLoom ? (
                <p className="mt-2 text-sm text-muted-foreground">Leyendo el vídeo en Loom…</p>
              ) : null}

              {/* Se enseña lo que Loom devolvio: asi Marco ve que reconocio el
                  video antes de guardar, en vez de darle a Añadir a ciegas. */}
              {loomDatos?.titulo ? (
                <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/10 p-2.5">
                  {loomDatos.miniatura ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={loomDatos.miniatura} alt="" className="h-12 w-20 shrink-0 rounded-sm object-cover" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      <Check className="h-4 w-4" />
                      Vídeo encontrado
                    </p>
                    <p className="mt-0.5 truncate text-sm text-foreground">{loomDatos.titulo}</p>
                    {duracionLegible(loomDatos.duracion_seg) ? (
                      <p className="text-sm tabular-nums text-muted-foreground">{duracionLegible(loomDatos.duracion_seg)}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <Campo id="titulo" etiqueta="Título" valor={titulo} onChange={setTitulo} placeholder={archivo ? tituloEfectivo : "Cómo subir una formación"} />
          <Campo id="desc" etiqueta="Descripción (opcional)" valor={descripcion} onChange={setDescripcion} placeholder="Una línea explicando qué se ve" />

          {progreso !== null ? (
            <div>
              <div className="mb-1.5 flex justify-between text-sm text-muted-foreground">
                <span>Subiendo el vídeo</span>
                <span className="font-medium tabular-nums text-primary">{progreso}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progreso}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">No cierres esta ventana hasta que termine.</p>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm leading-relaxed text-destructive">{error}</p>
            </div>
          ) : null}

          <p className="text-center text-sm text-muted-foreground">
            Se guarda como borrador. Sale al equipo cuando le des a publicar.
          </p>
        </div>

        {/* Pegada abajo DENTRO de la hoja: con `fixed` el teclado la tapa. */}
        <div className="sticky bottom-0 z-10 flex gap-2 border-t border-border bg-popover px-4 py-3 pb-safe-4 md:pb-3">
          <Button variant="secondary" onClick={onCerrar} disabled={guardando} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!puedeGuardar} className="flex-1">
            {guardando ? "Guardando…" : "Añadir"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function BotonModo({
  activo, onClick, icon: Icon, titulo, pie,
}: { activo: boolean; onClick: () => void; icon: typeof Upload; titulo: string; pie: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "flex min-h-11 flex-col items-center gap-1.5 rounded-lg border px-3 py-3 transition-colors",
        activo ? "border-primary/60 bg-primary/10" : "border-border md:hover:border-primary/40",
      )}
    >
      <Icon className={cn("h-4 w-4", activo ? "text-primary" : "text-muted-foreground")} />
      <span className={cn("text-sm font-semibold", activo ? "text-foreground" : "text-muted-foreground")}>{titulo}</span>
      <span className="text-sm text-muted-foreground">{pie}</span>
    </button>
  )
}

function Campo({
  id, etiqueta, valor, onChange, placeholder,
}: { id: string; etiqueta: string; valor: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-medium text-muted-foreground">{etiqueta}</label>
      <Input
        id={id}
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        enterKeyHint="next"
        placeholder={placeholder}
        className="bg-background"
      />
    </div>
  )
}

/** La subida en si. Se resuelve cuando Bunny confirma que recibio el archivo. */
function subirABunny(
  archivo: File,
  permiso: { tusEndpoint: string; libraryId: string; videoId: string; authSignature: string; expirationTime: number },
  onProgreso: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const subida = new tus.Upload(archivo, {
      endpoint: permiso.tusEndpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        AuthorizationSignature: permiso.authSignature,
        AuthorizationExpire: String(permiso.expirationTime),
        VideoId: permiso.videoId,
        LibraryId: permiso.libraryId,
      },
      metadata: { filetype: archivo.type, title: archivo.name },
      onProgress: (subido, total) => onProgreso(Math.round((subido / total) * 100)),
      onSuccess: () => resolve(),
      onError: (e) => reject(new Error(`No se pudo subir el vídeo: ${e.message}`)),
    })
    subida.start()
  })
}
