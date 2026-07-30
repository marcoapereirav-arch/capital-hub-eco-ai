import "server-only"
import { createClient } from "@supabase/supabase-js"
import { borrar, copiarDesdeUrl, hayStorage } from "@/lib/bunny-storage"
import { archivoLeccion } from "@/lib/bunny-rutas"
import { asegurarColecciones, asegurarEstructura } from "@/lib/bunny-estructura"

/**
 * El barrido que va guardando cada vídeo en su carpeta del archivo ordenado.
 *
 * Por qué es un barrido y no se hace al subir: Bunny tarda en procesar el vídeo,
 * y hasta que no termina no hay nada que copiar. Un vídeo largo tarda más de lo
 * que puede durar una llamada. Así que esto pasa cada rato, mira qué falta y lo
 * va guardando. Si algo falla, en la vuelta siguiente lo reintenta solo.
 *
 * También se ocupa de las mudanzas: si al formador le cambió el nombre a la
 * lección, el vídeo aparece en el nombre nuevo y la copia vieja se retira, para
 * que nunca haya dos.
 */

const RESOLUCIONES = [1080, 720, 480, 360]
/** Cuántas lecciones como mucho por vuelta, para no pasarse del tiempo. */
const POR_VUELTA = 8

type Fila = {
  id: number
  title: string | null
  bunny_video_id: string | null
  bunny_storage_path: string | null
  // El módulo guarda su nombre en `name`; `title` es de la lección.
  modules: {
    name: string | null
    formations: { routes: { name: string | null } | null } | null
  } | null
}

export type Resultado = {
  ok: boolean
  omitido?: string
  guardados: string[]
  fallos: { leccion: number; motivo: string }[]
  quedan: number
  procesando: number
}

export async function archivarPendientes(): Promise<Resultado> {
  const vacio: Resultado = { ok: true, guardados: [], fallos: [], quedan: 0, procesando: 0 }

  if (!hayStorage()) return { ...vacio, omitido: "Bunny Storage sin configurar." }
  const cdn = process.env.BUNNY_CDN_HOSTNAME
  if (!cdn) return { ...vacio, omitido: "Falta BUNNY_CDN_HOSTNAME." }

  // El árbol base se monta solo en la primera vuelta que encuentra las claves
  // puestas: nadie tiene que entrar a Bunny a crear carpetas a mano. Que esto
  // falle no puede impedir archivar, así que no corta.
  await asegurarEstructura().catch((e) => console.error("[bunny] estructura", e))
  await asegurarColecciones().catch((e) => console.error("[bunny] colecciones", e))

  const cliente = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data, error } = await cliente
    .from("lessons")
    .select(
      "id, title, bunny_video_id, bunny_storage_path, modules:module_id(name, formations:formation_id(routes:route_id(name)))",
    )
    .not("bunny_video_id", "is", null)
    .limit(500)

  if (error) throw new Error(error.message)

  const pendientes: { fila: Fila; destino: string }[] = []
  for (const bruta of (data ?? []) as unknown as Fila[]) {
    const formacion = bruta.modules?.formations?.routes?.name
    const modulo = bruta.modules?.name
    if (!formacion || !modulo) continue
    const destino = archivoLeccion(formacion, modulo, bruta.title ?? "")
    if (bruta.bunny_storage_path === destino) continue
    pendientes.push({ fila: bruta, destino })
  }

  const guardados: string[] = []
  const fallos: { leccion: number; motivo: string }[] = []
  let procesando = 0

  for (const { fila, destino } of pendientes.slice(0, POR_VUELTA)) {
    try {
      const origen = await mejorMp4(cdn, fila.bunny_video_id!)
      if (!origen) {
        // Bunny sigue procesándolo. No es un fallo: en la vuelta siguiente estará.
        procesando += 1
        continue
      }
      await copiarDesdeUrl(origen, destino)

      // Si estaba archivado en otro sitio (le cambiaron el nombre a la lección),
      // se retira la copia vieja para no dejar dos.
      if (fila.bunny_storage_path && fila.bunny_storage_path !== destino) {
        await borrar(fila.bunny_storage_path).catch(() => {})
      }

      await cliente.from("lessons").update({ bunny_storage_path: destino }).eq("id", fila.id)
      guardados.push(destino)
    } catch (e) {
      fallos.push({ leccion: fila.id, motivo: e instanceof Error ? e.message : "error" })
    }
  }

  return {
    ok: true,
    guardados,
    fallos,
    quedan: Math.max(0, pendientes.length - POR_VUELTA),
    procesando,
  }
}

/**
 * Bunny genera un MP4 por cada calidad que consigue sacar. Se busca la mejor que
 * exista de verdad, que es la que mejor sirve como copia de seguridad. Si no
 * existe ninguna, el vídeo aún se está procesando.
 */
async function mejorMp4(cdn: string, guid: string): Promise<string | null> {
  for (const alto of RESOLUCIONES) {
    const candidata = `https://${cdn}/${guid}/play_${alto}p.mp4`
    const res = await fetch(candidata, { method: "HEAD", cache: "no-store" }).catch(() => null)
    if (res?.ok) return candidata
  }
  return null
}
