/** Tutoriales: formacion interna del equipo (PRP-008). */

export type FuenteVideo = "bunny" | "loom"
export type EstadoTutorial = "draft" | "published"

export type Carpeta = {
  id: string
  nombre: string
  descripcion: string | null
  /** null = esta en la raiz. Si no, cuelga de otra carpeta. Sin limite de niveles. */
  parent_id: string | null
  display_order: number
}

/** Lo que hay dentro de una carpeta (o de la raiz): carpetas y videos. */
export type Contenido = {
  carpetas: Carpeta[]
  videos: Tutorial[]
}

/** Cuenta lo que cuelga de una carpeta, contando TODO lo que hay mas abajo. */
export function contarDentro(
  carpetaId: string | null,
  carpetas: Carpeta[],
  videos: Tutorial[],
): { carpetas: number; videos: number } {
  const hijas = carpetas.filter((c) => c.parent_id === carpetaId)
  let nCarpetas = hijas.length
  let nVideos = videos.filter((v) => v.folder_id === carpetaId).length

  for (const h of hijas) {
    const dentro = contarDentro(h.id, carpetas, videos)
    nCarpetas += dentro.carpetas
    nVideos += dentro.videos
  }
  return { carpetas: nCarpetas, videos: nVideos }
}

/**
 * Una carpeta y todo lo que cuelga de ella.
 *
 * Sirve para no ofrecer como destino algo que crearia un anillo: mover una
 * carpeta dentro de si misma o dentro de una de sus hijas. La base tambien lo
 * impide, pero es mejor no ofrecerlo que dejar pulsar y dar error.
 */
export function descendientes(carpetaId: string, carpetas: Carpeta[]): Set<string> {
  const fuera = new Set<string>([carpetaId])
  let creciendo = true
  let vueltas = 0

  while (creciendo && vueltas < 100) {
    creciendo = false
    vueltas++
    for (const c of carpetas) {
      if (c.parent_id && fuera.has(c.parent_id) && !fuera.has(c.id)) {
        fuera.add(c.id)
        creciendo = true
      }
    }
  }
  return fuera
}

/**
 * El camino desde la raiz hasta una carpeta, para las migas de pan.
 *
 * Lleva un tope de saltos por seguridad: si algun dia hubiera un anillo en los
 * datos, esto se quedaria dando vueltas y colgaria la pantalla. La base ya lo
 * impide con un disparador, pero la pantalla no se fia.
 */
export function caminoHasta(carpetaId: string, carpetas: Carpeta[]): Carpeta[] {
  const porId = new Map(carpetas.map((c) => [c.id, c]))
  const camino: Carpeta[] = []
  let actual = porId.get(carpetaId)
  let saltos = 0

  while (actual && saltos < 100) {
    camino.unshift(actual)
    actual = actual.parent_id ? porId.get(actual.parent_id) : undefined
    saltos++
  }
  return camino
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
  /** Portada. Bunny la genera sola; en Loom la da su oEmbed al pegar el link. */
  miniatura: string | null
  status: EstadoTutorial
  display_order: number
}

/** Lo que Loom cuenta de un video al pegar su link. */
export type DatosLoom = {
  titulo: string | null
  duracion_seg: number | null
  miniatura: string | null
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
    // Comprobado el 2026-07-31 con un video real: `/embed/` responde 200 y no
    // pone X-Frame-Options, asi que se deja incrustar. (Un id que no existe
    // redirige a la portada de Loom, y ESA si lo prohibe: no es el mismo caso.)
    return { embedUrl: `https://www.loom.com/embed/${id}`, posterUrl: t.miniatura }
  }

  if (!t.bunny_video_id) return null
  return {
    embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${t.bunny_video_id}`,
    posterUrl: t.miniatura ?? `https://${cdnHostname}/${t.bunny_video_id}/thumbnail.jpg`,
  }
}

/** "8 min" / "45 s". Sin duracion no se inventa nada: se devuelve null. */
export function duracionLegible(seg: number | null): string | null {
  if (!seg || seg <= 0) return null
  if (seg < 60) return `${Math.round(seg)} s`
  return `${Math.round(seg / 60)} min`
}
