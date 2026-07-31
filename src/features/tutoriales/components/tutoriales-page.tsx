"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FolderPlus, Plus, GraduationCap } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Tarjeta } from "./tarjeta"
import { TarjetaCarpeta } from "./tarjeta-carpeta"
import { Migas } from "./migas"
import { Reproductor } from "./reproductor"
import { NuevoTutorial } from "./nuevo-tutorial"
import { PanelNombre, PanelMover, PanelBorrar } from "./panel"
import { caminoHasta, contarDentro, descendientes, type Carpeta, type Tutorial } from "../types"

type Datos = {
  esAdmin: boolean
  libraryId: string
  cdnHostname: string
  carpetas: Carpeta[]
  videos: Tutorial[]
}

/** Que panel esta abierto ahora mismo. */
type Panel =
  | { tipo: "crear" }
  | { tipo: "renombrar-carpeta"; carpeta: Carpeta }
  | { tipo: "mover-carpeta"; carpeta: Carpeta }
  | { tipo: "borrar-carpeta"; carpeta: Carpeta }
  | { tipo: "renombrar-video"; video: Tutorial }
  | { tipo: "mover-video"; video: Tutorial }
  | { tipo: "borrar-video"; video: Tutorial }
  | { tipo: "nuevo-video" }
  | null

export function TutorialesPage() {
  const router = useRouter()
  const params = useSearchParams()
  // Donde estas vive en la direccion: el boton de atras del navegador funciona
  // y se puede pasar el enlace de una carpeta concreta.
  const carpetaActualId = params.get("carpeta")

  const [datos, setDatos] = useState<Datos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viendo, setViendo] = useState<Tutorial | null>(null)
  const [panel, setPanel] = useState<Panel>(null)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/tutoriales").then((r) => r.json())
      if (res.error) {
        setError(res.error)
        return
      }
      setError(null)
      setDatos(res)
    } catch {
      setError("No se pudieron cargar los tutoriales.")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const carpetas = useMemo(() => datos?.carpetas ?? [], [datos])
  const videos = useMemo(() => datos?.videos ?? [], [datos])
  const esAdmin = datos?.esAdmin ?? false

  const carpetaActual = carpetaActualId ? carpetas.find((c) => c.id === carpetaActualId) ?? null : null
  /* Si la carpeta de la direccion ya no existe (la borro alguien, o el enlace
   * es viejo), se dice y se ofrece volver, en vez de dejar una pantalla vacia
   * que parece un fallo. */
  const perdido = Boolean(carpetaActualId) && !carpetaActual && !cargando

  const camino = carpetaActual ? caminoHasta(carpetaActual.id, carpetas) : []
  const subcarpetas = carpetas.filter((c) => c.parent_id === (carpetaActual?.id ?? null))
  const videosAqui = carpetaActual ? videos.filter((v) => v.folder_id === carpetaActual.id) : []

  function ir(id: string | null) {
    router.push(id ? `/tutoriales?carpeta=${id}` : "/tutoriales")
  }

  /** Manda el cambio y devuelve el error para enseñarlo DENTRO del panel. */
  async function pedir(url: string, opciones: RequestInit): Promise<string | null> {
    try {
      const res = await fetch(url, opciones).then((r) => r.json())
      if (res.error) return res.error
      await cargar()
      return null
    } catch {
      return "No se pudo conectar. Inténtalo otra vez."
    }
  }

  const crearCarpeta = (nombre: string) =>
    pedir("/api/tutoriales/carpetas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, parent_id: carpetaActual?.id ?? null }),
    })

  const renombrarCarpeta = (id: string, nombre: string) =>
    pedir("/api/tutoriales/carpetas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nombre }),
    })

  const moverCarpeta = (id: string, destino: string | null) =>
    pedir("/api/tutoriales/carpetas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, parent_id: destino }),
    })

  const borrarCarpeta = (id: string) => pedir(`/api/tutoriales/carpetas?id=${id}`, { method: "DELETE" })

  const editarVideo = (id: string, cambios: Record<string, unknown>) =>
    pedir("/api/tutoriales/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...cambios }),
    })

  const borrarVideo = (id: string) => pedir(`/api/tutoriales/videos?id=${id}`, { method: "DELETE" })

  async function publicar(t: Tutorial, publicar: boolean) {
    const fallo = await editarVideo(t.id, { status: publicar ? "published" : "draft" })
    if (fallo) setError(fallo)
  }

  if (cargando) {
    return (
      <>
        <ShellHeader title="Tutoriales" />
        <PageContainer>
          <LoadingScreen fullscreen={false} className="min-h-[60vh]" />
        </PageContainer>
      </>
    )
  }

  const vacio = subcarpetas.length === 0 && videosAqui.length === 0

  return (
    <>
      <ShellHeader title="Tutoriales" />
      <PageContainer>
        {carpetaActual ? <Migas camino={camino} onIr={ir} /> : null}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white">
              {carpetaActual ? carpetaActual.nombre : "Tutoriales"}
            </h1>
            <p className="mt-0.5 text-sm text-white/50">
              {carpetaActual
                ? carpetaActual.descripcion || "Carpetas y vídeos que hay aquí dentro."
                : "Cómo se usa el sistema, en vídeo. Para el equipo interno."}
            </p>
          </div>

          {esAdmin ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPanel({ tipo: "crear" })}
                className="inline-flex items-center gap-2 rounded-lg border border-[#2A2D34] px-3.5 py-2 text-sm font-medium text-white/75 transition hover:border-[#22C55E]/50 hover:text-white"
              >
                <FolderPlus className="h-4 w-4" />
                Nueva carpeta
              </button>
              {/* Un video vive DENTRO de una carpeta, nunca suelto en la raiz:
                  por eso el boton solo aparece cuando has entrado en una. */}
              {carpetaActual ? (
                <button
                  type="button"
                  onClick={() => setPanel({ tipo: "nuevo-video" })}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-3.5 py-2 text-sm font-semibold text-[#0F0F12] transition hover:bg-[#4ADE80]"
                >
                  <Plus className="h-4 w-4" />
                  Añadir vídeo
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {perdido ? (
          <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3 text-sm text-amber-200">
            Esa carpeta ya no existe.{" "}
            <button type="button" onClick={() => ir(null)} className="underline hover:text-white">
              Volver al principio
            </button>
          </p>
        ) : null}

        {error ? (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/[0.06] p-3 text-sm text-red-300">{error}</p>
        ) : null}

        {vacio ? (
          <Vacio
            esAdmin={esAdmin}
            dentroDeCarpeta={Boolean(carpetaActual)}
            onCrear={() => setPanel({ tipo: "crear" })}
            onAñadir={() => setPanel({ tipo: "nuevo-video" })}
          />
        ) : (
          <div className="space-y-8">
            {subcarpetas.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Carpetas</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {subcarpetas.map((c) => (
                    <TarjetaCarpeta
                      key={c.id}
                      carpeta={c}
                      dentro={contarDentro(c.id, carpetas, videos)}
                      esAdmin={esAdmin}
                      onAbrir={() => ir(c.id)}
                      onRenombrar={() => setPanel({ tipo: "renombrar-carpeta", carpeta: c })}
                      onMover={() => setPanel({ tipo: "mover-carpeta", carpeta: c })}
                      onBorrar={() => setPanel({ tipo: "borrar-carpeta", carpeta: c })}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {videosAqui.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Vídeos</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {videosAqui.map((t) => (
                    <Tarjeta
                      key={t.id}
                      tutorial={t}
                      libraryId={datos?.libraryId ?? ""}
                      cdnHostname={datos?.cdnHostname ?? ""}
                      esAdmin={esAdmin}
                      onAbrir={() => setViendo(t)}
                      onPublicar={(p) => publicar(t, p)}
                      onRenombrar={() => setPanel({ tipo: "renombrar-video", video: t })}
                      onMover={() => setPanel({ tipo: "mover-video", video: t })}
                      onBorrar={() => setPanel({ tipo: "borrar-video", video: t })}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </PageContainer>

      {viendo ? (
        <Reproductor
          tutorial={viendo}
          libraryId={datos?.libraryId ?? ""}
          cdnHostname={datos?.cdnHostname ?? ""}
          onCerrar={() => setViendo(null)}
        />
      ) : null}

      {panel?.tipo === "crear" ? (
        <PanelNombre
          titulo="Nueva carpeta"
          pie={carpetaActual ? `Se crea dentro de ${carpetaActual.nombre}` : "Se crea en Tutoriales"}
          etiqueta="Nombre"
          accion="Crear carpeta"
          onGuardar={crearCarpeta}
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel?.tipo === "renombrar-carpeta" ? (
        <PanelNombre
          titulo="Renombrar carpeta"
          valorInicial={panel.carpeta.nombre}
          etiqueta="Nombre"
          accion="Guardar"
          onGuardar={(n) => renombrarCarpeta(panel.carpeta.id, n)}
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel?.tipo === "mover-carpeta" ? (
        <PanelMover
          titulo={`Mover "${panel.carpeta.nombre}"`}
          carpetas={carpetas}
          actual={panel.carpeta.parent_id}
          // Ni dentro de si misma ni dentro de una de sus subcarpetas: seria un
          // anillo. La base tambien lo impide, pero aqui ni se ofrece.
          prohibidas={descendientes(panel.carpeta.id, carpetas)}
          onMover={(destino) => moverCarpeta(panel.carpeta.id, destino)}
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel?.tipo === "borrar-carpeta" ? (
        <PanelBorrar
          nombre={panel.carpeta.nombre}
          dentro={contarDentro(panel.carpeta.id, carpetas, videos)}
          onBorrar={async () => {
            const fallo = await borrarCarpeta(panel.carpeta.id)
            // Si estabas dentro de lo que acabas de borrar, no puedes quedarte.
            if (!fallo && camino.some((c) => c.id === panel.carpeta.id)) ir(panel.carpeta.parent_id)
            return fallo
          }}
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel?.tipo === "renombrar-video" ? (
        <PanelNombre
          titulo="Renombrar vídeo"
          valorInicial={panel.video.titulo}
          etiqueta="Título"
          accion="Guardar"
          onGuardar={(n) => editarVideo(panel.video.id, { titulo: n })}
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel?.tipo === "mover-video" ? (
        <PanelMover
          titulo={`Mover "${panel.video.titulo}"`}
          carpetas={carpetas}
          actual={panel.video.folder_id}
          // Un video siempre vive dentro de una carpeta: la raiz no vale.
          prohibidas={new Set()}
          onMover={(destino) =>
            destino
              ? editarVideo(panel.video.id, { folder_id: destino })
              : Promise.resolve("Un vídeo tiene que estar dentro de una carpeta.")
          }
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel?.tipo === "borrar-video" ? (
        <PanelBorrar
          nombre={panel.video.titulo}
          dentro={null}
          onBorrar={() => borrarVideo(panel.video.id)}
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel?.tipo === "nuevo-video" && carpetaActual ? (
        <NuevoTutorial
          carpetaId={carpetaActual.id}
          carpetaNombre={carpetaActual.nombre}
          onCerrar={() => setPanel(null)}
          onListo={() => {
            setPanel(null)
            void cargar()
          }}
        />
      ) : null}
    </>
  )
}

function Vacio({
  esAdmin, dentroDeCarpeta, onCrear, onAñadir,
}: { esAdmin: boolean; dentroDeCarpeta: boolean; onCrear: () => void; onAñadir: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2A2D34] px-6 py-16 text-center">
      <GraduationCap className="mb-4 h-10 w-10 text-[#2A2D34]" />
      <h2 className="text-base font-semibold text-white">
        {dentroDeCarpeta ? "Esta carpeta está vacía" : "Todavía no hay tutoriales"}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/50">
        {!esAdmin
          ? "Cuando se publique el primero, aparecerá aquí."
          : dentroDeCarpeta
            ? "Añade un vídeo, o crea otra carpeta dentro."
            : "Crea la primera carpeta para empezar a organizar."}
      </p>
      {esAdmin ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {dentroDeCarpeta ? (
            <button
              type="button"
              onClick={onAñadir}
              className="inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-[#0F0F12] transition hover:bg-[#4ADE80]"
            >
              <Plus className="h-4 w-4" />
              Añadir vídeo
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCrear}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              dentroDeCarpeta
                ? "border border-[#2A2D34] text-white/75 hover:border-[#22C55E]/50 hover:text-white"
                : "bg-[#22C55E] text-[#0F0F12] hover:bg-[#4ADE80]"
            }`}
          >
            <FolderPlus className="h-4 w-4" />
            {dentroDeCarpeta ? "Crear subcarpeta" : "Crear la primera carpeta"}
          </button>
        </div>
      ) : null}
    </div>
  )
}
