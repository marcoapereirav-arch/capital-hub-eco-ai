"use client"

import { useCallback, useEffect, useState } from "react"
import { FolderPlus, Plus, GraduationCap, Trash2 } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Tarjeta } from "./tarjeta"
import { Reproductor } from "./reproductor"
import { NuevoTutorial } from "./nuevo-tutorial"
import type { CarpetaConTutoriales, Tutorial } from "../types"

type Datos = {
  esAdmin: boolean
  libraryId: string
  cdnHostname: string
  carpetas: CarpetaConTutoriales[]
}

export function TutorialesPage() {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viendo, setViendo] = useState<Tutorial | null>(null)
  const [añadiendoEn, setAñadiendoEn] = useState<CarpetaConTutoriales | null>(null)

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

  async function crearCarpeta() {
    const nombre = window.prompt("¿Cómo se llama la carpeta?")
    if (!nombre?.trim()) return
    const res = await fetch("/api/tutoriales/carpetas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim() }),
    }).then((r) => r.json())
    if (res.error) return setError(res.error)
    void cargar()
  }

  async function borrarCarpeta(c: CarpetaConTutoriales) {
    const n = c.tutoriales.length
    const aviso = n
      ? `Vas a borrar "${c.nombre}" y sus ${n} ${n === 1 ? "vídeo" : "vídeos"}. Esto no se puede deshacer.`
      : `Vas a borrar la carpeta "${c.nombre}".`
    if (!window.confirm(aviso)) return
    const res = await fetch(`/api/tutoriales/carpetas?id=${c.id}`, { method: "DELETE" }).then((r) => r.json())
    if (res.error) return setError(res.error)
    void cargar()
  }

  async function publicar(t: Tutorial, publicar: boolean) {
    const res = await fetch("/api/tutoriales/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, status: publicar ? "published" : "draft" }),
    }).then((r) => r.json())
    if (res.error) return setError(res.error)
    void cargar()
  }

  async function borrar(t: Tutorial) {
    if (!window.confirm(`Vas a borrar "${t.titulo}". Esto no se puede deshacer.`)) return
    const res = await fetch(`/api/tutoriales/videos?id=${t.id}`, { method: "DELETE" }).then((r) => r.json())
    if (res.error) return setError(res.error)
    void cargar()
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

  const esAdmin = datos?.esAdmin ?? false
  const carpetas = datos?.carpetas ?? []
  const sinNada = carpetas.length === 0

  return (
    <>
      <ShellHeader title="Tutoriales" />
      <PageContainer>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-white/55">
            Cómo se usa el sistema, en vídeo. Para el equipo interno.
          </p>
          {esAdmin ? (
            <button
              type="button"
              onClick={crearCarpeta}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/[0.08] px-3.5 py-2 text-sm font-medium text-[#4ADE80] transition hover:bg-[#22C55E]/[0.14]"
            >
              <FolderPlus className="h-4 w-4" />
              Nueva carpeta
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/[0.06] p-3 text-sm text-red-300">{error}</p>
        ) : null}

        {sinNada ? (
          <Vacio esAdmin={esAdmin} onCrear={crearCarpeta} />
        ) : (
          <div className="space-y-10">
            {carpetas.map((c) => (
              <section key={c.id}>
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#2A2D34] pb-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-white">{c.nombre}</h2>
                    <p className="mt-0.5 text-xs text-white/45">
                      {c.tutoriales.length === 0
                        ? "Todavía sin vídeos"
                        : `${c.tutoriales.length} ${c.tutoriales.length === 1 ? "vídeo" : "vídeos"}`}
                    </p>
                  </div>
                  {esAdmin ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAñadiendoEn(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2D34] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-[#22C55E]/50 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Añadir vídeo
                      </button>
                      <button
                        type="button"
                        onClick={() => borrarCarpeta(c)}
                        aria-label={`Borrar la carpeta ${c.nombre}`}
                        className="rounded-lg p-2 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>

                {c.tutoriales.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#2A2D34] px-4 py-8 text-center text-sm text-white/40">
                    {esAdmin ? "Añade el primer vídeo de esta carpeta." : "Todavía no hay nada aquí."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {c.tutoriales.map((t) => (
                      <Tarjeta
                        key={t.id}
                        tutorial={t}
                        libraryId={datos?.libraryId ?? ""}
                        cdnHostname={datos?.cdnHostname ?? ""}
                        esAdmin={esAdmin}
                        onAbrir={() => setViendo(t)}
                        onPublicar={(p) => publicar(t, p)}
                        onBorrar={() => borrar(t)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
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

      {añadiendoEn ? (
        <NuevoTutorial
          carpetaId={añadiendoEn.id}
          carpetaNombre={añadiendoEn.nombre}
          onCerrar={() => setAñadiendoEn(null)}
          onListo={() => {
            setAñadiendoEn(null)
            void cargar()
          }}
        />
      ) : null}
    </>
  )
}

function Vacio({ esAdmin, onCrear }: { esAdmin: boolean; onCrear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2A2D34] px-6 py-16 text-center">
      <GraduationCap className="mb-4 h-10 w-10 text-[#2A2D34]" />
      <h2 className="text-base font-semibold text-white">Todavía no hay tutoriales</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/50">
        {esAdmin
          ? "Crea una carpeta y sube el primer vídeo, o pega un link de Loom."
          : "Cuando se publique el primero, aparecerá aquí."}
      </p>
      {esAdmin ? (
        <button
          type="button"
          onClick={onCrear}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-[#0F0F12] transition hover:bg-[#4ADE80]"
        >
          <FolderPlus className="h-4 w-4" />
          Crear la primera carpeta
        </button>
      ) : null}
    </div>
  )
}
