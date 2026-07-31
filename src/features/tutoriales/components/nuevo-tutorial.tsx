"use client"

import { useEffect, useRef, useState } from "react"
import * as tus from "tus-js-client"
import { Upload, Link2, X, AlertCircle, Check } from "lucide-react"
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F0F12]/90 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Añadir un tutorial"
      onClick={guardando ? undefined : onCerrar}
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-[#2A2D34] bg-[#15161A] sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2A2D34] p-5">
          <div>
            <h2 className="text-base font-semibold text-white">Añadir un tutorial</h2>
            <p className="mt-0.5 text-xs text-white/50">En la carpeta {carpetaNombre}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="rounded-lg border border-white/10 p-1.5 text-white/60 transition hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
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
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-[#2A2D34] px-4 py-8 text-center transition hover:border-[#22C55E]/50 disabled:opacity-50"
              >
                <Upload className="h-6 w-6 text-[#4ADE80]" />
                <span className="text-sm font-medium text-white">
                  {archivo ? archivo.name : "Elige el archivo de vídeo"}
                </span>
                <span className="text-xs text-white/45">
                  {archivo ? `${(archivo.size / 1024 / 1024).toFixed(0)} MB` : "Sin límite de tamaño"}
                </span>
              </button>
            </div>
          ) : (
            <div>
              <label htmlFor="loom" className="mb-1.5 block text-xs font-medium text-white/70">
                Pega aquí el link de Loom
              </label>
              <input
                id="loom"
                type="url"
                value={loomUrl}
                onChange={(e) => {
                  setLoomUrl(e.target.value)
                  setError(null)
                }}
                placeholder="https://www.loom.com/share/..."
                className="w-full rounded-lg border border-[#2A2D34] bg-[#0F0F12] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#22C55E]/60 focus:outline-none"
              />
              {loomUrl && !esLoomValido(loomUrl) ? (
                <p className="mt-1.5 text-xs text-amber-400">
                  Ese link no parece de Loom. Copia el de compartir, el que empieza por loom.com/share.
                </p>
              ) : null}

              {consultandoLoom ? (
                <p className="mt-2 text-xs text-white/45">Leyendo el vídeo en Loom…</p>
              ) : null}

              {/* Se enseña lo que Loom devolvio: asi Marco ve que reconocio el
                  video antes de guardar, en vez de darle a Añadir a ciegas. */}
              {loomDatos?.titulo ? (
                <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/[0.06] p-2.5">
                  {loomDatos.miniatura ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={loomDatos.miniatura} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-[#4ADE80]">
                      <Check className="h-3.5 w-3.5" />
                      Vídeo encontrado
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white">{loomDatos.titulo}</p>
                    {duracionLegible(loomDatos.duracion_seg) ? (
                      <p className="text-xs text-white/45">{duracionLegible(loomDatos.duracion_seg)}</p>
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
              <div className="mb-1.5 flex justify-between text-xs text-white/60">
                <span>Subiendo el vídeo</span>
                <span className="font-medium text-[#4ADE80]">{progreso}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#2A2D34]">
                <div className="h-full rounded-full bg-[#22C55E] transition-all" style={{ width: `${progreso}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-white/45">No cierres esta ventana hasta que termine.</p>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.06] p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs leading-relaxed text-red-300">{error}</p>
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="flex-1 rounded-lg border border-[#2A2D34] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:text-white disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!puedeGuardar}
              className="flex-1 rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-[#0F0F12] transition hover:bg-[#4ADE80] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {guardando ? "Guardando…" : "Añadir"}
            </button>
          </div>

          <p className="text-center text-xs text-white/40">
            Se guarda como borrador. Sale al equipo cuando le des a publicar.
          </p>
        </div>
      </div>
    </div>
  )
}

function BotonModo({
  activo, onClick, icon: Icon, titulo, pie,
}: { activo: boolean; onClick: () => void; icon: typeof Upload; titulo: string; pie: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 transition ${
        activo
          ? "border-[#22C55E]/60 bg-[#22C55E]/[0.08]"
          : "border-[#2A2D34] hover:border-white/25"
      }`}
    >
      <Icon className={`h-4 w-4 ${activo ? "text-[#4ADE80]" : "text-white/50"}`} />
      <span className={`text-xs font-semibold ${activo ? "text-white" : "text-white/70"}`}>{titulo}</span>
      <span className="text-[11px] text-white/40">{pie}</span>
    </button>
  )
}

function Campo({
  id, etiqueta, valor, onChange, placeholder,
}: { id: string; etiqueta: string; valor: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-white/70">{etiqueta}</label>
      <input
        id={id}
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#2A2D34] bg-[#0F0F12] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#22C55E]/60 focus:outline-none"
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
