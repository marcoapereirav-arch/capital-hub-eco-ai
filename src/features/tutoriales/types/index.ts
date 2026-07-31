/** Tutoriales: formacion interna del equipo (PRP-008). */

export type FuenteVideo = "bunny" | "loom"
export type EstadoTutorial = "draft" | "published"

export type Carpeta = {
  id: string
  nombre: string
  descripcion: string | null
  display_order: number
}

export type Tutorial = {
  id: string
  folder_id: string
  titulo: string
  descripcion: string | null
  fuente: FuenteVideo
  bunny_video_id: string | null
  loom_url: string | null
  duracion_seg: number | null
  status: EstadoTutorial
  display_order: number
}

export type CarpetaConTutoriales = Carpeta & { tutoriales: Tutorial[] }

/** Lo que necesita el reproductor, ya resuelto por fuente. */
export type Reproducible = {
  /** URL lista para meter en un iframe. */
  embedUrl: string
  /** Miniatura, si la fuente la da. Loom no siempre. */
  posterUrl: string | null
}

/**
 * Un Loom valido y su forma incrustable.
 *
 * Loom comparte con `/share/<id>` y sirve el incrustado en `/embed/<id>`.
 * Se aceptan las dos por si Marco pega una u otra, y tambien el formato con
 * parametros (`?t=30`) que Loom añade al copiar desde el reproductor.
 *
 * OJO: esto NO se da por bueno de memoria. La comprobacion real se hace contra
 * un link de verdad de Marco antes de dar la seccion por terminada (REGLA #5).
 */
const LOOM_RE = /^https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/

export function idDeLoom(url: string): string | null {
  const m = url.trim().match(LOOM_RE)
  return m ? m[1] : null
}

export function esLoomValido(url: string): boolean {
  return idDeLoom(url) !== null
}

/** Resuelve como se reproduce un tutorial, sea cual sea su origen. */
export function comoSeReproduce(t: Tutorial, libraryId: string, cdnHostname: string): Reproducible | null {
  if (t.fuente === "loom") {
    const id = t.loom_url ? idDeLoom(t.loom_url) : null
    if (!id) return null
    return { embedUrl: `https://www.loom.com/embed/${id}`, posterUrl: null }
  }

  if (!t.bunny_video_id) return null
  return {
    embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${t.bunny_video_id}`,
    posterUrl: `https://${cdnHostname}/${t.bunny_video_id}/thumbnail.jpg`,
  }
}

/** "8 min" / "45 s". Sin duracion no se inventa nada: se devuelve null. */
export function duracionLegible(seg: number | null): string | null {
  if (!seg || seg <= 0) return null
  if (seg < 60) return `${Math.round(seg)} s`
  return `${Math.round(seg / 60)} min`
}
