"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FolderPlus, Plus, GraduationCap } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { Button } from "@/components/ui/button"
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
  // Un clic selecciona, dos abren. Como en Drive.
  const [seleccion, setSeleccion] = useState<string | null>(null)

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
    // Al cambiar de sitio no se arrastra lo seleccionado del sitio anterior.
    setSeleccion(null)
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
        <PageContainer>
          <LoadingScreen fullscreen={false} className="min-h-[60dvh]" />
        </PageContainer>
      </>
    )
  }

  const vacio = subcarpetas.length === 0 && videosAqui.length === 0

  return (
    <>
      {/* Un clic en el fondo deselecciona, como en cualquier escritorio.
          El alto minimo NO es decorativo: sin el, esta capa solo mide lo que
          miden las tarjetas, y el hueco vacio de debajo (que es justo donde
          uno pulsa para soltar la seleccion) se queda fuera y no responde. */}
      <div onClick={() => setSeleccion(null)} className="min-h-[calc(100dvh-4rem)]">
      <PageContainer>
        {carpetaActual ? <Migas camino={camino} onIr={ir} /> : null}

        {/* En telefono el titulo y las acciones se apilan, y los botones van a
            ancho completo: en una fila se salian por la derecha. */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground">
              {carpetaActual ? carpetaActual.nombre : "Tutoriales"}
            </h1>
            <p className="mt-0.5 text-[15px] text-muted-foreground">
              {carpetaActual
                ? carpetaActual.descripcion || "Carpetas y vídeos que hay aquí dentro."
                : "Cómo se usa el sistema, en vídeo. Para el equipo interno."}
            </p>
            {/* La regla se dice una vez, en vez de que cada uno la descubra
                haciendo clic y esperando a que pase algo. */}
            <p className="mt-1 text-sm text-muted-foreground">Doble clic para abrir.</p>
          </div>

          {esAdmin ? (
            <div className="flex shrink-0 flex-col gap-2 md:flex-row">
              <Button
                variant="outline"
                /* Se apaga mientras la direccion todavia apunta a una carpeta
                   que aun no se ha cargado. Si no, al pulsar justo despues de
                   entrar en una carpeta, la nueva colgaria de la ANTERIOR: el
                   sitio donde crees que estas y el que sabe la pantalla no son
                   el mismo durante ese instante. */
                disabled={Boolean(carpetaActualId) && !carpetaActual}
                onClick={() => setPanel({ tipo: "crear" })}
              >
                <FolderPlus className="mr-1.5 h-4 w-4" />
                Nueva carpeta
              </Button>
              {/* Un video vive DENTRO de una carpeta, nunca suelto en la raiz:
                  por eso el boton solo aparece cuando has entrado en una. */}
              {carpetaActual ? (
                <Button onClick={() => setPanel({ tipo: "nuevo-video" })}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Añadir vídeo
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {perdido ? (
          <p className="mb-6 rounded-lg border border-warn/30 bg-warn/10 p-3 text-[15px] text-warn">
            Esa carpeta ya no existe.{" "}
            <button type="button" onClick={() => ir(null)} className="underline">
              Volver al principio
            </button>
          </p>
        ) : null}

        {error ? (
          <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-[15px] text-destructive">{error}</p>
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
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Carpetas</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {subcarpetas.map((c) => (
                    <TarjetaCarpeta
                      key={c.id}
                      carpeta={c}
                      dentro={contarDentro(c.id, carpetas, videos)}
                      esAdmin={esAdmin}
                      seleccionada={seleccion === c.id}
                      onSeleccionar={() => setSeleccion(c.id)}
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
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Vídeos</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {videosAqui.map((t) => (
                    <Tarjeta
                      key={t.id}
                      tutorial={t}
                      libraryId={datos?.libraryId ?? ""}
                      cdnHostname={datos?.cdnHostname ?? ""}
                      esAdmin={esAdmin}
                      seleccionado={seleccion === t.id}
                      onSeleccionar={() => setSeleccion(t.id)}
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
      </div>

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
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <GraduationCap className="h-10 w-10 text-muted-foreground" />
      <h2 className="text-[17px] font-semibold text-foreground">
        {dentroDeCarpeta ? "Esta carpeta está vacía" : "Todavía no hay tutoriales"}
      </h2>
      <p className="max-w-[38ch] text-[15px] leading-relaxed text-muted-foreground">
        {!esAdmin
          ? "Cuando se publique el primero, aparecerá aquí."
          : dentroDeCarpeta
            ? "Añade un vídeo, o crea otra carpeta dentro."
            : "Crea la primera carpeta para empezar a organizar."}
      </p>
      {esAdmin ? (
        <div className="flex w-full flex-col justify-center gap-2 md:w-auto md:flex-row">
          {dentroDeCarpeta ? (
            <Button onClick={onAñadir}>
              <Plus className="mr-1.5 h-4 w-4" />
              Añadir vídeo
            </Button>
          ) : null}
          <Button variant={dentroDeCarpeta ? "outline" : "default"} onClick={onCrear}>
            <FolderPlus className="mr-1.5 h-4 w-4" />
            {dentroDeCarpeta ? "Crear subcarpeta" : "Crear la primera carpeta"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
